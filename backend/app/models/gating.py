from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CryptographicGateRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    message_id: str = Field(..., description="ISO 20022 pacs.008 message identifier")
    quote_id: str = Field(..., description="Locked FX Quote ID")
    proof_validity: bool = Field(..., description="Gate 1: Groth16 mathematical bilinear pairing check result")
    root_consistency: bool = Field(..., description="Gate 2: Poseidon Merkle root consistency with central registry")
    nullifier_uniqueness: bool = Field(..., description="Gate 3: Anti-replay single-use nullifier freshness")
    kyc_tier_satisfied: Optional[bool] = Field(default=True, description="Minimum Tier 1 KYC authorization verification")
    envelope_integrity: Optional[bool] = Field(default=True, description="FATF Travel Rule regulatory envelope integrity")
    merkle_root: str = Field(..., description="Poseidon Merkle root evaluated")
    nullifier_hash: str = Field(..., description="Anti-replay nullifier hash evaluated")


class CryptographicGateResponse(BaseModel):
    gate_approved: bool
    clearance_status: str
    clearance_token: Optional[str] = None
    clearance_token_signature: Optional[str] = None
    evaluation_timestamp: datetime
    gate_checks: Dict[str, bool]
    evaluation_latency_ms: float
    ledger_execution_unlocked: bool
    rejection_reasons: List[str]
