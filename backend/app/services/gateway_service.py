import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple

from app.models.gateway import (
    GatewayIngestRequest,
    GatewayIngestResponse,
    GatewayFinancialPayload,
    GatewayRoutingPayload,
    GatewayCryptoPayload,
    GatewayPipelineIsolation,
)


class GatewayIngestionService:
    def __init__(self):
        # In-memory Idempotency Registry: Map[idempotency_key, GatewayIngestResponse]
        self._idempotency_store: Dict[str, GatewayIngestResponse] = {}

    def ingest_request(
        self,
        req: GatewayIngestRequest,
        idempotency_key: Optional[str] = None,
        origin_spoke_header: Optional[str] = None,
    ) -> GatewayIngestResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        # 1. Check Idempotency Key
        effective_key = idempotency_key or f"idem-{uuid.uuid4().hex[:12]}"
        if effective_key in self._idempotency_store:
            cached = self._idempotency_store[effective_key]
            # Return cached response marked as replay
            return cached.model_copy(update={"is_idempotent_replay": True})

        pacs = req.pacs008_message
        canonical = pacs.get("canonical_json", {})
        cdt_trf = canonical.get("CdtTrfTxInf", {})
        splmtry = cdt_trf.get("SplmtryData", {})

        # Extract Financial Components
        dbtr_nm = cdt_trf.get("Dbtr", {}).get("Nm", "PROTECTED_ZK_ORIGINATOR")
        cdtr_nm = cdt_trf.get("Cdtr", {}).get("Nm", "RECIPIENT_PAYEE")
        purpose_cd = cdt_trf.get("Purp", {}).get("Cd", "P2PR")

        fin_payload = GatewayFinancialPayload(
            message_id=pacs.get("message_id", f"MSG-{uuid.uuid4().hex[:8]}"),
            uetr=pacs.get("uetr", str(uuid.uuid4())),
            end_to_end_id=pacs.get("end_to_end_id", "REF-001"),
            instructed_amount=float(pacs.get("instructed_amount", 0.0)),
            instructed_currency=pacs.get("instructed_currency", "INR"),
            settlement_amount=float(pacs.get("settlement_amount", 0.0)),
            settlement_currency=pacs.get("settlement_currency", "SGD"),
            exchange_rate=float(pacs.get("exchange_rate", 1.0)),
            debtor_masked_name=dbtr_nm,
            creditor_masked_name=cdtr_nm,
            purpose_code=purpose_cd,
        )

        # Extract Routing Components
        origin_spoke = (
            origin_spoke_header or
            cdt_trf.get("DbtrAgt", {}).get("Ctry", "IN")
        )
        origin_bic = cdt_trf.get("DbtrAgt", {}).get("BICFI", "HDFCINBBXXX")
        destination_spoke = cdt_trf.get("CdtrAgt", {}).get("Ctry", "SG")
        destination_bic = cdt_trf.get("CdtrAgt", {}).get("BICFI", "DBSSSGSGXXX")
        clearing_channel = pacs.get("clearing_system", "NEXUS")
        settlement_method = pacs.get("settlement_method", "CLRG")

        routing_payload = GatewayRoutingPayload(
            origin_spoke=origin_spoke,
            origin_bic=origin_bic,
            destination_spoke=destination_spoke,
            destination_bic=destination_bic,
            clearing_channel=clearing_channel,
            settlement_method=settlement_method,
        )

        # Extract Cryptographic Components from Supplementary Data
        zk_proof = splmtry.get("zk_proof", {})
        nullifier_hash = (
            splmtry.get("nullifier_hash") or
            cdt_trf.get("SplmtryData", {}).get("nullifier_hash", "")
        )
        merkle_root = zk_proof.get("merkle_root", "")
        proof_protocol = zk_proof.get("protocol", "groth16")
        proof_curve = zk_proof.get("curve", "bn128")

        fatf_env = splmtry.get("encrypted_pii_envelope", {})
        env_id = fatf_env.get("envelope_id", f"ENV-{uuid.uuid4().hex[:6]}")
        reg_id = fatf_env.get("recipient_regulator_id", "MAS-SG-COMPLIANCE-NODE-01")

        crypto_payload = GatewayCryptoPayload(
            nullifier_hash=nullifier_hash,
            merkle_root=merkle_root,
            proof_protocol=proof_protocol,
            proof_curve=proof_curve,
            encrypted_envelope_id=env_id,
            recipient_regulator_id=reg_id,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        ingestion_id = f"ING-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        response = GatewayIngestResponse(
            ingestion_id=ingestion_id,
            idempotency_key=effective_key,
            status="INGESTED",
            received_at=now,
            financial_payload=fin_payload,
            routing_payload=routing_payload,
            crypto_payload=crypto_payload,
            pipeline_isolation=GatewayPipelineIsolation(),
            is_idempotent_replay=False,
            ingestion_latency_ms=max(elapsed_ms, 1.5),
        )

        # Save to Idempotency Store
        self._idempotency_store[effective_key] = response
        return response


gateway_service = GatewayIngestionService()
