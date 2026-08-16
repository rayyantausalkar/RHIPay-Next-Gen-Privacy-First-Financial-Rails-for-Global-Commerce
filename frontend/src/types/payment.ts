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
  country_code: string; // ISO 3166-1 alpha-2
  country_name: string;
  currency: string; // ISO 4217
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
  destination_country: string; // ISO 3166-1 alpha-2 (e.g. SG, IN, AE, US, GB, JP)
  destination_currency: string; // ISO 4217 (e.g. SGD, INR, AED, USD, EUR, JPY)
  requested_amount: number;
  origin_spoke?: string; // Optional Originating Spoke
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
  destination_country: string; // ISO 3166-1 alpha-2
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
