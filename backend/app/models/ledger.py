from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class LedgerJournalEntry(BaseModel):
    entry_id: str = Field(..., description="Unique immutable ledger journal line entry ID")
    account_id: str = Field(..., description="Ledger account code")
    account_name: str = Field(..., description="Human-readable ledger account title")
    account_type: str = Field(..., description="SENDER_RETAIL_ACCT | FXP_SPOKE_A_POOL | FXP_SPOKE_B_POOL | RECIPIENT_RETAIL_ACCT")
    entry_type: str = Field(..., description="DEBIT or CREDIT")
    amount_cents: int = Field(..., description="Integer amount in minor currency units (cents/paise)")
    currency: str = Field(..., description="ISO 4217 Currency Code")
    balance_after_cents: int = Field(..., description="Account balance after applying entry in integer minor units")
    timestamp: datetime


class SpokeAExecutionRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    clearance_token: str = Field(..., description="Signed Cryptographic Clearance Token from Step 14")
    sender_proxy: str = Field(..., description="Sender proxy alias / account")
    sender_spoke: str = Field(..., description="Sender domestic spoke (e.g. IN)")
    sender_currency: str = Field(..., description="Sender domestic currency (e.g. INR)")
    sender_bic: str = Field(..., description="Sender commercial bank routing BIC")
    origin_debit_amount: float = Field(..., description="Domestic debit amount in decimal")
    fx_rate: float = Field(..., description="Guaranteed FX rate applied")
    destination_amount: float = Field(..., description="Destination credit amount in foreign currency")
    recipient_currency: str = Field(..., description="Recipient currency (e.g. SGD)")
    quote_id: str = Field(..., description="Locked FX Quote ID")
    fx_provider_id: Optional[str] = Field(default="DBS_GLOBAL_LIQUIDITY_DESK", description="Designated FX liquidity pool provider")


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
    settlement_id: str = Field(..., description="Spoke A settlement execution reference")
    quote_id: str = Field(..., description="Locked FX Quote ID")
    origin_currency: str = Field(default="INR", description="Domestic currency received in Spoke A")
    origin_amount_cents: int = Field(..., description="Integer minor units received (e.g. paise)")
    destination_currency: str = Field(default="SGD", description="Foreign currency disbursed in Spoke B")
    destination_amount_cents: int = Field(..., description="Integer minor units earmarked (e.g. cents)")
    fx_rate: float = Field(..., description="Guaranteed conversion rate")
    fx_provider_id: Optional[str] = Field(default="DBS_GLOBAL_LIQUIDITY_DESK", description="FX liquidity desk")
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


class AccountBalance(BaseModel):
    account_id: str
    account_name: str
    account_type: str
    currency: str
    balance_cents: int
    balance_formatted: str
    last_updated: datetime
