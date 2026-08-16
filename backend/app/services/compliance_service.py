import os
import json
import base64
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Tuple, Optional

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.models.compliance import (
    RegulatorPublicKeyResponse,
    PIIEnvelopeEncryptRequest,
    PIIEnvelopeEncryptResponse,
    PIIEnvelopeDecryptRequest,
    PIIEnvelopeDecryptResponse,
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

    def get_regulator_key(self, spoke: str) -> RegulatorPublicKeyResponse:
        _, _, name, node_id = self.keystore.get_spoke_info(spoke)
        pem_str = self.keystore.get_public_pem(spoke)
        return RegulatorPublicKeyResponse(
            country_code=spoke.upper(),
            regulator_name=name,
            compliance_node_id=node_id,
            public_key_pem=pem_str,
            key_algorithm="RSA-OAEP-256",
        )

    def encrypt_pii_envelope(self, req: PIIEnvelopeEncryptRequest) -> PIIEnvelopeEncryptResponse:
        """
        Performs hybrid encryption:
        1. Encrypts FATF Travel Rule payload with ephemeral AES-256-GCM key.
        2. Encrypts symmetric AES key with destination regulator's RSA-2048 public key.
        """
        _, pub_key, _, node_id = self.keystore.get_spoke_info(req.destination_spoke)

        # 1. Build FATF Travel Rule standardized PII payload
        travel_rule_dict = {
            "originator_name": req.originator_name,
            "originator_proxy": req.originator_proxy,
            "originator_address": req.originator_address,
            "originator_national_id": req.originator_national_id,
            "originator_bic": req.originator_bic,
            "beneficiary_name": req.beneficiary_name,
            "beneficiary_proxy": req.beneficiary_proxy,
            "beneficiary_bic": req.beneficiary_bic,
            "quote_id": req.quote_id,
            "encrypted_at": datetime.now(timezone.utc).isoformat(),
        }
        plaintext_bytes = json.dumps(travel_rule_dict, sort_keys=True).encode("utf-8")

        # 2. Symmetric AES-256-GCM Encryption
        aes_key = AESGCM.generate_key(bit_length=256)
        aesgcm = AESGCM(aes_key)
        iv = os.urandom(12)  # 12-byte GCM nonce

        # AESGCM.encrypt appends 16-byte authentication tag at the end of ciphertext
        encrypted_data = aesgcm.encrypt(iv, plaintext_bytes, None)
        ciphertext = encrypted_data[:-16]
        auth_tag = encrypted_data[-16:]

        # 3. Asymmetric RSA-OAEP Encryption of AES Key
        encrypted_aes_key = pub_key.encrypt(
            aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        envelope_id = f"RHIPAY-ENV-{uuid.uuid4().hex[:12].upper()}"

        # Canonical SHA-256 digest of envelope
        digest_input = f"{envelope_id}:{base64.b64encode(ciphertext).decode()}"
        envelope_digest = hashlib.sha256(digest_input.encode()).hexdigest()

        return PIIEnvelopeEncryptResponse(
            envelope_id=envelope_id,
            destination_spoke=req.destination_spoke.upper(),
            recipient_regulator_id=node_id,
            encryption_algorithm="RSA-OAEP-256 + AES-256-GCM",
            encrypted_aes_key=base64.b64encode(encrypted_aes_key).decode("utf-8"),
            encrypted_pii_ciphertext=base64.b64encode(ciphertext).decode("utf-8"),
            iv=base64.b64encode(iv).decode("utf-8"),
            auth_tag=base64.b64encode(auth_tag).decode("utf-8"),
            envelope_digest=f"0x{envelope_digest}",
            created_at=datetime.now(timezone.utc),
        )

    def decrypt_pii_envelope(self, req: PIIEnvelopeDecryptRequest) -> PIIEnvelopeDecryptResponse:
        """
        Simulated regulatory inspection: only the authorized compliance node with matching
        RSA private key can decrypt and inspect FATF Travel Rule fields.
        """
        priv_key, _, _, _ = self.keystore.get_spoke_info(req.destination_spoke)

        try:
            # 1. Asymmetric Decryption of AES Key
            enc_aes_key_bytes = base64.b64decode(req.encrypted_aes_key)
            aes_key = priv_key.decrypt(
                enc_aes_key_bytes,
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


envelope_service = EnvelopeEncryptionService()
