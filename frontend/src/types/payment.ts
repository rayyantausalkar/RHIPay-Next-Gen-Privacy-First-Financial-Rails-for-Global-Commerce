export type ProxyType =
  | "MOBILE"
  | "VPA"
  | "EMAIL"
  | "NATIONAL_ID"
  | "UEN"
  | "IBAN"
  | "ALIAS"
  | string;

export type RequestStatus =
  | "ACTIVE"
  | "SCANNED"
  | "PROCESSING"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export interface SpokeNetworkConfig {
  country_code: string;
  country_name: string;
  currency: string;
  flag_emoji: string;
  ips_scheme_name: string;
  supported_proxy_types: string[];
  currency_decimals: number;
  active: boolean;
  default_proxy_example?: string;
}

export interface SpokeListResponse {
  spokes: SpokeNetworkConfig[];
  total_active_spokes: number;
}

export interface QRPayloadData {
  version: string;
  scheme: string;
  reference_id: string;
  recipient_name: string;
  proxy_type: string;
  proxy_value: string;
  destination_country: string;
  destination_currency: string;
  origin_spoke?: string;
  requested_amount: string;
  amount_in_minor_units: number;
  decimals: number;
  expires_at: string;
  purpose_code: string;
  note?: string;
  recipient_public_key?: string;
}

export interface DynamicPaymentRequestCreate {
  recipient_name: string;
  recipient_proxy_type: string;
  recipient_proxy_value: string;
  destination_country: string;
  destination_currency: string;
  requested_amount: number;
  origin_spoke?: string;
  note?: string;
  expiry_seconds?: number;
  purpose_code?: string;
  recipient_public_key?: string;
}

export interface DynamicPaymentRequestResponse {
  reference_id: string;
  status: RequestStatus;
  recipient_name: string;
  recipient_proxy_type: string;
  recipient_proxy_value: string;
  destination_country: string;
  destination_currency: string;
  origin_spoke?: string;
  requested_amount: number | string;
  amount_in_cents: number;
  currency_decimals: number;
  note?: string;
  purpose_code: string;
  recipient_public_key?: string;
  created_at: string;
  expires_at: string;
  qr_payload: string;
  qr_payload_json: QRPayloadData;
  qr_code_base64: string;
  time_remaining_seconds: number;
}

export interface ProxyValidationRequest {
  proxy_type: string;
  proxy_value: string;
  country: string;
}

export interface ProxyValidationResponse {
  is_valid: boolean;
  formatted_value: string;
  proxy_type: string;
  country: string;
  error_message?: string;
}

export interface ProxyResolutionRequest {
  proxy_type: string;
  proxy_value: string;
  destination_country: string;
  origin_country?: string;
}

export interface ProxyResolutionResponse {
  is_resolved: boolean;
  proxy_type: string;
  proxy_value: string;
  destination_country: string;
  destination_currency: string;
  destination_spoke_scheme: string;
  masked_legal_name: string;
  destination_bic: string;
  destination_bank_name: string;
  masked_account_number: string;
  kyc_status: string;
  recipient_compliance_public_key: string;
  resolution_timestamp: string;
  verification_token: string;
}

export interface ValidationChecks {
  schema_compliance: boolean;
  signature_integrity: boolean;
  expiry_validity: boolean;
  proxy_standard: boolean;
}

export interface PayloadValidationResponse {
  is_valid: boolean;
  signature_verified: boolean;
  is_expired: boolean;
  reference_id: string;
  recipient_name: string;
  proxy_type: string;
  proxy_value: string;
  destination_country: string;
  destination_currency: string;
  origin_spoke?: string;
  requested_amount: number | string;
  currency_decimals: number;
  amount_in_minor_units: number;
  expires_at: string;
  purpose_code: string;
  note?: string;
  recipient_public_key?: string;
  payload_digest: string;
  signature: string;
  validation_checks: ValidationChecks;
  error_details?: string;
}

export interface FXQuoteLockRequest {
  origin_currency: string;
  destination_currency: string;
  destination_amount: number;
  sender_spoke: string;
  recipient_spoke: string;
  ttl_seconds?: number;
}

export interface FXQuoteResponse {
  quote_id: string;
  origin_currency: string;
  destination_currency: string;
  fx_rate: number | string;
  inverse_fx_rate: number | string;
  destination_amount: number | string;
  origin_debit_amount: number | string;
  destination_amount_in_cents: number;
  origin_debit_amount_in_cents: number;
  origin_decimals: number;
  destination_decimals: number;
  fx_markup_bps: number;
  fx_provider_id: string;
  fx_provider_name: string;
  created_at: string;
  expires_at: string;
  ttl_remaining_seconds: number;
  quote_signature: string;
  slippage_protection: boolean;
}

export interface FXQuoteVerifyResponse {
  is_valid: boolean;
  signature_verified: boolean;
  is_expired: boolean;
  quote_id: string;
  origin_currency: string;
  destination_currency: string;
  fx_rate: number | string;
  destination_amount: number | string;
  origin_debit_amount: number | string;
  ttl_remaining_seconds: number;
  error_details?: string;
}

export interface ZKProofGenerateRequest {
  identity_proxy: string;
  sender_spoke: string;
  quote_id: string;
  kyc_tier_required?: number;
}

export interface ZKProofGenerateResponse {
  proof_id: string;
  protocol: string;
  curve: string;
  merkle_root: string;
  nullifier_hash: string;
  quote_id_hash: string;
  leaf_commitment: string;
  generation_time_ms: number;
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  public_signals: string[];
  proof: Record<string, unknown>;
  created_at: string;
}

export interface ZKProofVerifyRequest {
  merkle_root: string;
  nullifier_hash: string;
  quote_id: string;
  proof: Record<string, unknown>;
  public_signals: string[];
}

export interface ZKProofVerifyResponse {
  is_valid: boolean;
  nullifier_is_fresh: boolean;
  merkle_root_verified: boolean;
  verification_time_ms: number;
  error_details?: string;
}

export interface MerkleRootResponse {
  merkle_root: string;
  tree_depth: number;
  total_members: number;
  last_updated: string;
}

export interface MerkleRootValidateRequest {
  merkle_root: string;
  sender_spoke?: string;
  kyc_tier_required?: number;
}

export interface MerkleRootValidateResponse {
  is_valid: boolean;
  is_current_root: boolean;
  is_historical_cached: boolean;
  status: string;
  merkle_root: string;
  tree_depth: number;
  total_participants: number;
  root_age_seconds: number;
  validation_time_ms: number;
  error_details?: string;
}

export interface MerkleTreeUpdateRequest {
  new_leaf_proxy: string;
  spoke?: string;
}

export interface MerkleTreeUpdateResponse {
  previous_merkle_root: string;
  new_merkle_root: string;
  total_participants: number;
  updated_at: string;
}

export interface Groth16VerifyRequest {
  proof: Record<string, unknown>;
  public_signals: string[];
  circuit_name?: string;
}

export interface Groth16VerifyResponse {
  is_valid: boolean;
  pairing_check_passed: boolean;
  public_signals_verified: boolean;
  circuit_name: string;
  curve: string;
  protocol: string;
  verification_time_ms: number;
  pairing_equation_evaluated: string;
  constraints_checked_count: number;
  error_details?: string;
}

export interface NullifierComputeRequest {
  identity_proxy: string;
  sender_spoke: string;
  quote_id: string;
  nonce?: string;
}

export interface NullifierComputeResponse {
  nullifier_hash: string;
  identity_secret_hash: string;
  transaction_seed_hash: string;
  leaf_index: number;
  protocol: string;
  is_fresh: boolean;
  computed_at: string;
}

export interface NullifierVerifyRequest {
  nullifier_hash: string;
}

export interface NullifierVerifyResponse {
  nullifier_hash: string;
  is_fresh: boolean;
  is_spent: boolean;
  spent_at?: string;
  associated_quote_id?: string;
}

export interface NullifierSpendRequest {
  nullifier_hash: string;
  quote_id: string;
}

export interface NullifierSpendResponse {
  nullifier_hash: string;
  status: string;
  spent_at: string;
  quote_id: string;
}

export interface NullifierRegistryCheckRequest {
  nullifier_hash: string;
  quote_id: string;
  uetr?: string;
}

export interface NullifierRegistryCheckResponse {
  is_fresh: boolean;
  is_spent: boolean;
  is_reserved: boolean;
  status: string;
  nullifier_hash: string;
  quote_id: string;
  check_latency_ms: number;
  spent_at?: string;
  associated_quote_id?: string;
  storage_tier: string;
  error_details?: string;
}

export interface CryptographicGateRequest {
  uetr: string;
  message_id: string;
  quote_id: string;
  proof_validity: boolean;
  root_consistency: boolean;
  nullifier_uniqueness: boolean;
  kyc_tier_satisfied?: boolean;
  envelope_integrity?: boolean;
  merkle_root: string;
  nullifier_hash: string;
}

export interface CryptographicGateResponse {
  gate_approved: boolean;
  clearance_status: string;
  clearance_token?: string;
  clearance_token_signature?: string;
  evaluation_timestamp: string;
  gate_checks: {
    proof_validity: boolean;
    root_consistency: boolean;
    nullifier_uniqueness: boolean;
    kyc_tier_satisfied: boolean;
    envelope_integrity: boolean;
  };
  evaluation_latency_ms: number;
  ledger_execution_unlocked: boolean;
  rejection_reasons: string[];
}

export interface LedgerJournalEntry {
  entry_id: string;
  account_id: string;
  account_name: string;
  account_type: string;
  entry_type: "DEBIT" | "CREDIT";
  amount_cents: number;
  currency: string;
  balance_after_cents: number;
  timestamp: string;
}

export interface SpokeAExecutionRequest {
  uetr: string;
  clearance_token: string;
  sender_proxy: string;
  sender_spoke: string;
  sender_currency: string;
  sender_bic: string;
  origin_debit_amount: number;
  fx_rate: number;
  destination_amount: number;
  recipient_currency: string;
  quote_id: string;
  fx_provider_id?: string;
}

export interface SpokeAExecutionResponse {
  settlement_id: string;
  uetr: string;
  status: string;
  home_ips_reference: string;
  sender_spoke: string;
  sender_currency: string;
  amount_debited_cents: number;
  amount_debited_formatted: string;
  fxp_pool_credited_cents: number;
  fxp_pool_credited_formatted: string;
  double_entry_balanced: boolean;
  journal_entries: LedgerJournalEntry[];
  settlement_latency_ms: number;
  executed_at: string;
}

export interface AtomicFxSwapRequest {
  uetr: string;
  settlement_id: string;
  quote_id: string;
  origin_currency: string;
  origin_amount_cents: number;
  destination_currency: string;
  destination_amount_cents: number;
  fx_rate: number;
  fx_provider_id?: string;
  herstatt_risk_mitigation?: string;
}

export interface AtomicFxSwapResponse {
  swap_id: string;
  uetr: string;
  status: string;
  herstatt_risk_status: string;
  pvp_atomic_commit_guaranteed: boolean;
  fx_provider_id: string;
  origin_inflow_formatted: string;
  destination_outflow_formatted: string;
  effective_fx_rate: number;
  journal_entries: LedgerJournalEntry[];
  atomic_execution_latency_ms: number;
  executed_at: string;
}

export interface SpokeBExecutionRequest {
  uetr: string;
  swap_id: string;
  quote_id: string;
  recipient_proxy: string;
  recipient_spoke?: string;
  recipient_currency?: string;
  recipient_bic?: string;
  recipient_name?: string;
  destination_amount: number;
  destination_amount_cents: number;
  fx_provider_id?: string;
}

export interface SpokeBExecutionResponse {
  disbursement_id: string;
  uetr: string;
  status: string;
  host_ips_reference: string;
  recipient_spoke: string;
  recipient_currency: string;
  amount_credited_cents: number;
  amount_credited_formatted: string;
  recipient_name: string;
  double_entry_balanced: boolean;
  journal_entries: LedgerJournalEntry[];
  settlement_latency_ms: number;
  executed_at: string;
}

export interface LedgerCommitmentRequest {
  uetr: string;
  quote_id: string;
  sender_proxy?: string;
  sender_spoke?: string;
  sender_currency?: string;
  recipient_proxy?: string;
  recipient_spoke?: string;
  recipient_currency?: string;
  origin_debit_amount: number;
  destination_credit_amount: number;
  fx_rate: number;
  fx_provider_id?: string;
  spoke_a_settlement_id?: string;
  spoke_b_disbursement_id?: string;
  screening_id?: string;
}

export interface LedgerCommitmentResponse {
  commitment_id: string;
  uetr: string;
  ledger_block_height: number;
  status: string;
  zero_sum_invariant_verified: boolean;
  journal_entries_count: number;
  currency_balances_delta: Record<string, number>;
  journal_entries: LedgerJournalEntry[];
  ledger_state_merkle_root: string;
  commitment_hash: string;
  commitment_latency_ms: number;
  committed_at: string;
}

export interface ComplianceArchivalRequest {
  uetr: string;
  message_id: string;
  pacs008_xml: string;
  zk_public_signals: string[];
  zk_proof_id?: string;
  merkle_root: string;
  nullifier_hash: string;
  travel_rule_receipt_id: string;
  regulatory_ack_token: string;
  enclave_attestation_id: string;
  sanctions_audit_log_id: string;
  sanctions_verdict?: string;
  sanctions_seal_hash: string;
  ledger_commitment_id: string;
  ledger_block_height?: number;
  retention_period_years?: number;
  storage_tier?: string;
}

export interface ComplianceArchivalResponse {
  archive_id: string;
  uetr: string;
  message_id: string;
  status: string;
  archive_seal_hash: string;
  worm_retention_until: string;
  non_repudiation_signature: string;
  audit_bundle_size_bytes: number;
  persisted_components: Record<string, boolean>;
  archival_latency_ms: number;
  archived_at: string;
}

export interface RecipientPushNotificationRequest {
  uetr: string;
  recipient_proxy: string;
  recipient_name?: string;
  recipient_currency?: string;
  amount_credited: number;
  amount_credited_cents: number;
  origin_currency?: string;
  origin_amount?: number;
  sender_masked_name?: string;
  sender_proxy?: string;
  host_ips_reference: string;
  settlement_status?: string;
  payment_note?: string;
}

export interface RecipientPushNotificationResponse {
  notification_id: string;
  uetr: string;
  recipient_proxy: string;
  delivery_channel: string;
  status: string;
  active_subscribers_notified: number;
  credited_amount_formatted: string;
  settlement_status: string;
  host_ips_reference: string;
  push_latency_ms: number;
  delivered_at: string;
}

export interface SenderReceiptRequest {
  uetr: string;
  message_id: string;
  sender_proxy?: string;
  sender_name?: string;
  sender_currency?: string;
  amount_debited: number;
  amount_debited_cents: number;
  recipient_name?: string;
  recipient_proxy?: string;
  recipient_currency?: string;
  amount_credited: number;
  fx_rate?: number;
  zk_proof_id?: string;
  nullifier_hash?: string;
  archive_id?: string;
  ledger_block_height?: number;
  payment_note?: string;
}

export interface SenderReceiptResponse {
  receipt_id: string;
  uetr: string;
  message_id: string;
  status: string;
  iso_status_code: string;
  sender_proxy: string;
  sender_name: string;
  sender_currency: string;
  sender_balance_before: number;
  sender_balance_after: number;
  amount_debited_formatted: string;
  recipient_name: string;
  recipient_proxy: string;
  recipient_currency: string;
  amount_credited_formatted: string;
  effective_fx_rate: number;
  fee_amount_formatted: string;
  clearing_scheme: string;
  receipt_signature_digest: string;
  total_settlement_duration_ms: number;
  ledger_block_height: number;
  issued_at: string;
}

export interface BalanceSheetAccount {
  account_id: string;
  account_name: string;
  account_type: string;
  currency: string;
  balance_cents: number;
  balance_formatted: string;
}

export interface BalanceSheetTelemetry {
  accounts: BalanceSheetAccount[];
  zero_sum_verified: boolean;
  ledger_block_height: number;
  ledger_state_merkle_root: string;
}

export interface ZKProofTelemetry {
  merkle_root: string;
  tree_depth: number;
  total_registered_leaves: number;
  nullifier_uniqueness_rate_pct: number;
  latest_public_signals: string[];
  proving_engine: string;
}

export interface ISO20022MessageSummary {
  message_id: string;
  uetr: string;
  message_type: string;
  instructed_amount: number;
  instructed_currency: string;
  settlement_amount: number;
  settlement_currency: string;
  xml_preview: string;
  status_code: string;
  created_at: string;
}

export interface StatutoryComplianceStatus {
  fatf_enclave_attestation_rate_pct: number;
  sanctions_screening_pass_rate_pct: number;
  worm_7year_retention_sealed_count: number;
  active_regulators: string[];
}

export interface AdminDashboardTelemetryResponse {
  hub_status: string;
  active_spokes_count: number;
  e2e_settlement_p99_latency_ms: number;
  zkp_verification_p99_latency_ms: number;
  sanctions_screening_p99_latency_ms: number;
  total_volume_settled_usd: number;
  balance_sheet: BalanceSheetTelemetry;
  live_zkp_telemetry: ZKProofTelemetry;
  live_iso20022_messages: ISO20022MessageSummary[];
  statutory_compliance_status: StatutoryComplianceStatus;
  timestamp: string;
}

export interface AccountBalance {
  account_id: string;
  account_name: string;
  account_type: string;
  currency: string;
  balance_cents: number;
  balance_formatted: string;
  last_updated: string;
}

export interface RegulatorPublicKeyResponse {
  country_code: string;
  regulator_name: string;
  compliance_node_id: string;
  public_key_pem: string;
  key_algorithm: string;
}

export interface PIIEnvelopeEncryptRequest {
  destination_spoke: string;
  quote_id: string;
  originator_name: string;
  originator_proxy: string;
  originator_address: string;
  originator_national_id: string;
  originator_bic: string;
  beneficiary_name: string;
  beneficiary_proxy: string;
  beneficiary_bic: string;
}

export interface PIIEnvelopeEncryptResponse {
  envelope_id: string;
  destination_spoke: string;
  recipient_regulator_id: string;
  encryption_algorithm: string;
  encrypted_aes_key: string;
  encrypted_pii_ciphertext: string;
  iv: string;
  auth_tag: string;
  envelope_digest: string;
  created_at: string;
}

export interface PIIEnvelopeDecryptRequest {
  destination_spoke: string;
  envelope_id: string;
  encrypted_aes_key: string;
  encrypted_pii_ciphertext: string;
  iv: string;
  auth_tag: string;
}

export interface PIIEnvelopeDecryptResponse {
  is_valid: boolean;
  envelope_id: string;
  originator_name: string;
  originator_proxy: string;
  originator_address: string;
  originator_national_id: string;
  originator_bic: string;
  beneficiary_name: string;
  beneficiary_proxy: string;
  beneficiary_bic: string;
  fatf_travel_rule_compliant: boolean;
  decrypted_at: string;
  error_details?: string;
}

export interface TravelRuleDispatchRequest {
  uetr: string;
  envelope_id: string;
  recipient_regulator_id: string;
  destination_spoke: string;
  origin_spoke?: string;
  encrypted_aes_key: string;
  encrypted_pii_ciphertext: string;
  iv: string;
  auth_tag: string;
  settlement_id?: string;
}

export interface TravelRuleDispatchResponse {
  receipt_id: string;
  uetr: string;
  status: string;
  destination_spoke: string;
  recipient_regulator_node: string;
  compliance_handshake_protocol: string;
  regulatory_acknowledgement_token: string;
  fatf_recommendation_16_compliant: boolean;
  sanction_screening_status: string;
  decrypted_audit_available: boolean;
  dispatch_latency_ms: number;
  dispatched_at: string;
}

export interface SanctionScreeningResult {
  status: string;
  pep_detected: boolean;
  risk_score: number;
  aml_tier: string;
}

export interface EnclaveDecryptionRequest {
  uetr: string;
  envelope_id: string;
  destination_spoke?: string;
  encrypted_aes_key: string;
  encrypted_pii_ciphertext: string;
  iv: string;
  auth_tag: string;
  auditor_node_id?: string;
  enclave_isolation_mode?: string;
}

export interface EnclaveDecryptionResponse {
  attestation_id: string;
  uetr: string;
  envelope_id: string;
  status: string;
  is_valid: boolean;
  originator_name: string;
  originator_proxy: string;
  originator_address: string;
  originator_national_id: string;
  originator_bic: string;
  beneficiary_name: string;
  beneficiary_proxy: string;
  beneficiary_bic: string;
  fatf_travel_rule_compliant: boolean;
  sanction_screening: SanctionScreeningResult;
  auditor_node_id: string;
  enclave_security_tier: string;
  decryption_latency_ms: number;
  decrypted_at: string;
}

export interface WatchlistHit {
  list_name: string;
  matched_entity?: string | null;
  similarity_score: number;
  status: string;
}

export interface PepScreeningResult {
  is_pep: boolean;
  confidence: number;
  details: string;
}

export interface SanctionsScreeningRequest {
  uetr: string;
  originator_name: string;
  originator_proxy: string;
  originator_national_id?: string;
  originator_country?: string;
  beneficiary_name: string;
  beneficiary_proxy: string;
  beneficiary_country?: string;
  transaction_amount?: number;
  currency?: string;
  screening_profile?: string;
}

export interface SanctionsScreeningResponse {
  screening_id: string;
  uetr: string;
  overall_verdict: string;
  is_cleared: boolean;
  risk_score: number;
  risk_tier: string;
  pep_screening: PepScreeningResult;
  watchlist_breakdown: WatchlistHit[];
  audit_log_id: string;
  audit_seal_hash: string;
  compliance_officer_bypass_required: boolean;
  screening_latency_ms: number;
  screened_at: string;
}

export interface Pacs008AssembleRequest {
  quote_id: string;
  sender_proxy: string;
  sender_spoke: string;
  sender_currency: string;
  sender_bic: string;
  recipient_proxy: string;
  recipient_spoke: string;
  recipient_currency: string;
  recipient_bic: string;
  recipient_name: string;
  destination_amount: number;
  origin_debit_amount: number;
  fx_rate: number;
  zk_proof: Record<string, unknown>;
  nullifier_hash: string;
  encrypted_envelope: Record<string, unknown>;
  purpose_code?: string;
  payment_note?: string;
}

export interface Pacs008MessageResponse {
  message_id: string;
  uetr: string;
  end_to_end_id: string;
  message_type: string;
  settlement_method: string;
  clearing_system: string;
  instructed_amount: number;
  instructed_currency: string;
  settlement_amount: number;
  settlement_currency: string;
  exchange_rate: number;
  xml_payload: string;
  canonical_json: Record<string, unknown>;
  is_valid: boolean;
  created_at: string;
}

export interface Pacs008ValidateRequest {
  xml_payload: string;
}

export interface Pacs008ValidateResponse {
  schema_valid: boolean;
  message_type: string;
  details?: string;
}

export interface GatewayFinancialPayload {
  message_id: string;
  uetr: string;
  end_to_end_id: string;
  instructed_amount: number;
  instructed_currency: string;
  settlement_amount: number;
  settlement_currency: string;
  exchange_rate: number;
  debtor_masked_name: string;
  creditor_masked_name: string;
  purpose_code: string;
}

export interface GatewayRoutingPayload {
  origin_spoke: string;
  origin_bic: string;
  destination_spoke: string;
  destination_bic: string;
  clearing_channel: string;
  settlement_method: string;
}

export interface GatewayCryptoPayload {
  nullifier_hash: string;
  merkle_root: string;
  proof_protocol: string;
  proof_curve: string;
  encrypted_envelope_id: string;
  recipient_regulator_id: string;
}

export interface GatewayPipelineIsolation {
  financial_queue: string;
  crypto_queue: string;
  concurrency_isolation_tier: string;
}

export interface GatewayIngestRequest {
  pacs008_message: Pacs008MessageResponse | Record<string, unknown>;
  transmission_channel?: string;
  client_timestamp?: string;
}

export interface GatewayIngestResponse {
  ingestion_id: string;
  idempotency_key: string;
  status: string;
  received_at: string;
  financial_payload: GatewayFinancialPayload;
  routing_payload: GatewayRoutingPayload;
  crypto_payload: GatewayCryptoPayload;
  pipeline_isolation: GatewayPipelineIsolation;
  is_idempotent_replay: boolean;
  ingestion_latency_ms: number;
}

export interface SupplementaryDataRouteRequest {
  ingestion_id: string;
  uetr: string;
  pacs008_message: Pacs008MessageResponse | Record<string, unknown>;
}

export interface SupplementaryDataRouteResponse {
  dispatch_id: string;
  ingestion_id: string;
  uetr: string;
  status: string;
  dispatched_at: string;
  core_ledger_unblocked: boolean;
  isolation_latency_ms: number;
  pipelines: {
    zk_snark_queue: {
      queue_name: string;
      status: string;
      target_engine: string;
      allocated_worker_id: string;
      estimated_execution_time_ms: number;
      protocol: string;
      curve: string;
      merkle_root: string;
      payload_digest: string;
    };
    nullifier_registry_queue: {
      queue_name: string;
      status: string;
      target_engine: string;
      allocated_worker_id: string;
      estimated_execution_time_ms: number;
      nullifier_hash: string;
      payload_digest: string;
    };
    regulatory_compliance_queue: {
      queue_name: string;
      status: string;
      target_engine: string;
      allocated_worker_id: string;
      estimated_execution_time_ms: number;
      destination_spoke: string;
      recipient_regulator_id: string;
      envelope_id: string;
      payload_digest: string;
    };
    core_settlement_highway: {
      queue_name: string;
      status: string;
      target_engine: string;
      allocated_worker_id: string;
      estimated_execution_time_ms: number;
      unblocked: boolean;
      instructed_amount: number;
      settlement_amount: number;
    };
  };
}
