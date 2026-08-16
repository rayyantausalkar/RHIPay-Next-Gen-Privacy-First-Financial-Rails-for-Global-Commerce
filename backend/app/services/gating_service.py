import time
import hmac
import hashlib
from datetime import datetime, timezone
from typing import List, Dict

from app.models.gating import CryptographicGateRequest, CryptographicGateResponse


class CryptographicGatingService:
    """
    Fail-Safe Logic Gate: Verifies that proof validity, root consistency,
    and nullifier uniqueness all evaluate to TRUE before issuing a signed
    Clearance Token unlocking double-entry ledger execution.
    """

    HUB_SECRET_KEY = "RHIPAY_CENTRAL_NEXUS_SETTLEMENT_CLEARANCE_SECRET_KEY_v2"

    @classmethod
    def evaluate_gate(cls, req: CryptographicGateRequest) -> CryptographicGateResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        gate_checks = {
            "proof_validity": req.proof_validity,
            "root_consistency": req.root_consistency,
            "nullifier_uniqueness": req.nullifier_uniqueness,
            "kyc_tier_satisfied": bool(req.kyc_tier_satisfied),
            "envelope_integrity": bool(req.envelope_integrity),
        }

        rejection_reasons: List[str] = []

        if not req.proof_validity:
            rejection_reasons.append("Groth16 mathematical proof constraint failure: Bilinear pairing not satisfied")
        if not req.root_consistency:
            rejection_reasons.append("Poseidon Merkle root consistency failure: Root hash not recognized in central registry")
        if not req.nullifier_uniqueness:
            rejection_reasons.append("Anti-replay nullifier uniqueness failure: Single-use nullifier already spent")
        if not req.kyc_tier_satisfied:
            rejection_reasons.append("KYC tier authorization failure: Participant does not meet Tier 1 threshold")
        if not req.envelope_integrity:
            rejection_reasons.append("FATF Travel Rule regulatory envelope payload corrupted or tampered")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        exec_latency = max(elapsed_ms, 0.4)

        if rejection_reasons:
            return CryptographicGateResponse(
                gate_approved=False,
                clearance_status="FAIL_SAFE_TRIPPED_REJECTED",
                clearance_token=None,
                clearance_token_signature=None,
                evaluation_timestamp=now,
                gate_checks=gate_checks,
                evaluation_latency_ms=exec_latency,
                ledger_execution_unlocked=False,
                rejection_reasons=rejection_reasons,
            )

        # Generate Cryptographically Signed Clearance Token
        token_payload = f"RHIPAY_CLEARANCE_{req.uetr}_{req.quote_id}_{int(now.timestamp())}"
        signature = hmac.new(
            cls.HUB_SECRET_KEY.encode(),
            token_payload.encode(),
            hashlib.sha256,
        ).hexdigest()

        return CryptographicGateResponse(
            gate_approved=True,
            clearance_status="CLEARANCE_GRANTED",
            clearance_token=token_payload,
            clearance_token_signature=signature,
            evaluation_timestamp=now,
            gate_checks=gate_checks,
            evaluation_latency_ms=exec_latency,
            ledger_execution_unlocked=True,
            rejection_reasons=[],
        )


gating_service = CryptographicGatingService()
