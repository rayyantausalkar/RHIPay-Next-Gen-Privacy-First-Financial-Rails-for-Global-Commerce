from typing import List
from fastapi import APIRouter
from app.models.ledger import (
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
from app.services.ledger_service import ledger_service

router = APIRouter()


@router.post(
    "/spoke-a/execute",
    response_model=SpokeAExecutionResponse,
    summary="Spoke A Execution (Home IPS - Sender Leg) (Step 15)",
    description="Debits sender retail commercial bank account and credits FXP domestic pool in Spoke A domestic real-time payment rail with balanced double-entry ledger entries.",
)
def execute_spoke_a(payload: SpokeAExecutionRequest):
    return ledger_service.execute_spoke_a_settlement(payload)


@router.post(
    "/fx-swap/execute",
    response_model=AtomicFxSwapResponse,
    summary="Simultaneous Atomic Cross-Currency Execution (Step 16)",
    description="Processes the bilateral FX swap between domestic and foreign liquidity pools inside a single indivisible database transaction, eliminating Herstatt settlement risk.",
)
def execute_atomic_fx_swap(payload: AtomicFxSwapRequest):
    return ledger_service.execute_atomic_fx_swap(payload)


@router.post(
    "/spoke-b/execute",
    response_model=SpokeBExecutionResponse,
    summary="Spoke B Execution (Host IPS - Receiver Leg) (Step 17)",
    description="Debits FXP foreign pool and credits recipient retail account with instant cleared domestic fiat on Host IPS real-time payment network.",
)
def execute_spoke_b(payload: SpokeBExecutionRequest):
    return ledger_service.execute_spoke_b_settlement(payload)


@router.post(
    "/ledger/commit",
    response_model=LedgerCommitmentResponse,
    summary="Double-Entry Ledger Commitment (Step 21)",
    description="Records balanced debit and credit entries across all sender, recipient, and FX pool accounts, enforcing zero-sum accounting invariants.",
)
def commit_ledger(payload: LedgerCommitmentRequest):
    return ledger_service.commit_double_entry_ledger(payload)


@router.get(
    "/accounts/balances",
    response_model=List[AccountBalance],
    summary="Get Double-Entry Ledger Account Balances",
    description="Returns real-time integer balances across sender, FXP, and recipient bilateral pool accounts.",
)
def get_account_balances():
    return ledger_service.get_account_balances()
