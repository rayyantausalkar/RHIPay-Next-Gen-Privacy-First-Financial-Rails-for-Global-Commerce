from datetime import datetime, timezone
from typing import Dict, Optional

from app.models.nullifier import (
    NullifierComputeRequest,
    NullifierComputeResponse,
    NullifierVerifyResponse,
    NullifierSpendResponse,
)
from app.services.zk_service import PoseidonHasher, zk_service


class NullifierService:
    _spent_registry: Dict[str, dict] = {}

    @classmethod
    def compute_nullifier(cls, req: NullifierComputeRequest) -> NullifierComputeResponse:
        clean_proxy = req.identity_proxy.strip().replace(" ", "").lower()
        sender_spoke = req.sender_spoke.upper()
        
        # 1. Derive Identity Secret
        secret = PoseidonHasher.str_to_field(f"RHIPAY_SECRET_{clean_proxy}_{sender_spoke}")

        # 2. Derive Transaction Binding Seed
        nonce_str = req.nonce or "nonce_default"
        tx_seed_str = f"SEED_{req.quote_id}_{nonce_str}"
        tx_seed = PoseidonHasher.str_to_field(tx_seed_str)

        # 3. Retrieve Merkle Leaf Index
        path_info = zk_service.tree_service.get_membership_path(clean_proxy, sender_spoke)
        leaf_idx = path_info["leaf_index"]

        # 4. Compute Poseidon Nullifier: Poseidon(secret, tx_seed, leaf_idx)
        nullifier_int = PoseidonHasher.hash_many([secret, tx_seed, leaf_idx])
        nullifier_hex = PoseidonHasher.field_to_hex(nullifier_int)

        is_fresh = nullifier_hex not in cls._spent_registry

        # Masked secret digest for public display
        secret_hex = PoseidonHasher.field_to_hex(secret)
        masked_secret = f"{secret_hex[:10]}...{secret_hex[-8:]}"

        return NullifierComputeResponse(
            nullifier_hash=nullifier_hex,
            identity_secret_hash=masked_secret,
            transaction_seed_hash=PoseidonHasher.field_to_hex(tx_seed),
            leaf_index=leaf_idx,
            protocol="poseidon_bn254",
            is_fresh=is_fresh,
            computed_at=datetime.now(timezone.utc),
        )

    @classmethod
    def verify_nullifier(cls, nullifier_hex: str) -> NullifierVerifyResponse:
        clean_hex = nullifier_hex.strip().lower()
        spent_record = cls._spent_registry.get(clean_hex)

        if spent_record:
            return NullifierVerifyResponse(
                nullifier_hash=nullifier_hex,
                is_fresh=False,
                is_spent=True,
                spent_at=spent_record["spent_at"],
                associated_quote_id=spent_record.get("quote_id"),
            )

        return NullifierVerifyResponse(
            nullifier_hash=nullifier_hex,
            is_fresh=True,
            is_spent=False,
        )

    @classmethod
    def spend_nullifier(cls, nullifier_hex: str, quote_id: str) -> NullifierSpendResponse:
        clean_hex = nullifier_hex.strip().lower()
        now = datetime.now(timezone.utc)

        cls._spent_registry[clean_hex] = {
            "spent_at": now,
            "quote_id": quote_id,
        }

        # Also sync with tree service spent set
        zk_service.tree_service.mark_nullifier_spent(clean_hex)

        return NullifierSpendResponse(
            nullifier_hash=nullifier_hex,
            status="SPENT",
            spent_at=now,
            quote_id=quote_id,
        )

    @classmethod
    def reset_registry(cls):
        cls._spent_registry.clear()
        zk_service.tree_service._nullifiers_spent.clear()


nullifier_service = NullifierService()
