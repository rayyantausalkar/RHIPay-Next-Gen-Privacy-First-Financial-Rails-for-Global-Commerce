from fastapi import APIRouter, HTTPException, status
from app.models.zk_proof import (
    MerkleRootResponse,
    MerklePathRequest,
    MerklePathResponse,
    ZKProofGenerateRequest,
    ZKProofGenerateResponse,
    ZKProofVerifyRequest,
    ZKProofVerifyResponse,
)
from app.models.nullifier import (
    NullifierComputeRequest,
    NullifierComputeResponse,
    NullifierVerifyRequest,
    NullifierVerifyResponse,
    NullifierSpendRequest,
    NullifierSpendResponse,
)
from app.services.zk_service import zk_service
from app.services.nullifier_service import nullifier_service

router = APIRouter()


@router.get(
    "/merkle-root",
    response_model=MerkleRootResponse,
    summary="Get Current Poseidon Merkle Tree Root",
    description="Returns current 256-bit Poseidon Merkle root of all KYC-verified network participants.",
)
def get_merkle_root():
    return zk_service.get_root_info()


@router.post(
    "/merkle-path",
    response_model=MerklePathResponse,
    summary="Get Merkle Membership Path for Participant",
    description="Retrieves sibling hashes along the Merkle branch for a given participant commitment.",
)
def get_merkle_path(payload: MerklePathRequest):
    return zk_service.get_merkle_path(payload)


@router.post(
    "/generate-proof",
    response_model=ZKProofGenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Client-Side ZK-SNARK Membership Proof (<1.2s)",
    description="Executes client-side Circom circuit with Poseidon hashing to prove Merkle membership without revealing sender secret.",
)
def generate_zk_proof(payload: ZKProofGenerateRequest):
    try:
        return zk_service.generate_proof(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/verify-proof",
    response_model=ZKProofVerifyResponse,
    summary="Verify ZK-SNARK Membership Proof and Anti-Replay Nullifier",
    description="Verifies Groth16 proof points and nullifier freshness on the central Nexus Hub.",
)
def verify_zk_proof(payload: ZKProofVerifyRequest):
    return zk_service.verify_proof(payload)


# --- Step 6 Nullifier Endpoints ---

@router.post(
    "/nullifier/compute",
    response_model=NullifierComputeResponse,
    summary="Derive Deterministic Cryptographic Nullifier (Step 6)",
    description="Derives a single-use Poseidon nullifier hash from sender identity secret and transaction seed to prevent double spending.",
)
def compute_nullifier(payload: NullifierComputeRequest):
    return nullifier_service.compute_nullifier(payload)


@router.post(
    "/nullifier/verify",
    response_model=NullifierVerifyResponse,
    summary="Verify Anti-Replay Nullifier Freshness",
    description="Checks whether a nullifier has already been spent on the Hub registry.",
)
def verify_nullifier(payload: NullifierVerifyRequest):
    return nullifier_service.verify_nullifier(payload.nullifier_hash)


@router.post(
    "/nullifier/spend",
    response_model=NullifierSpendResponse,
    summary="Mark Nullifier as Spent (Atomic Settlement)",
    description="Records nullifier as spent upon final transaction settlement.",
)
def spend_nullifier(payload: NullifierSpendRequest):
    return nullifier_service.spend_nullifier(payload.nullifier_hash, payload.quote_id)


@router.post(
    "/nullifier/reset-registry",
    summary="Reset Anti-Replay Registry (Testing/Demo)",
    description="Clears spent nullifier registry for test runs.",
)
def reset_nullifier_registry():
    nullifier_service.reset_registry()
    return {"status": "RESET_SUCCESS", "message": "Anti-replay registry cleared"}
