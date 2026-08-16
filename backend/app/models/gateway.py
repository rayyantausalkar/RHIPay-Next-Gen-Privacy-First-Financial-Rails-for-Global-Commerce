from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class GatewayFinancialPayload(BaseModel):
    message_id: str
    uetr: str
    end_to_end_id: str
    instructed_amount: float
    instructed_currency: str
    settlement_amount: float
    settlement_currency: str
    exchange_rate: float
    debtor_masked_name: str
    creditor_masked_name: str
    purpose_code: str


class GatewayRoutingPayload(BaseModel):
    origin_spoke: str
    origin_bic: str
    destination_spoke: str
    destination_bic: str
    clearing_channel: str
    settlement_method: str


class GatewayCryptoPayload(BaseModel):
    nullifier_hash: str
    merkle_root: str
    proof_protocol: str
    proof_curve: str
    encrypted_envelope_id: str
    recipient_regulator_id: str


class GatewayPipelineIsolation(BaseModel):
    financial_queue: str = Field(default="HIGH_PRIORITY_ROUTING", description="Fast-path interbank routing queue")
    crypto_queue: str = Field(default="ASYNC_ZK_VERIFIER_POOL", description="Heavy compute ZK-SNARK verifier pool")
    concurrency_isolation_tier: str = Field(default="ISOLATED_THREAD_WORKER", description="Process isolation layer")


class GatewayIngestRequest(BaseModel):
    pacs008_message: Dict[str, Any] = Field(..., description="ISO 20022 pacs.008 transmission bundle")
    transmission_channel: str = Field(default="NEXUS_HTTPS_TLS13", description="Encrypted transport protocol")
    client_timestamp: Optional[datetime] = Field(None, description="Sender client transmission timestamp")


class GatewayIngestResponse(BaseModel):
    ingestion_id: str
    idempotency_key: str
    status: str = "INGESTED"
    received_at: datetime
    financial_payload: GatewayFinancialPayload
    routing_payload: GatewayRoutingPayload
    crypto_payload: GatewayCryptoPayload
    pipeline_isolation: GatewayPipelineIsolation
    is_idempotent_replay: bool = False
    ingestion_latency_ms: float = 4.2
