import time
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any

from app.models.routing import (
    SupplementaryDataRouteRequest,
    SupplementaryDataRouteResponse,
    QueueDispatchItem,
)


class SupplementaryRoutingService:
    @classmethod
    def dispatch_supplementary_data(
        cls, req: SupplementaryDataRouteRequest
    ) -> SupplementaryDataRouteResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)
        dispatch_id = f"DISP-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        pacs = req.pacs008_message
        canonical = pacs.get("canonical_json", {})
        cdt_trf = canonical.get("CdtTrfTxInf", {})
        splmtry = cdt_trf.get("SplmtryData", {})

        # Extract ZK Proof & Nullifier
        zk_proof = splmtry.get("zk_proof", {})
        nullifier_hash = splmtry.get("nullifier_hash") or cdt_trf.get("SplmtryData", {}).get("nullifier_hash", "")
        merkle_root = zk_proof.get("merkle_root", "")
        protocol = zk_proof.get("protocol", "groth16")
        curve = zk_proof.get("curve", "bn128")

        # Extract Encrypted FATF Travel Rule Envelope
        fatf_env = splmtry.get("encrypted_pii_envelope", {})
        dest_spoke = cdt_trf.get("CdtrAgt", {}).get("Ctry", "SG")
        regulator_id = fatf_env.get("recipient_regulator_id", "MAS-SG-COMPLIANCE-NODE-01")

        # Digest hashes for tracing
        zk_digest = hashlib.sha256(f"{merkle_root}-{protocol}-{curve}".encode()).hexdigest()[:16]
        null_digest = hashlib.sha256(nullifier_hash.encode()).hexdigest()[:16] if nullifier_hash else "0" * 16
        env_digest = hashlib.sha256(fatf_env.get("envelope_id", "env").encode()).hexdigest()[:16]

        # 4 Specialized Micro-Pipelines
        pipelines = {
            "zk_snark_queue": {
                "queue_name": "ZK_SNARK_VERIFICATION_POOL",
                "status": "ROUTED",
                "target_engine": "GROTH16_BN254_VERIFIER_POOL",
                "allocated_worker_id": f"worker-zk-{uuid.uuid4().hex[:4]}",
                "estimated_execution_time_ms": 18.5,
                "protocol": protocol,
                "curve": curve,
                "merkle_root": merkle_root,
                "payload_digest": f"0x{zk_digest}",
            },
            "nullifier_registry_queue": {
                "queue_name": "NULLIFIER_DOUBLE_SPEND_LOCKER",
                "status": "ROUTED",
                "target_engine": "REDIS_ATOMIC_NULLIFIER_STORE",
                "allocated_worker_id": f"worker-null-{uuid.uuid4().hex[:4]}",
                "estimated_execution_time_ms": 1.2,
                "nullifier_hash": nullifier_hash,
                "payload_digest": f"0x{null_digest}",
            },
            "regulatory_compliance_queue": {
                "queue_name": "FATF_TRAVEL_RULE_RELAY",
                "status": "ROUTED",
                "target_engine": "DESTINATION_REGULATOR_HSM_RELAY",
                "allocated_worker_id": f"worker-reg-{uuid.uuid4().hex[:4]}",
                "estimated_execution_time_ms": 4.5,
                "destination_spoke": dest_spoke,
                "recipient_regulator_id": regulator_id,
                "envelope_id": fatf_env.get("envelope_id", ""),
                "payload_digest": f"0x{env_digest}",
            },
            "core_settlement_highway": {
                "queue_name": "CORE_DOUBLE_ENTRY_LEDGER_FASTPATH",
                "status": "READY_PARALLEL",
                "target_engine": "DOUBLE_ENTRY_LEDGER_PIPELINE",
                "allocated_worker_id": f"worker-core-{uuid.uuid4().hex[:4]}",
                "estimated_execution_time_ms": 2.0,
                "unblocked": True,
                "instructed_amount": pacs.get("instructed_amount", 0.0),
                "settlement_amount": pacs.get("settlement_amount", 0.0),
            },
        }

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return SupplementaryDataRouteResponse(
            dispatch_id=dispatch_id,
            ingestion_id=req.ingestion_id,
            uetr=req.uetr,
            status="DISPATCHED",
            dispatched_at=now,
            core_ledger_unblocked=True,
            isolation_latency_ms=max(elapsed_ms, 1.2),
            pipelines=pipelines,
        )


routing_service = SupplementaryRoutingService()
