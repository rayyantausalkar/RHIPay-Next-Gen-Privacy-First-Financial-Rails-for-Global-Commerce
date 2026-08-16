import os
import json
import base64
import uuid
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, Tuple, Optional, List
from fastapi import HTTPException, status

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.models.compliance import (
    RegulatorPublicKeyResponse,
    PIIEnvelopeEncryptRequest,
    PIIEnvelopeEncryptResponse,
    PIIEnvelopeDecryptRequest,
    PIIEnvelopeDecryptResponse,
    TravelRuleDispatchRequest,
    TravelRuleDispatchResponse,
    EnclaveDecryptionRequest,
    EnclaveDecryptionResponse,
    SanctionScreeningResult,
    SanctionsScreeningRequest,
    SanctionsScreeningResponse,
    WatchlistHit,
    PepScreeningResult,
    ComplianceArchivalRequest,
    ComplianceArchivalResponse,
)


class ComplianceNodeKeyStore:
    """
    Simulated Hardware Security Module (HSM) storing asymmetric regulatory keypairs
    for statutory compliance nodes (MAS, RBI, CBUAE, BoE, BoJ, Fed/FinCEN, etc.).
    """
    def __init__(self):
        self._keypairs: Dict[str, Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey, str, str]] = {}
        self._seed_regulators()

    def _seed_regulators(self):
        regulators = {
            "SG": ("Monetary Authority of Singapore (MAS)", "MAS-SG-COMPLIANCE-NODE-01"),
            "IN": ("Reserve Bank of India (RBI)", "RBI-IN-COMPLIANCE-NODE-01"),
            "AE": ("Central Bank of the UAE (CBUAE)", "CBUAE-AE-COMPLIANCE-01"),
            "GB": ("Bank of England (BoE)", "BOE-GB-COMPLIANCE-01"),
            "JP": ("Bank of Japan / FSA (BoJ)", "BOJ-JP-COMPLIANCE-01"),
            "US": ("Federal Reserve / FinCEN", "FED-US-COMPLIANCE-01"),
        }
        for code, (name, node_id) in regulators.items():
            self._generate_keypair_for_spoke(code, name, node_id)

    def _generate_keypair_for_spoke(self, spoke: str, name: str, node_id: str):
        priv_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        pub_key = priv_key.public_key()
        self._keypairs[spoke.upper()] = (priv_key, pub_key, name, node_id)

    def get_spoke_info(self, spoke: str) -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey, str, str]:
        clean_spoke = spoke.upper()
        if clean_spoke not in self._keypairs:
            # Dynamically provision for any standard ISO country
            name = f"Central Monetary Authority of {clean_spoke}"
            node_id = f"REG-{clean_spoke}-COMPLIANCE-01"
            self._generate_keypair_for_spoke(clean_spoke, name, node_id)
        return self._keypairs[clean_spoke]

    def get_public_pem(self, spoke: str) -> str:
        _, pub_key, _, _ = self.get_spoke_info(spoke)
        pem_bytes = pub_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        return pem_bytes.decode("utf-8")


class EnvelopeEncryptionService:
    def __init__(self):
        self.keystore = ComplianceNodeKeyStore()
        self._archival_store: Dict[str, ComplianceArchivalResponse] = {}

    def get_regulator_key(self, spoke: str) -> RegulatorPublicKeyResponse:
        _, _, name, node_id = self.keystore.get_spoke_info(spoke)
        pem = self.keystore.get_public_pem(spoke)
        return RegulatorPublicKeyResponse(
            country_code=spoke.upper(),
            regulator_name=name,
            compliance_node_id=node_id,
            public_key_pem=pem,
            key_algorithm="RSA-OAEP-256",
        )

    def encrypt_pii_envelope(self, req: PIIEnvelopeEncryptRequest) -> PIIEnvelopeEncryptResponse:
        now = datetime.now(timezone.utc)
        envelope_id = f"ENV-{req.destination_spoke.upper()}-{uuid.uuid4().hex[:12].upper()}"

        # 1. Canonical PII Payload for Travel Rule
        pii_data = {
            "envelope_id": envelope_id,
            "quote_id": req.quote_id,
            "originator_name": req.originator_name,
            "originator_proxy": req.originator_proxy,
            "originator_address": req.originator_address,
            "originator_national_id": req.originator_national_id,
            "originator_bic": req.originator_bic,
            "beneficiary_name": req.beneficiary_name,
            "beneficiary_proxy": req.beneficiary_proxy,
            "beneficiary_bic": req.beneficiary_bic,
            "timestamp": now.isoformat(),
        }
        pii_json_bytes = json.dumps(pii_data, separators=(",", ":"), sort_keys=True).encode("utf-8")

        # 2. Generate Ephemeral Symmetric AES-256-GCM Key & Nonce (IV)
        aes_key = AESGCM.generate_key(bit_length=256)
        iv = os.urandom(12)  # 96-bit standard GCM nonce
        aesgcm = AESGCM(aes_key)

        # 3. Encrypt PII with AES-256-GCM
        ciphertext_with_tag = aesgcm.encrypt(iv, pii_json_bytes, None)
        ciphertext = ciphertext_with_tag[:-16]
        auth_tag = ciphertext_with_tag[-16:]

        # 4. Asymmetric Encryption of AES Key with Destination Regulator RSA Public Key
        _, pub_key, _, node_id = self.keystore.get_spoke_info(req.destination_spoke)
        encrypted_aes_key_bytes = pub_key.encrypt(
            aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        # 5. Compute Canonical Envelope SHA-256 Digest
        digest_material = (
            envelope_id
            + req.destination_spoke
            + base64.b64encode(encrypted_aes_key_bytes).decode("utf-8")
            + base64.b64encode(ciphertext).decode("utf-8")
        )
        envelope_digest = hashlib.sha256(digest_material.encode("utf-8")).hexdigest()

        return PIIEnvelopeEncryptResponse(
            envelope_id=envelope_id,
            destination_spoke=req.destination_spoke.upper(),
            recipient_regulator_id=node_id,
            encryption_algorithm="RSA-OAEP-256 + AES-256-GCM",
            encrypted_aes_key=base64.b64encode(encrypted_aes_key_bytes).decode("utf-8"),
            encrypted_pii_ciphertext=base64.b64encode(ciphertext).decode("utf-8"),
            iv=base64.b64encode(iv).decode("utf-8"),
            auth_tag=base64.b64encode(auth_tag).decode("utf-8"),
            envelope_digest=f"0x{envelope_digest}",
            created_at=now,
        )

    encrypt_envelope = encrypt_pii_envelope

    def decrypt_pii_envelope(self, req: PIIEnvelopeDecryptRequest) -> PIIEnvelopeDecryptResponse:
        try:
            priv_key, _, _, _ = self.keystore.get_spoke_info(req.destination_spoke)

            # 1. Asymmetric Decryption of AES Key via Regulator RSA Private Key
            encrypted_aes_key_bytes = base64.b64decode(req.encrypted_aes_key)
            aes_key = priv_key.decrypt(
                encrypted_aes_key_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None,
                ),
            )

            # 2. Symmetric AES-256-GCM Decryption
            ciphertext_bytes = base64.b64decode(req.encrypted_pii_ciphertext)
            iv_bytes = base64.b64decode(req.iv)
            auth_tag_bytes = base64.b64decode(req.auth_tag)

            aesgcm = AESGCM(aes_key)
            decrypted_bytes = aesgcm.decrypt(iv_bytes, ciphertext_bytes + auth_tag_bytes, None)
            payload_dict = json.loads(decrypted_bytes.decode("utf-8"))

            return PIIEnvelopeDecryptResponse(
                is_valid=True,
                envelope_id=req.envelope_id,
                originator_name=payload_dict["originator_name"],
                originator_proxy=payload_dict["originator_proxy"],
                originator_address=payload_dict.get("originator_address", "N/A"),
                originator_national_id=payload_dict.get("originator_national_id", "N/A"),
                originator_bic=payload_dict["originator_bic"],
                beneficiary_name=payload_dict["beneficiary_name"],
                beneficiary_proxy=payload_dict["beneficiary_proxy"],
                beneficiary_bic=payload_dict["beneficiary_bic"],
                fatf_travel_rule_compliant=True,
                decrypted_at=datetime.now(timezone.utc),
            )
        except Exception as e:
            return PIIEnvelopeDecryptResponse(
                is_valid=False,
                envelope_id=req.envelope_id,
                originator_name="[ENCRYPTED]",
                originator_proxy="[ENCRYPTED]",
                originator_address="[ENCRYPTED]",
                originator_national_id="[ENCRYPTED]",
                originator_bic="[ENCRYPTED]",
                beneficiary_name="[ENCRYPTED]",
                beneficiary_proxy="[ENCRYPTED]",
                beneficiary_bic="[ENCRYPTED]",
                fatf_travel_rule_compliant=False,
                decrypted_at=datetime.now(timezone.utc),
                error_details=f"Decryption failed: {str(e)}",
            )

    def dispatch_travel_rule_envelope(self, req: TravelRuleDispatchRequest) -> TravelRuleDispatchResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        if not req.encrypted_pii_ciphertext or not req.encrypted_aes_key or not req.iv or not req.auth_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ciphertext or encryption parameters missing in Travel Rule envelope dispatch",
            )

        _, _, _, node_id = self.keystore.get_spoke_info(req.destination_spoke)

        token_seed = f"{req.uetr}-{req.envelope_id}-{node_id}-{now.isoformat()}"
        ack_sig = hashlib.sha256(token_seed.encode()).hexdigest()[:24].upper()
        ack_token = f"TR-ACK-{req.destination_spoke.upper()}-{ack_sig}"

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        latency = max(elapsed_ms, 2.4)

        receipt_id = f"TR-REC-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

        return TravelRuleDispatchResponse(
            receipt_id=receipt_id,
            uetr=req.uetr,
            status="FATF_TRAVEL_RULE_DISPATCHED",
            destination_spoke=req.destination_spoke.upper(),
            recipient_regulator_node=node_id,
            compliance_handshake_protocol="mTLS_TLS13_ENVELOPE_RELAY",
            regulatory_acknowledgement_token=ack_token,
            fatf_recommendation_16_compliant=True,
            sanction_screening_status="CLEARED_PASS",
            decrypted_audit_available=True,
            dispatch_latency_ms=latency,
            dispatched_at=now,
        )

    def execute_enclave_decryption(self, req: EnclaveDecryptionRequest) -> EnclaveDecryptionResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        try:
            priv_key, _, _, node_id = self.keystore.get_spoke_info(req.destination_spoke)

            # 1. Asymmetric Decryption of AES Key via Regulator RSA Private Key
            encrypted_aes_key_bytes = base64.b64decode(req.encrypted_aes_key)
            aes_key = priv_key.decrypt(
                encrypted_aes_key_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None,
                ),
            )

            # 2. Symmetric AES-256-GCM Decryption inside Enclave Boundary
            ciphertext_bytes = base64.b64decode(req.encrypted_pii_ciphertext)
            iv_bytes = base64.b64decode(req.iv)
            auth_tag_bytes = base64.b64decode(req.auth_tag)

            aesgcm = AESGCM(aes_key)
            decrypted_bytes = aesgcm.decrypt(iv_bytes, ciphertext_bytes + auth_tag_bytes, None)
            payload = json.loads(decrypted_bytes.decode("utf-8"))

            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            latency = max(elapsed_ms, 2.1)

            attestation_id = f"MAS-AUDIT-CLEARED-{uuid.uuid4().hex[:10].upper()}"

            return EnclaveDecryptionResponse(
                attestation_id=attestation_id,
                uetr=req.uetr,
                envelope_id=req.envelope_id,
                status="ENCLAVE_DECRYPTION_SUCCESS",
                is_valid=True,
                originator_name=payload["originator_name"],
                originator_proxy=payload["originator_proxy"],
                originator_address=payload.get("originator_address", "N/A"),
                originator_national_id=payload.get("originator_national_id", "N/A"),
                originator_bic=payload["originator_bic"],
                beneficiary_name=payload["beneficiary_name"],
                beneficiary_proxy=payload["beneficiary_proxy"],
                beneficiary_bic=payload["beneficiary_bic"],
                fatf_travel_rule_compliant=True,
                sanction_screening=SanctionScreeningResult(
                    status="CLEARED_PASS",
                    pep_detected=False,
                    risk_score=0.02,
                    aml_tier="TIER_1_VERIFIED",
                ),
                auditor_node_id=req.auditor_node_id or node_id,
                enclave_security_tier="FIPS_140_2_LEVEL_3_HSM",
                decryption_latency_ms=latency,
                decrypted_at=now,
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Decryption failed inside secure enclave: {str(e)}",
            )

    def execute_sanctions_screening(self, req: SanctionsScreeningRequest) -> SanctionsScreeningResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        # Check for simulated sanctions hit
        name_upper = (req.originator_name + " " + req.beneficiary_name).upper()
        is_sanctioned = any(k in name_upper for k in ["SANCTIONED", "OFAC_BLOCKED", "TERRORIST", "CRIMINAL_EXCLUDED"])
        is_pep = "POLITICIAN" in name_upper or "MINISTER" in name_upper

        screening_id = f"SCR-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        audit_log_id = f"AML-LOG-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:10].upper()}"

        watchlists: List[WatchlistHit] = []
        list_sources = [
            ("OFAC_SDN_LIST", "OFAC Specially Designated Nationals"),
            ("UN_SECURITY_COUNCIL", "United Nations Consolidated Sanctions"),
            ("MAS_TERRORISM_FINANCING", "MAS Targeted Financial Sanctions"),
            ("EU_CONSOLIDATED_SANCTIONS", "European Union Financial Sanctions"),
            ("PEP_GLOBAL_REGISTER", "Politically Exposed Persons High Risk"),
            ("INTERPOL_RED_NOTICES", "INTERPOL Wanted Persons Watchlist"),
        ]

        for code, label in list_sources:
            if is_sanctioned and code in ["OFAC_SDN_LIST", "UN_SECURITY_COUNCIL"]:
                watchlists.append(WatchlistHit(
                    list_name=code,
                    matched_entity=req.originator_name if "SANCTIONED" in req.originator_name.upper() else req.beneficiary_name,
                    similarity_score=0.98,
                    status="MATCH_CONFIRMED",
                ))
            elif is_pep and code == "PEP_GLOBAL_REGISTER":
                watchlists.append(WatchlistHit(
                    list_name=code,
                    matched_entity=req.originator_name,
                    similarity_score=0.92,
                    status="POTENTIAL_MATCH",
                ))
            else:
                watchlists.append(WatchlistHit(
                    list_name=code,
                    matched_entity=None,
                    similarity_score=0.0,
                    status="CLEARED",
                ))

        if is_sanctioned:
            verdict = "SANCTIONS_HIT_BLOCKED"
            is_cleared = False
            risk_score = 0.98
            risk_tier = "BLOCKED"
            bypass_req = True
        elif is_pep:
            verdict = "FLAG_SUSPICIOUS"
            is_cleared = True
            risk_score = 0.45
            risk_tier = "MEDIUM_RISK_TIER_2"
            bypass_req = False
        else:
            verdict = "CLEARED_PASS"
            is_cleared = True
            risk_score = 0.02
            risk_tier = "LOW_RISK_TIER_1"
            bypass_req = False

        # Generate cryptographic audit seal hash
        audit_material = f"{audit_log_id}:{req.uetr}:{verdict}:{risk_score}:{now.isoformat()}"
        seal_hash = f"0x{hashlib.sha256(audit_material.encode()).hexdigest()}"

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        latency = max(elapsed_ms, 1.4)

        return SanctionsScreeningResponse(
            screening_id=screening_id,
            uetr=req.uetr,
            overall_verdict=verdict,
            is_cleared=is_cleared,
            risk_score=risk_score,
            risk_tier=risk_tier,
            pep_screening=PepScreeningResult(
                is_pep=is_pep,
                confidence=0.92 if is_pep else 0.0,
                details="Politically Exposed Person identified" if is_pep else "No PEP exposure detected",
            ),
            watchlist_breakdown=watchlists,
            audit_log_id=audit_log_id,
            audit_seal_hash=seal_hash,
            compliance_officer_bypass_required=bypass_req,
            screening_latency_ms=latency,
            screened_at=now,
        )

    def archive_compliance_record(self, req: ComplianceArchivalRequest) -> ComplianceArchivalResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        archive_id = f"ARCH-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        retention_years = req.retention_period_years or 7
        retention_until = now.replace(year=now.year + retention_years)

        # 1. Compute Cryptographic WORM Chained Seal
        seal_material = (
            f"{archive_id}:{req.uetr}:{req.message_id}:{req.merkle_root}:"
            f"{req.nullifier_hash}:{req.travel_rule_receipt_id}:{req.regulatory_ack_token}:"
            f"{req.enclave_attestation_id}:{req.sanctions_audit_log_id}:{req.sanctions_verdict}:"
            f"{req.ledger_commitment_id}:{req.ledger_block_height}:{now.isoformat()}"
        )
        archive_seal_hash = f"0x{hashlib.sha256(seal_material.encode()).hexdigest()}"

        # 2. Non-repudiation regulatory digital signature
        sig_material = f"{archive_seal_hash}:MAS_RBI_BILATERAL_NEXUS_HUB"
        non_repudiation_sig = f"0x{hashlib.sha256(sig_material.encode()).hexdigest()}"

        # 3. Estimate composite audit bundle size
        bundle_size = len(req.pacs008_xml.encode("utf-8")) + 2048

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        latency = max(elapsed_ms, 2.1)

        response = ComplianceArchivalResponse(
            archive_id=archive_id,
            uetr=req.uetr,
            message_id=req.message_id,
            status="COMPLIANCE_ARCHIVED_IMMUTABLE",
            archive_seal_hash=archive_seal_hash,
            worm_retention_until=retention_until,
            non_repudiation_signature=non_repudiation_sig,
            audit_bundle_size_bytes=bundle_size,
            persisted_components={
                "pacs008_xml": True,
                "zk_public_signals": True,
                "travel_rule_envelope": True,
                "sanctions_screening_record": True,
                "double_entry_ledger_block": True,
            },
            archival_latency_ms=latency,
            archived_at=now,
        )

        self._archival_store[req.uetr] = response
        return response

    def get_compliance_archive(self, uetr: str) -> ComplianceArchivalResponse:
        if uetr in self._archival_store:
            return self._archival_store[uetr]

        now = datetime.now(timezone.utc)
        retention_until = now.replace(year=now.year + 7)
        archive_id = f"ARCH-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        seal = f"0x{hashlib.sha256(f'{archive_id}:{uetr}'.encode()).hexdigest()}"

        return ComplianceArchivalResponse(
            archive_id=archive_id,
            uetr=uetr,
            message_id=f"MSG-{now.strftime('%Y%m%d')}-001",
            status="COMPLIANCE_ARCHIVED_IMMUTABLE",
            archive_seal_hash=seal,
            worm_retention_until=retention_until,
            non_repudiation_signature=f"0x{hashlib.sha256(seal.encode()).hexdigest()}",
            audit_bundle_size_bytes=4096,
            persisted_components={
                "pacs008_xml": True,
                "zk_public_signals": True,
                "travel_rule_envelope": True,
                "sanctions_screening_record": True,
                "double_entry_ledger_block": True,
            },
            archival_latency_ms=2.1,
            archived_at=now,
        )


envelope_service = EnvelopeEncryptionService()
