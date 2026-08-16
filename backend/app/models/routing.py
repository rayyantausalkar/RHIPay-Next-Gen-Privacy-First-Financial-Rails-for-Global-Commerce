from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class QueueDispatchItem(BaseModel):
    queue_name: str
    status: str = "ROUTED"
    target_engine: str
    payload_digest: str
    allocated_worker_id: str
    estimated_execution_time_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SupplementaryDataRouteRequest(BaseModel):
    ingestion_id: str = Field(..., description="API Gateway Ingestion ID")
    uetr: str = Field(..., description="RFC 4122 UUID v4 End-to-End Reference")
    pacs008_message: Dict[str, Any] = Field(..., description="Full ISO 20022 pacs.008 transmission bundle")


class SupplementaryDataRouteResponse(BaseModel):
    dispatch_id: str
    ingestion_id: str
    uetr: str
    status: str = "DISPATCHED"
    dispatched_at: datetime
    core_ledger_unblocked: bool = True
    isolation_latency_ms: float = 1.8
    pipelines: Dict[str, Any]
