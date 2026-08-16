from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LedgerJournalEntry(BaseModel):
    entry_id: str
    account_id: str
    account_name: str
    account_type: str = Field(..., description="RETAIL_DEBTOR | FXP_POOL_DOMESTIC | FXP_POOL_FOREIGN | RETAIL_CREDITOR")
    entry_type: str = Field(..., description="DEBIT | CREDIT")
    amount_cents: int = Field(..., description="Integer unit amount in paise / cents (no float rounding errors)")
    currency: str = Field(..., description="ISO 4217 Currency Code (INR, SGD, etc.)")
    balance_after_cents: int = Field(..., description="Post-posting account balance in integer units")
    timestamp: datetime


class SpokeAExecutionRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    clearance_token: str = Field(..., description="Cryptographic Gating Clearance Token from Step 14")
    sender_proxy: str = Field(..., description="Sender proxy alias / account")
    sender_spoke: str = Field(default="IN", description="Originating home country spoke (e.g. IN)")
    sender_currency: str = Field(default="INR", description="Sender domestic currency (e.g. INR)")
    sender_bic: str = Field(default="HDFCINBBXXX", description="Sender commercial bank BIC")
    origin_debit_amount: float = Field(..., description="Amount debited in origin currency (e.g. 2835.00)")
    fx_rate: float = Field(..., description="Guaranteed FX rate locked in Step 4")
    destination_amount: float = Field(..., description="Target disbursement amount (e.g. 45.00)")
    recipient_currency: str = Field(default="SGD", description="Target disbursement currency (e.g. SGD)")
    quote_id: str = Field(..., description="Locked FX Quote reference")
    fx_provider_id: Optional[str] = Field(default="DBS_GLOBAL_LIQUIDITY_DESK", description="Bilateral FX Liquidity Provider")


class SpokeAExecutionResponse(BaseModel):
    settlement_id: str
    uetr: str
    status: str = "SPOKE_A_SETTLED"
    home_ips_reference: str
    sender_spoke: str
    sender_currency: str
    amount_debited_cents: int
    amount_debited_formatted: str
    fxp_pool_credited_cents: int
    fxp_pool_credited_formatted: str
    double_entry_balanced: bool
    journal_entries: List[LedgerJournalEntry]
    settlement_latency_ms: float
    executed_at: datetime


class AtomicFxSwapRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    settlement_id: str = Field(..., description="Spoke A settlement execution ID from Step 15")
    quote_id: str = Field(..., description="Locked FX Quote ID")
    origin_currency: str = Field(default="INR", description="Origin currency (e.g. INR)")
    origin_amount_cents: int = Field(..., description="Integer paise deposited into domestic pool (e.g. 283500)")
    destination_currency: str = Field(default="SGD", description="Destination currency (e.g. SGD)")
    destination_amount_cents: int = Field(..., description="Integer cents withdrawn from foreign pool (e.g. 4500)")
    fx_rate: float = Field(..., description="Guaranteed bilateral exchange rate")
    fx_provider_id: Optional[str] = Field(default="DBS_GLOBAL_LIQUIDITY_DESK", description="Bilateral FX liquidity desk ID")
    herstatt_risk_mitigation: Optional[str] = Field(default="PVP_ATOMIC_COMMIT", description="Payment-versus-Payment atomic commit mechanism")


class AtomicFxSwapResponse(BaseModel):
    swap_id: str
    uetr: str
    status: str = "ATOMIC_FX_SWAP_SETTLED"
    herstatt_risk_status: str = "HERSTATT_RISK_ELIMINATED"
    pvp_atomic_commit_guaranteed: bool = True
    fx_provider_id: str
    origin_inflow_formatted: str
    destination_outflow_formatted: str
    effective_fx_rate: float
    journal_entries: List[LedgerJournalEntry]
    atomic_execution_latency_ms: float
    executed_at: datetime


class SpokeBExecutionRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    swap_id: str = Field(..., description="Atomic FX swap reference from Step 16")
    quote_id: str = Field(..., description="Locked FX Quote ID")
    recipient_proxy: str = Field(..., description="Recipient proxy alias / account")
    recipient_spoke: str = Field(default="SG", description="Recipient host country spoke (e.g. SG)")
    recipient_currency: str = Field(default="SGD", description="Recipient domestic currency (e.g. SGD)")
    recipient_bic: str = Field(default="DBSSSGSGXXX", description="Recipient commercial bank BIC")
    recipient_name: str = Field(default="Tan Wei Ling", description="Recipient legal name")
    destination_amount: float = Field(..., description="Destination credit amount in decimal")
    destination_amount_cents: int = Field(..., description="Integer minor units (cents)")
    fx_provider_id: Optional[str] = Field(default="DBS_GLOBAL_LIQUIDITY_DESK", description="FX liquidity provider")


class SpokeBExecutionResponse(BaseModel):
    disbursement_id: str
    uetr: str
    status: str = "SPOKE_B_SETTLED"
    host_ips_reference: str
    recipient_spoke: str
    recipient_currency: str
    amount_credited_cents: int
    amount_credited_formatted: str
    recipient_name: str
    double_entry_balanced: bool
    journal_entries: List[LedgerJournalEntry]
    settlement_latency_ms: float
    executed_at: datetime


class LedgerCommitmentRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    quote_id: str = Field(..., description="Locked FX Quote reference")
    sender_proxy: str = Field(default="+919876543210", description="Payer proxy alias")
    sender_spoke: str = Field(default="IN", description="Originating home country spoke")
    sender_currency: str = Field(default="INR", description="Payer debit currency")
    recipient_proxy: str = Field(default="+6591234567", description="Payee proxy alias")
    recipient_spoke: str = Field(default="SG", description="Host destination country spoke")
    recipient_currency: str = Field(default="SGD", description="Payee credit currency")
    origin_debit_amount: float = Field(default=2835.00, description="Gross debited amount in origin currency")
    destination_credit_amount: float = Field(default=45.00, description="Gross credited amount in destination currency")
    fx_rate: float = Field(default=63.00, description="Locked exchange rate")
    fx_provider_id: Optional[str] = Field(default="FXP-DBS-GLOBAL-01", description="FX provider desk")
    spoke_a_settlement_id: Optional[str] = Field(default=None, description="Spoke A settlement execution reference")
    spoke_b_disbursement_id: Optional[str] = Field(default=None, description="Spoke B disbursement reference")
    screening_id: Optional[str] = Field(default=None, description="AML / Sanctions screening reference")


class LedgerCommitmentResponse(BaseModel):
    commitment_id: str
    uetr: str
    ledger_block_height: int
    status: str = "DOUBLE_ENTRY_COMMITTED"
    zero_sum_invariant_verified: bool = True
    journal_entries_count: int = 4
    currency_balances_delta: Dict[str, float] = Field(default_factory=lambda: {"INR": 0.0, "SGD": 0.0})
    journal_entries: List[LedgerJournalEntry]
    ledger_state_merkle_root: str
    commitment_hash: str
    commitment_latency_ms: float
    committed_at: datetime


class AccountBalance(BaseModel):
    account_id: str
    account_name: str
    account_type: str
    currency: str
    balance_cents: int
    balance_formatted: str
    last_updated: datetime
