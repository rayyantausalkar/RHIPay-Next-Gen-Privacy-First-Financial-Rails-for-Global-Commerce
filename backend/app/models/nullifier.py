from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class NullifierComputeRequest(BaseModel):
    identity_proxy: str = Field(..., description="Sender identity proxy string")
    sender_spoke: str = Field(..., min_length=2, max_length=2, description="Sender domestic spoke")
    quote_id: str = Field(..., description="Locked FX Quote ID")
    nonce: Optional[str] = Field(None, description="Cryptographic transaction nonce")


class NullifierComputeResponse(BaseModel):
    nullifier_hash: str = Field(..., description="Poseidon(identity_secret, tx_seed, leaf_index) single-use nullifier")
    identity_secret_hash: str = Field(..., description="Masked truncated digest of sender secret")
    transaction_seed_hash: str = Field(..., description="Transaction binding seed hash")
    leaf_index: int = Field(..., description="Merkle leaf index position")
    protocol: str = Field(default="poseidon_bn254", description="Cryptographic hash algorithm and curve")
    is_fresh: bool = Field(default=True, description="Whether nullifier is unused and fresh on the network")
    computed_at: datetime


class NullifierVerifyRequest(BaseModel):
    nullifier_hash: str = Field(..., description="Nullifier hash to verify in anti-replay registry")


class NullifierVerifyResponse(BaseModel):
    nullifier_hash: str
    is_fresh: bool
    is_spent: bool
    spent_at: Optional[datetime] = None
    associated_quote_id: Optional[str] = None


class NullifierSpendRequest(BaseModel):
    nullifier_hash: str
    quote_id: str


class NullifierSpendResponse(BaseModel):
    nullifier_hash: str
    status: str = "SPENT"
    spent_at: datetime
    quote_id: str
