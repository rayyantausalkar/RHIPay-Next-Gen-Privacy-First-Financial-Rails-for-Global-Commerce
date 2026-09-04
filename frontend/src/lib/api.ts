import {
  DynamicPaymentRequestCreate,
  DynamicPaymentRequestResponse,
  ProxyValidationRequest,
  ProxyValidationResponse,
  ProxyResolutionRequest,
  ProxyResolutionResponse,
  PayloadValidationResponse,
  FXQuoteLockRequest,
  FXQuoteResponse,
  FXQuoteVerifyResponse,
  ZKProofGenerateRequest,
  ZKProofGenerateResponse,
  ZKProofVerifyRequest,
  ZKProofVerifyResponse,
  MerkleRootResponse,
  MerkleRootValidateRequest,
  MerkleRootValidateResponse,
  MerkleTreeUpdateRequest,
  MerkleTreeUpdateResponse,
  Groth16VerifyRequest,
  Groth16VerifyResponse,
  NullifierComputeRequest,
  NullifierComputeResponse,
  NullifierVerifyRequest,
  NullifierVerifyResponse,
  NullifierSpendRequest,
  NullifierSpendResponse,
  NullifierRegistryCheckRequest,
  NullifierRegistryCheckResponse,
  CryptographicGateRequest,
  CryptographicGateResponse,
  SpokeAExecutionRequest,
  SpokeAExecutionResponse,
  AtomicFxSwapRequest,
  AtomicFxSwapResponse,
  SpokeBExecutionRequest,
  SpokeBExecutionResponse,
  LedgerCommitmentRequest,
  LedgerCommitmentResponse,
  AccountBalance,
  RegulatorPublicKeyResponse,
  PIIEnvelopeEncryptRequest,
  PIIEnvelopeEncryptResponse,
  PIIEnvelopeDecryptRequest,
  PIIEnvelopeDecryptResponse,
  TravelRuleDispatchRequest,
  TravelRuleDispatchResponse,
  EnclaveDecryptionRequest,
  EnclaveDecryptionResponse,
  SanctionsScreeningRequest,
  SanctionsScreeningResponse,
  ComplianceArchivalRequest,
  ComplianceArchivalResponse,
  RecipientPushNotificationRequest,
  RecipientPushNotificationResponse,
  SenderReceiptRequest,
  SenderReceiptResponse,
  AdminDashboardTelemetryResponse,
  Pacs008AssembleRequest,
  Pacs008MessageResponse,
  Pacs008ValidateRequest,
  Pacs008ValidateResponse,
  GatewayIngestRequest,
  GatewayIngestResponse,
  SupplementaryDataRouteRequest,
  SupplementaryDataRouteResponse,
  SpokeListResponse,
} from "@/types/payment";

import { API_BASE as API_BASE_URL } from "./config";


export async function getNetworkSpokes(): Promise<SpokeListResponse> {
  const res = await fetch(`${API_BASE_URL}/network/spokes`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return {
      spokes: [
        {
          country_code: "SG",
          country_name: "Singapore",
          currency: "SGD",
          flag_emoji: "🇸🇬",
          ips_scheme_name: "PayNow",
          supported_proxy_types: ["MOBILE", "UEN", "NATIONAL_ID", "VPA"],
          currency_decimals: 2,
          active: true,
          default_proxy_example: "+6591234567",
        },
        {
          country_code: "IN",
          country_name: "India",
          currency: "INR",
          flag_emoji: "🇮🇳",
          ips_scheme_name: "UPI",
          supported_proxy_types: ["VPA", "MOBILE", "NATIONAL_ID"],
          currency_decimals: 2,
          active: true,
          default_proxy_example: "merchant@okhdfcbank",
        },
      ],
      total_active_spokes: 2,
    };
  }

  return res.json();
}

export async function createPaymentRequest(
  data: DynamicPaymentRequestCreate
): Promise<DynamicPaymentRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/requests/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to create payment request");
  }

  return res.json();
}

export async function getPaymentRequest(
  referenceId: string
): Promise<DynamicPaymentRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/requests/${referenceId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Payment request not found");
  }

  return res.json();
}

export async function markRequestScanned(
  referenceId: string
): Promise<DynamicPaymentRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/requests/${referenceId}/scanned`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to update scanned status");
  }

  return res.json();
}

export async function completePaymentRequest(
  referenceId: string
): Promise<DynamicPaymentRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/requests/${referenceId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to complete payment request");
  }

  return res.json();
}

export async function cancelPaymentRequest(
  referenceId: string
): Promise<DynamicPaymentRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/requests/${referenceId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to cancel payment request");
  }

  return res.json();
}

export async function listRecentRequests(
  limit: number = 10
): Promise<DynamicPaymentRequestResponse[]> {
  const res = await fetch(`${API_BASE_URL}/requests/?limit=${limit}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function validateProxy(
  data: ProxyValidationRequest
): Promise<ProxyValidationResponse> {
  const res = await fetch(`${API_BASE_URL}/proxies/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    return {
      is_valid: true,
      formatted_value: data.proxy_value,
      proxy_type: data.proxy_type,
      country: data.country,
    };
  }

  return res.json();
}

export async function resolveProxyAlias(
  data: ProxyResolutionRequest
): Promise<ProxyResolutionResponse> {
  const res = await fetch(`${API_BASE_URL}/proxies/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to resolve proxy alias");
  }

  return res.json();
}

export async function validatePaymentPayload(
  rawPayload: string
): Promise<PayloadValidationResponse> {
  const res = await fetch(`${API_BASE_URL}/requests/validate-payload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_payload: rawPayload }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to validate payment payload");
  }

  return res.json();
}

export async function lockFXQuote(
  data: FXQuoteLockRequest
): Promise<FXQuoteResponse> {
  const res = await fetch(`${API_BASE_URL}/fx/quotes/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to lock FX quote");
  }

  return res.json();
}

export async function verifyFXQuote(
  quoteId: string
): Promise<FXQuoteVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/fx/quotes/${quoteId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_id: quoteId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to verify FX quote");
  }

  return res.json();
}

export async function generateZKProof(
  data: ZKProofGenerateRequest
): Promise<ZKProofGenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/generate-proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to generate ZK proof");
  }

  return res.json();
}

export async function verifyZKProof(
  data: ZKProofVerifyRequest
): Promise<ZKProofVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/verify-proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to verify ZK proof");
  }

  return res.json();
}

export async function getMerkleRoot(): Promise<MerkleRootResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/merkle-root`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Merkle root");
  }

  return res.json();
}

export async function validateMerkleRoot(
  data: MerkleRootValidateRequest
): Promise<MerkleRootValidateResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/merkle-root/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to validate Merkle root");
  }

  return res.json();
}

export async function pushMerkleTreeUpdate(
  data: MerkleTreeUpdateRequest
): Promise<MerkleTreeUpdateResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/merkle-root/push-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to push Merkle tree update");
  }

  return res.json();
}

export async function verifyGroth16Circuit(
  data: Groth16VerifyRequest
): Promise<Groth16VerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/groth16/verify-circuit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Groth16 circuit verification failed");
  }

  return res.json();
}

export async function evaluateCryptographicGate(
  data: CryptographicGateRequest
): Promise<CryptographicGateResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/crypto-gate/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Cryptographic gate evaluation failed");
  }

  return res.json();
}

export async function executeSpokeASettlement(
  data: SpokeAExecutionRequest
): Promise<SpokeAExecutionResponse> {
  const res = await fetch(`${API_BASE_URL}/settlement/spoke-a/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Spoke A settlement execution failed");
  }

  return res.json();
}

export async function executeAtomicFxSwap(
  data: AtomicFxSwapRequest
): Promise<AtomicFxSwapResponse> {
  const res = await fetch(`${API_BASE_URL}/settlement/fx-swap/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Atomic FX swap execution failed");
  }

  return res.json();
}

export async function executeSpokeBSettlement(
  data: SpokeBExecutionRequest
): Promise<SpokeBExecutionResponse> {
  const res = await fetch(`${API_BASE_URL}/settlement/spoke-b/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Spoke B settlement execution failed");
  }

  return res.json();
}

export async function commitDoubleEntryLedger(
  data: LedgerCommitmentRequest
): Promise<LedgerCommitmentResponse> {
  const res = await fetch(`${API_BASE_URL}/settlement/ledger/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Double-entry ledger commitment failed");
  }

  return res.json();
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
  const res = await fetch(`${API_BASE_URL}/settlement/accounts/balances`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch account balances");
  }

  return res.json();
}

export async function computeNullifier(
  data: NullifierComputeRequest
): Promise<NullifierComputeResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/nullifier/compute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to compute nullifier");
  }

  return res.json();
}

export async function registryCheckNullifier(
  data: NullifierRegistryCheckRequest
): Promise<NullifierRegistryCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/nullifier/registry-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Nullifier registry check failed");
  }

  return res.json();
}

export async function verifyNullifier(
  nullifierHash: string
): Promise<NullifierVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/nullifier/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nullifier_hash: nullifierHash }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to verify nullifier");
  }

  return res.json();
}

export async function spendNullifier(
  nullifierHash: string,
  quoteId: string
): Promise<NullifierSpendResponse> {
  const res = await fetch(`${API_BASE_URL}/zk/nullifier/spend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nullifier_hash: nullifierHash, quote_id: quoteId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to spend nullifier");
  }

  return res.json();
}

export async function resetNullifierRegistry(): Promise<void> {
  await fetch(`${API_BASE_URL}/zk/nullifier/reset-registry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function getComplianceKey(
  spokeCode: string
): Promise<RegulatorPublicKeyResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/keys/${spokeCode}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to fetch regulator compliance key");
  }

  return res.json();
}

export async function encryptPIIEnvelope(
  data: PIIEnvelopeEncryptRequest
): Promise<PIIEnvelopeEncryptResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/encrypt-envelope`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to encrypt PII envelope");
  }

  return res.json();
}

export async function decryptPIIEnvelope(
  data: PIIEnvelopeDecryptRequest
): Promise<PIIEnvelopeDecryptResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/decrypt-envelope`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to decrypt PII envelope");
  }

  return res.json();
}

export async function dispatchTravelRuleEnvelope(
  data: TravelRuleDispatchRequest
): Promise<TravelRuleDispatchResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/travel-rule/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "FATF Travel Rule dispatch failed");
  }

  return res.json();
}

export async function executeEnclaveDecryption(
  data: EnclaveDecryptionRequest
): Promise<EnclaveDecryptionResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/enclave/decrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Private key enclave decryption failed");
  }

  return res.json();
}

export async function screenSanctionsIdentity(
  data: SanctionsScreeningRequest
): Promise<SanctionsScreeningResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/sanctions/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Sanctions screening check failed");
  }

  return res.json();
}

export async function commitComplianceArchival(
  data: ComplianceArchivalRequest
): Promise<ComplianceArchivalResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/archival/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Compliance message archival failed");
  }

  return res.json();
}

export async function getComplianceArchive(
  uetr: string
): Promise<ComplianceArchivalResponse> {
  const res = await fetch(`${API_BASE_URL}/compliance/archival/${uetr}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to retrieve compliance archival record");
  }

  return res.json();
}

export async function dispatchRecipientPush(
  data: RecipientPushNotificationRequest
): Promise<RecipientPushNotificationResponse> {
  const res = await fetch(`${API_BASE_URL}/telemetry/push/recipient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Recipient push notification failed");
  }

  return res.json();
}

export async function getPushHistory(limit = 10): Promise<RecipientPushNotificationResponse[]> {
  const res = await fetch(`${API_BASE_URL}/telemetry/push/history?limit=${limit}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch push notification history");
  }

  return res.json();
}

export async function generateSenderReceipt(
  data: SenderReceiptRequest
): Promise<SenderReceiptResponse> {
  const res = await fetch(`${API_BASE_URL}/telemetry/receipt/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Sender digital receipt generation failed");
  }

  return res.json();
}

export async function getSenderReceipt(
  uetr: string
): Promise<SenderReceiptResponse> {
  const res = await fetch(`${API_BASE_URL}/telemetry/receipt/${uetr}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to retrieve settlement receipt");
  }

  return res.json();
}

export async function getAdminDashboardTelemetry(): Promise<AdminDashboardTelemetryResponse> {
  const res = await fetch(`${API_BASE_URL}/telemetry/admin/dashboard`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch admin dashboard telemetry stream");
  }

  return res.json();
}

export async function assemblePacs008(
  data: Pacs008AssembleRequest
): Promise<Pacs008MessageResponse> {
  const res = await fetch(`${API_BASE_URL}/iso20022/pacs008/assemble`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to assemble ISO 20022 message");
  }

  return res.json();
}

export async function validatePacs008(
  xmlPayload: string
): Promise<Pacs008ValidateResponse> {
  const res = await fetch(`${API_BASE_URL}/iso20022/pacs008/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ xml_payload: xmlPayload }),
  });

  if (!res.ok) {
    return { schema_valid: false, message_type: "pacs.008.001.10" };
  }

  return res.json();
}

export async function ingestGatewayTransmission(
  data: GatewayIngestRequest,
  idempotencyKey?: string,
  originSpoke?: string
): Promise<GatewayIngestResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Nexus-Client-Version": "rhipay-v2.0",
    "X-Signature-Algorithm": "HMAC-SHA256",
  };

  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }
  if (originSpoke) {
    headers["X-Nexus-Spoke"] = originSpoke;
  }

  const res = await fetch(`${API_BASE_URL}/gateway/ingest`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Gateway transmission ingestion failed");
  }

  return res.json();
}

export async function dispatchSupplementaryData(
  data: SupplementaryDataRouteRequest
): Promise<SupplementaryDataRouteResponse> {
  const res = await fetch(`${API_BASE_URL}/routing/supplementary-data/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Supplementary data routing failed");
  }

  return res.json();
}
