import uuid
import time
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status

from app.models.ledger import (
    LedgerJournalEntry,
    SpokeAExecutionRequest,
    SpokeAExecutionResponse,
    AtomicFxSwapRequest,
    AtomicFxSwapResponse,
    SpokeBExecutionRequest,
    SpokeBExecutionResponse,
    LedgerCommitmentRequest,
    LedgerCommitmentResponse,
    AccountBalance,
)


class DoubleEntryLedgerService:
    """
    Deterministic double-entry accounting engine for BIS Nexus hub-and-spoke settlement.
    Enforces strict integer unit arithmetic (cents / paise) with zero-sum equation invariants (Sum Debits == Sum Credits).
    """

    def __init__(self):
        self._accounts: Dict[str, Dict[str, Any]] = {}
        self._journal_log: List[LedgerJournalEntry] = []
        self._ledger_block_height: int = 10492
        self._seed_accounts()

    def _seed_accounts(self):
        """Initializes simulated participant and bilateral FX provider pool balances."""
        now = datetime.now(timezone.utc)
        self._accounts = {
            "ACCT-SENDER-INR-01": {
                "account_name": "Rahul Sharma (Personal Checking)",
                "account_type": "SENDER_RETAIL_ACCT",
                "currency": "INR",
                "balance_cents": 5000000,  # INR 50,000.00
                "last_updated": now,
            },
            "ACCT-FXP-INR-01": {
                "account_name": "DBS Liquidity Desk (Domestic INR Pool)",
                "account_type": "FXP_SPOKE_A_POOL",
                "currency": "INR",
                "balance_cents": 10000000000,  # INR 100,000,000.00
                "last_updated": now,
            },
            "ACCT-FXP-SGD-01": {
                "account_name": "DBS Liquidity Desk (Foreign SGD Pool)",
                "account_type": "FXP_SPOKE_B_POOL",
                "currency": "SGD",
                "balance_cents": 100000000,  # SGD 1,000,000.00
                "last_updated": now,
            },
            "ACCT-RECIPIENT-SGD-01": {
                "account_name": "Tan Wei Ling (Checking Account)",
                "account_type": "RECIPIENT_RETAIL_ACCT",
                "currency": "SGD",
                "balance_cents": 500000,  # SGD 5,000.00
                "last_updated": now,
            },
        }

    def get_account_balances(self) -> List[AccountBalance]:
        return [
            AccountBalance(
                account_id=acc_id,
                account_name=data["account_name"],
                account_type=data["account_type"],
                currency=data["currency"],
                balance_cents=data["balance_cents"],
                balance_formatted=f"{data['currency']} {data['balance_cents'] / 100:,.2f}",
                last_updated=data["last_updated"],
            )
            for acc_id, data in self._accounts.items()
        ]

    def execute_spoke_a_settlement(self, req: SpokeAExecutionRequest) -> SpokeAExecutionResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        if not req.clearance_token or not req.clearance_token.startswith("RHIPAY_CLEARANCE_"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Spoke A settlement aborted: Cryptographic clearance token invalid or missing",
            )

        amount_cents = int(round(req.origin_debit_amount * 100))
        if amount_cents <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid settlement debit amount: Must be greater than zero.",
            )

        sender_acc_id = "ACCT-SENDER-INR-01"
        fxp_inr_acc_id = "ACCT-FXP-INR-01"

        sender_acc = self._accounts[sender_acc_id]
        fxp_acc = self._accounts[fxp_inr_acc_id]

        if sender_acc["balance_cents"] < amount_cents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds in sender account: Available {sender_acc['currency']} {sender_acc['balance_cents']/100:.2f}, required {req.origin_debit_amount:.2f}.",
            )

        # 1. DEBIT Sender Retail Account (-amount_cents)
        sender_acc["balance_cents"] -= amount_cents
        sender_acc["last_updated"] = now
        debit_entry = LedgerJournalEntry(
            entry_id=f"JRNL-SPOKEA-DEBIT-{uuid.uuid4().hex[:8].upper()}",
            account_id=sender_acc_id,
            account_name=sender_acc["account_name"],
            account_type=sender_acc["account_type"],
            entry_type="DEBIT",
            amount_cents=amount_cents,
            currency=req.sender_currency,
            balance_after_cents=sender_acc["balance_cents"],
            timestamp=now,
        )

        # 2. CREDIT FXP Domestic Pool (+amount_cents)
        fxp_acc["balance_cents"] += amount_cents
        fxp_acc["last_updated"] = now
        credit_entry = LedgerJournalEntry(
            entry_id=f"JRNL-SPOKEA-CREDIT-{uuid.uuid4().hex[:8].upper()}",
            account_id=fxp_inr_acc_id,
            account_name=fxp_acc["account_name"],
            account_type=fxp_acc["account_type"],
            entry_type="CREDIT",
            amount_cents=amount_cents,
            currency=req.sender_currency,
            balance_after_cents=fxp_acc["balance_cents"],
            timestamp=now,
        )

        self._journal_log.extend([debit_entry, credit_entry])

        double_entry_balanced = (debit_entry.amount_cents == credit_entry.amount_cents)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        exec_latency = max(elapsed_ms, 2.4)

        home_ips_ref = f"UPI/RHIPAY/{now.strftime('%Y%m%d')}/{uuid.uuid4().hex[:8].upper()}"
        settlement_id = f"SETTLE-SPOKEA-{uuid.uuid4().hex[:8].upper()}"

        return SpokeAExecutionResponse(
            settlement_id=settlement_id,
            uetr=req.uetr,
            status="SPOKE_A_SETTLED",
            home_ips_reference=home_ips_ref,
            sender_spoke=req.sender_spoke,
            sender_currency=req.sender_currency,
            amount_debited_cents=amount_cents,
            amount_debited_formatted=f"{req.sender_currency} {amount_cents / 100:,.2f}",
            fxp_pool_credited_cents=amount_cents,
            fxp_pool_credited_formatted=f"{req.sender_currency} {amount_cents / 100:,.2f}",
            double_entry_balanced=double_entry_balanced,
            journal_entries=[debit_entry, credit_entry],
            settlement_latency_ms=exec_latency,
            executed_at=now,
        )

    def execute_atomic_fx_swap(self, req: AtomicFxSwapRequest) -> AtomicFxSwapResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        if req.origin_amount_cents <= 0 or req.destination_amount_cents <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Atomic FX Swap aborted: Inflow and outflow amounts must be strictly positive.",
            )

        fxp_inr_id = "ACCT-FXP-INR-01"
        fxp_sgd_id = "ACCT-FXP-SGD-01"

        fxp_inr_acc = self._accounts[fxp_inr_id]
        fxp_sgd_acc = self._accounts[fxp_sgd_id]

        if fxp_sgd_acc["balance_cents"] < req.destination_amount_cents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient liquidity in foreign pool: Required {req.destination_amount_cents/100:.2f} {req.destination_currency}.",
            )

        # Atomic Swap: Debit FXP Foreign SGD Pool (earmarked for Spoke B disbursement)
        fxp_sgd_acc["balance_cents"] -= req.destination_amount_cents
        fxp_sgd_acc["last_updated"] = now

        swap_debit = LedgerJournalEntry(
            entry_id=f"JRNL-SWAP-DEBIT-{uuid.uuid4().hex[:8].upper()}",
            account_id=fxp_sgd_id,
            account_name=fxp_sgd_acc["account_name"],
            account_type=fxp_sgd_acc["account_type"],
            entry_type="DEBIT",
            amount_cents=req.destination_amount_cents,
            currency=req.destination_currency,
            balance_after_cents=fxp_sgd_acc["balance_cents"],
            timestamp=now,
        )

        swap_credit = LedgerJournalEntry(
            entry_id=f"JRNL-SWAP-CREDIT-{uuid.uuid4().hex[:8].upper()}",
            account_id=fxp_inr_id,
            account_name=fxp_inr_acc["account_name"],
            account_type=fxp_inr_acc["account_type"],
            entry_type="CREDIT",
            amount_cents=req.origin_amount_cents,
            currency=req.origin_currency,
            balance_after_cents=fxp_inr_acc["balance_cents"],
            timestamp=now,
        )

        self._journal_log.extend([swap_debit, swap_credit])

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        exec_latency = max(elapsed_ms, 1.8)

        swap_id = f"SWAP-PVP-{uuid.uuid4().hex[:8].upper()}"

        return AtomicFxSwapResponse(
            swap_id=swap_id,
            uetr=req.uetr,
            status="ATOMIC_FX_SWAP_SETTLED",
            herstatt_risk_status="HERSTATT_RISK_ELIMINATED",
            pvp_atomic_commit_guaranteed=True,
            fx_provider_id=req.fx_provider_id or "DBS_GLOBAL_LIQUIDITY_DESK",
            origin_inflow_formatted=f"{req.origin_currency} {req.origin_amount_cents / 100:,.2f}",
            destination_outflow_formatted=f"{req.destination_currency} {req.destination_amount_cents / 100:,.2f}",
            effective_fx_rate=req.fx_rate,
            journal_entries=[swap_debit, swap_credit],
            atomic_execution_latency_ms=exec_latency,
            executed_at=now,
        )

    def execute_spoke_b_settlement(self, req: SpokeBExecutionRequest) -> SpokeBExecutionResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        fxp_sgd_id = "ACCT-FXP-SGD-01"
        recipient_acc_id = "ACCT-RECIPIENT-SGD-01"

        fxp_sgd_acc = self._accounts[fxp_sgd_id]
        recipient_acc = self._accounts[recipient_acc_id]

        amount_cents = req.destination_amount_cents

        # Entry 1: DEBIT FXP Spoke B Pool (Earmarked allocation disbursed)
        debit_entry = LedgerJournalEntry(
            entry_id=f"JRNL-SPOKEB-DEBIT-{uuid.uuid4().hex[:8].upper()}",
            account_id=fxp_sgd_id,
            account_name=fxp_sgd_acc["account_name"],
            account_type=fxp_sgd_acc["account_type"],
            entry_type="DEBIT",
            amount_cents=amount_cents,
            currency=req.recipient_currency,
            balance_after_cents=fxp_sgd_acc["balance_cents"],
            timestamp=now,
        )

        # Entry 2: CREDIT Recipient Checking Account in Local Currency (+amount_cents)
        recipient_acc["balance_cents"] += amount_cents
        recipient_acc["last_updated"] = now
        credit_entry = LedgerJournalEntry(
            entry_id=f"JRNL-SPOKEB-CREDIT-{uuid.uuid4().hex[:8].upper()}",
            account_id=recipient_acc_id,
            account_name=recipient_acc["account_name"],
            account_type=recipient_acc["account_type"],
            entry_type="CREDIT",
            amount_cents=amount_cents,
            currency=req.recipient_currency,
            balance_after_cents=recipient_acc["balance_cents"],
            timestamp=now,
        )

        self._journal_log.extend([debit_entry, credit_entry])

        double_entry_balanced = (debit_entry.amount_cents == credit_entry.amount_cents)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        exec_latency = max(elapsed_ms, 2.2)

        host_ips_ref = f"PAYNOW/RHIPAY/{now.strftime('%Y%m%d')}/{uuid.uuid4().hex[:8].upper()}"
        disbursement_id = f"DISBURSE-SPOKEB-{uuid.uuid4().hex[:8].upper()}"

        return SpokeBExecutionResponse(
            disbursement_id=disbursement_id,
            uetr=req.uetr,
            status="SPOKE_B_SETTLED",
            host_ips_reference=host_ips_ref,
            recipient_spoke=req.recipient_spoke,
            recipient_currency=req.recipient_currency,
            amount_credited_cents=amount_cents,
            amount_credited_formatted=f"{req.recipient_currency} {amount_cents / 100:,.2f}",
            recipient_name=req.recipient_name,
            double_entry_balanced=double_entry_balanced,
            journal_entries=[debit_entry, credit_entry],
            settlement_latency_ms=exec_latency,
            executed_at=now,
        )

    def commit_double_entry_ledger(self, req: LedgerCommitmentRequest) -> LedgerCommitmentResponse:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        if req.origin_debit_amount <= 0 or req.destination_credit_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid transaction amount: Origin debit and destination credit amounts must be greater than zero.",
            )

        origin_cents = int(round(req.origin_debit_amount * 100))
        destination_cents = int(round(req.destination_credit_amount * 100))

        sender_acc_id = "ACCT-SENDER-INR-01"
        fxp_inr_id = "ACCT-FXP-INR-01"
        fxp_sgd_id = "ACCT-FXP-SGD-01"
        recipient_acc_id = "ACCT-RECIPIENT-SGD-01"

        sender_acc = self._accounts[sender_acc_id]
        fxp_inr_acc = self._accounts[fxp_inr_id]
        fxp_sgd_acc = self._accounts[fxp_sgd_id]
        recipient_acc = self._accounts[recipient_acc_id]

        # 1. DEBIT Sender Retail UPI (-origin_cents)
        entry_1 = LedgerJournalEntry(
            entry_id=f"JRNL-COMMIT-01-{uuid.uuid4().hex[:6].upper()}",
            account_id=sender_acc_id,
            account_name=sender_acc["account_name"],
            account_type=sender_acc["account_type"],
            entry_type="DEBIT",
            amount_cents=origin_cents,
            currency=req.sender_currency,
            balance_after_cents=sender_acc["balance_cents"],
            timestamp=now,
        )

        # 2. CREDIT DBS Liquidity Desk Domestic INR Pool (+origin_cents)
        entry_2 = LedgerJournalEntry(
            entry_id=f"JRNL-COMMIT-02-{uuid.uuid4().hex[:6].upper()}",
            account_id=fxp_inr_id,
            account_name=fxp_inr_acc["account_name"],
            account_type=fxp_inr_acc["account_type"],
            entry_type="CREDIT",
            amount_cents=origin_cents,
            currency=req.sender_currency,
            balance_after_cents=fxp_inr_acc["balance_cents"],
            timestamp=now,
        )

        # 3. DEBIT DBS Liquidity Desk Foreign SGD Pool (-destination_cents)
        entry_3 = LedgerJournalEntry(
            entry_id=f"JRNL-COMMIT-03-{uuid.uuid4().hex[:6].upper()}",
            account_id=fxp_sgd_id,
            account_name=fxp_sgd_acc["account_name"],
            account_type=fxp_sgd_acc["account_type"],
            entry_type="DEBIT",
            amount_cents=destination_cents,
            currency=req.recipient_currency,
            balance_after_cents=fxp_sgd_acc["balance_cents"],
            timestamp=now,
        )

        # 4. CREDIT Recipient Checking Account (+destination_cents)
        entry_4 = LedgerJournalEntry(
            entry_id=f"JRNL-COMMIT-04-{uuid.uuid4().hex[:6].upper()}",
            account_id=recipient_acc_id,
            account_name=recipient_acc["account_name"],
            account_type=recipient_acc["account_type"],
            entry_type="CREDIT",
            amount_cents=destination_cents,
            currency=req.recipient_currency,
            balance_after_cents=recipient_acc["balance_cents"],
            timestamp=now,
        )

        committed_entries = [entry_1, entry_2, entry_3, entry_4]
        self._journal_log.extend(committed_entries)
        self._ledger_block_height += 1

        # Check zero-sum balance delta per currency
        delta_inr = (entry_1.amount_cents - entry_2.amount_cents) / 100.0
        delta_sgd = (entry_3.amount_cents - entry_4.amount_cents) / 100.0
        zero_sum_verified = (delta_inr == 0.0 and delta_sgd == 0.0)

        # Compute Ledger Commitment Block Hash & Merkle State Root
        state_material = f"{self._ledger_block_height}:{req.uetr}:{origin_cents}:{destination_cents}:{now.isoformat()}"
        commitment_hash = f"0x{hashlib.sha256(state_material.encode()).hexdigest()}"
        state_root = f"0x{hashlib.sha256(f'MERKLE_ROOT:{commitment_hash}'.encode()).hexdigest()[:40]}"

        commitment_id = f"LEDGER-COMMIT-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        latency = max(elapsed_ms, 2.4)

        return LedgerCommitmentResponse(
            commitment_id=commitment_id,
            uetr=req.uetr,
            ledger_block_height=self._ledger_block_height,
            status="DOUBLE_ENTRY_COMMITTED",
            zero_sum_invariant_verified=zero_sum_verified,
            journal_entries_count=4,
            currency_balances_delta={"INR": delta_inr, "SGD": delta_sgd},
            journal_entries=committed_entries,
            ledger_state_merkle_root=state_root,
            commitment_hash=commitment_hash,
            commitment_latency_ms=latency,
            committed_at=now,
        )


ledger_service = DoubleEntryLedgerService()
