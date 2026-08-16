from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MerkleRootResponse(BaseModel):
    merkle_root: str = Field(..., description="Current 256-bit Poseidon Merkle Tree root")
    tree_depth: int = Field(default=16, description="Merkle tree depth (supports 65,536 participants)")
    total_members: int = Field(..., description="Number of KYC-verified participant leaves")
    last_updated: datetime


class MerklePathRequest(BaseModel):
    identity_proxy: str = Field(..., description="Sender proxy identifier (e.g. +919876543210)")
    sender_spoke: str = Field(..., min_length=2, max_length=2, description="Sender domestic spoke ISO country code")


class MerklePathResponse(BaseModel):
    is_member: bool
    leaf_index: int
    leaf_commitment: str = Field(..., description="Poseidon(identity_secret, kyc_tier) leaf commitment")
    path_elements: List[str] = Field(..., description="Sibling hashes along the Merkle branch")
    path_indices: List[int] = Field(..., description="Binary directional path indices (0=left, 1=right)")
    merkle_root: str


class ZKProofGenerateRequest(BaseModel):
    identity_proxy: str = Field(..., description="Sender identity proxy for secret commitment derivation")
    sender_spoke: str = Field(..., min_length=2, max_length=2, description="Sender domestic spoke")
    quote_id: str = Field(..., description="Locked FX Quote ID to bind with anti-replay nullifier")
    kyc_tier_required: int = Field(default=1, ge=1, le=3, description="Minimum KYC tier required for compliance")


class Groth16ProofPoints(BaseModel):
    pi_a: List[str] = Field(..., description="G1 curve point [x, y, 1]")
    pi_b: List[List[str]] = Field(..., description="G2 curve point [[x1, y1], [x2, y2], [1, 0]]")
    pi_c: List[str] = Field(..., description="G1 curve point [x, y, 1]")
    protocol: str = "groth16"
    curve: str = "bn128"


class ZKProofGenerateResponse(BaseModel):
    proof_id: str
    protocol: str = "groth16"
    curve: str = "bn128"
    merkle_root: str
    nullifier_hash: str = Field(..., description="Poseidon(secret, quote_id, path_index) anti-replay nullifier")
    quote_id_hash: str
    leaf_commitment: str
    generation_time_ms: float = Field(..., description="Client-side circuit execution time in milliseconds (<1200ms)")
    pi_a: List[str]
    pi_b: List[List[str]]
    pi_c: List[str]
    public_signals: List[str]
    proof: Dict[str, Any]
    created_at: datetime


class ZKProofVerifyRequest(BaseModel):
    merkle_root: str
    nullifier_hash: str
    quote_id: str
    proof: Dict[str, Any]
    public_signals: List[str]


class ZKProofVerifyResponse(BaseModel):
    is_valid: bool
    nullifier_is_fresh: bool
    merkle_root_verified: bool
    verification_time_ms: float
    error_details: Optional[str] = None
