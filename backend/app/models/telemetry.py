from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class RecipientPushNotificationRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    recipient_proxy: str = Field(..., description="Recipient proxy identifier (e.g. +6591234567)")
    recipient_name: str = Field(default="Tan Wei Ling", description="Recipient legal name")
    recipient_currency: str = Field(default="SGD", description="Recipient credited currency")
    amount_credited: float = Field(..., description="Credited settlement amount")
    amount_credited_cents: int = Field(..., description="Integer cents credited")
    origin_currency: str = Field(default="INR", description="Debited origin currency")
    origin_amount: float = Field(default=2835.00, description="Debited origin amount")
    sender_masked_name: str = Field(default="Rahul Sharma", description="Sender masked display name")
    sender_proxy: str = Field(default="+919876543210", description="Sender proxy alias")
    host_ips_reference: str = Field(..., description="Host IPS real-time clearing reference (e.g. PayNow)")
    settlement_status: str = Field(default="ACCP_SETTLED_FUNDS_AVAILABLE", description="ISO 20022 clearing status (ACCP)")
    payment_note: Optional[str] = Field(default=None, description="Optional payment note")


class RecipientPushNotificationResponse(BaseModel):
    notification_id: str
    uetr: str
    recipient_proxy: str
    delivery_channel: str = "WEBSOCKET_REALTIME_PUSH"
    status: str = "DELIVERED_INSTANT_CONFIRMATION"
    active_subscribers_notified: int = 1
    credited_amount_formatted: str
    settlement_status: str = "ACCP_SETTLED_FUNDS_AVAILABLE"
    host_ips_reference: str
    push_latency_ms: float
    delivered_at: datetime


class SenderReceiptRequest(BaseModel):
    uetr: str = Field(..., description="ISO 20022 Unique End-to-End Transaction Reference")
    message_id: str = Field(..., description="pacs.008 message identifier")
    sender_proxy: str = Field(default="+919876543210", description="Sender proxy alias")
    sender_name: str = Field(default="Rahul Sharma", description="Sender legal name")
    sender_currency: str = Field(default="INR", description="Sender debited currency")
    amount_debited: float = Field(..., description="Debited settlement amount")
    amount_debited_cents: int = Field(..., description="Integer cents debited")
    recipient_name: str = Field(default="Tan Wei Ling", description="Recipient legal name")
    recipient_proxy: str = Field(default="+6591234567", description="Recipient proxy identifier")
    recipient_currency: str = Field(default="SGD", description="Recipient credited currency")
    amount_credited: float = Field(..., description="Credited settlement amount")
    fx_rate: float = Field(default=63.00, description="Guaranteed FX rate applied")
    zk_proof_id: Optional[str] = Field(default=None, description="ZK-SNARK proof identifier")
    nullifier_hash: Optional[str] = Field(default=None, description="Inscribed nullifier digest")
    archive_id: Optional[str] = Field(default=None, description="WORM compliance archive ID")
    ledger_block_height: Optional[int] = Field(default=10493, description="Double-entry ledger block sequence")
    payment_note: Optional[str] = Field(default=None, description="Payment note / purpose")


class SenderReceiptResponse(BaseModel):
    receipt_id: str
    uetr: str
    message_id: str
    status: str = "SETTLED_IRREVOCABLE_FINAL"
    iso_status_code: str = "ACCP"
    sender_proxy: str
    sender_name: str
    sender_currency: str
    sender_balance_before: float
    sender_balance_after: float
    amount_debited_formatted: str
    recipient_name: str
    recipient_proxy: str
    recipient_currency: str
    amount_credited_formatted: str
    effective_fx_rate: float
    fee_amount_formatted: str = "INR 0.00"
    clearing_scheme: str = "BIS_NEXUS_P2P_INSTANT"
    receipt_signature_digest: str
    total_settlement_duration_ms: float
    ledger_block_height: int
    issued_at: datetime


class BalanceSheetAccount(BaseModel):
    account_id: str
    account_name: str
    account_type: str
    currency: str
    balance_cents: int
    balance_formatted: str


class BalanceSheetTelemetry(BaseModel):
    accounts: List[BalanceSheetAccount]
    zero_sum_verified: bool = True
    ledger_block_height: int = 10493
    ledger_state_merkle_root: str


class ZKProofTelemetry(BaseModel):
    merkle_root: str
    tree_depth: int = 16
    total_registered_leaves: int = 12450
    nullifier_uniqueness_rate_pct: float = 100.0
    latest_public_signals: List[str]
    proving_engine: str = "Groth16 on BN254"


class ISO20022MessageSummary(BaseModel):
    message_id: str
    uetr: str
    message_type: str
    instructed_amount: float
    instructed_currency: str
    settlement_amount: float
    settlement_currency: str
    xml_preview: str
    status_code: str = "ACCP"
    created_at: datetime


class StatutoryComplianceStatus(BaseModel):
    fatf_enclave_attestation_rate_pct: float = 100.0
    sanctions_screening_pass_rate_pct: float = 100.0
    worm_7year_retention_sealed_count: int = 54291
    active_regulators: List[str] = ["MAS (Singapore)", "RBI (India)", "CBUAE (UAE)", "BNM (Malaysia)", "BOT (Thailand)"]


class AdminDashboardTelemetryResponse(BaseModel):
    hub_status: str = "HEALTHY_OPERATIONAL"
    active_spokes_count: int = 5
    e2e_settlement_p99_latency_ms: float = 1840.0
    zkp_verification_p99_latency_ms: float = 180.0
    sanctions_screening_p99_latency_ms: float = 1.2
    total_volume_settled_usd: float = 14582000.00
    balance_sheet: BalanceSheetTelemetry
    live_zkp_telemetry: ZKProofTelemetry
    live_iso20022_messages: List[ISO20022MessageSummary]
    statutory_compliance_status: StatutoryComplianceStatus
    timestamp: datetime


class WebSocketTelemetryEvent(BaseModel):
    event: str
    timestamp: datetime
    data: Dict[str, Any]
