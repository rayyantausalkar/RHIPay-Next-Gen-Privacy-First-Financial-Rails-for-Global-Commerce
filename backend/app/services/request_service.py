import io
import uuid
import hmac
import hashlib
import json
import base64
import urllib.parse
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, Optional, List
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask

from app.models.payment_request import (
    DynamicQRCreateRequest,
    DynamicPaymentRequestResponse,
    QRPayloadData,
    RequestStatus,
    ProxyValidationResponse,
)
from app.models.payload_validation import (
    PayloadValidationResponse,
    ValidationChecks,
)
from app.services.proxy_service import ProxyService
from app.services.spoke_service import spoke_service


class RequestService:
    _SIGNING_SECRET = b"RHIPAY_NEXUS_ZKP_HUB_SIGNING_KEY_2026"
    _active_requests: Dict[str, dict] = {}

    def __init__(self):
        # Share memory dict
        self._requests = RequestService._active_requests

    @classmethod
    def _compute_canonical_signature(
        cls,
        ref: str,
        proxy: str,
        country: str,
        ccy: str,
        amt: str,
        exp: str,
    ) -> str:
        """
        Computes deterministic HMAC-SHA256 signature over critical financial payment parameters.
        """
        canonical_msg = f"ref={ref}|proxy={proxy}|country={country}|ccy={ccy}|amt={amt}|exp={exp}"
        sig = hmac.new(cls._SIGNING_SECRET, canonical_msg.encode("utf-8"), hashlib.sha256).hexdigest()
        return sig

    @classmethod
    def _compute_payload_digest(cls, canonical_str: str) -> str:
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def create_dynamic_request(
        self, request_in: DynamicQRCreateRequest
    ) -> DynamicPaymentRequestResponse:
        dest_country = request_in.destination_country.upper()
        dest_currency = request_in.destination_currency.upper()
        p_type = request_in.recipient_proxy_type.upper()

        # 1. Validate proxy dynamically
        val_res: ProxyValidationResponse = ProxyService.validate_proxy(
            proxy_type=p_type,
            proxy_value=request_in.recipient_proxy_value,
            country=dest_country,
        )
        if not val_res.is_valid:
            raise ValueError(f"Invalid proxy identifier: {val_res.error_message}")

        formatted_proxy = val_res.formatted_value

        # 2. Generate Unique Reference ID
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        rand_id = uuid.uuid4().hex[:8].upper()
        reference_id = f"RHIPAY-REQ-{date_str}-{rand_id}"

        # 3. Dynamic Currency Decimals & Minor Unit Calculation
        decimals = spoke_service.get_currency_decimals(dest_currency)
        multiplier = Decimal(10 ** decimals)
        amount_in_minor_units = int(round(request_in.requested_amount * multiplier))
        amount_formatted = f"{request_in.requested_amount:.{decimals}f}"

        # 4. Expiry handling
        expiry_seconds = request_in.expiry_seconds or 900
        expires_at = now + timedelta(seconds=expiry_seconds)
        exp_iso = expires_at.isoformat()

        # 5. Cryptographic Signature Generation
        signature = self._compute_canonical_signature(
            ref=reference_id,
            proxy=formatted_proxy,
            country=dest_country,
            ccy=dest_currency,
            amt=amount_formatted,
            exp=exp_iso,
        )

        # 6. Machine-Readable Structured Payload Data
        payload_data = QRPayloadData(
            version="2.0",
            scheme="rhipay",
            reference_id=reference_id,
            recipient_name=request_in.recipient_name,
            proxy_type=p_type,
            proxy_value=formatted_proxy,
            destination_country=dest_country,
            destination_currency=dest_currency,
            origin_spoke=request_in.origin_spoke.upper() if request_in.origin_spoke else None,
            requested_amount=amount_formatted,
            amount_in_minor_units=amount_in_minor_units,
            decimals=decimals,
            expires_at=exp_iso,
            purpose_code=request_in.purpose_code or "P2P_TRANSFER",
            note=request_in.note,
            recipient_public_key=request_in.recipient_public_key,
        )

        # 7. Standardized Interoperable URI with Cryptographic Signature
        query_params = {
            "ref": reference_id,
            "proxy": formatted_proxy,
            "type": p_type,
            "country": dest_country,
            "ccy": dest_currency,
            "amt": amount_formatted,
            "minor": str(amount_in_minor_units),
            "name": request_in.recipient_name,
            "exp": exp_iso,
            "purpose": request_in.purpose_code or "P2P_TRANSFER",
            "sig": signature,
        }
        if request_in.origin_spoke:
            query_params["origin"] = request_in.origin_spoke.upper()
        if request_in.note:
            query_params["note"] = request_in.note
        if request_in.recipient_public_key:
            query_params["pubkey"] = request_in.recipient_public_key

        qr_payload = f"rhipay://pay?{urllib.parse.urlencode(query_params)}"

        # 8. Generate high-resolution Stylized QR Code
        qr_code_base64 = self._generate_qr_base64(qr_payload)

        # 9. Store request record
        record = {
            "reference_id": reference_id,
            "status": RequestStatus.ACTIVE,
            "recipient_name": request_in.recipient_name,
            "recipient_proxy_type": p_type,
            "recipient_proxy_value": formatted_proxy,
            "destination_country": dest_country,
            "destination_currency": dest_currency,
            "origin_spoke": request_in.origin_spoke.upper() if request_in.origin_spoke else None,
            "requested_amount": request_in.requested_amount,
            "amount_in_cents": amount_in_minor_units,
            "currency_decimals": decimals,
            "note": request_in.note,
            "purpose_code": request_in.purpose_code or "P2P_TRANSFER",
            "recipient_public_key": request_in.recipient_public_key,
            "created_at": now,
            "expires_at": expires_at,
            "qr_payload": qr_payload,
            "qr_payload_json": payload_data,
            "qr_code_base64": qr_code_base64,
            "signature": signature,
        }
        self._requests[reference_id] = record

        time_remaining = max(0, int((expires_at - now).total_seconds()))

        return DynamicPaymentRequestResponse(
            **record,
            time_remaining_seconds=time_remaining,
        )

    def validate_payload(self, raw_payload: str) -> PayloadValidationResponse:
        """
        Step 3: Ingests raw QR payment string / URI, parses all parameters,
        and verifies cryptographic signature integrity, TTL expiry, and schema compliance.
        """
        clean_input = raw_payload.strip()

        # 1. Parse URI or JSON
        params: Dict[str, str] = {}
        if clean_input.startswith("rhipay://pay?"):
            parsed_url = urllib.parse.urlparse(clean_input)
            parsed_dict = urllib.parse.parse_qs(parsed_url.query)
            params = {k: v[0] for k, v in parsed_dict.items()}
        elif clean_input.startswith("{"):
            try:
                params = json.loads(clean_input)
            except Exception:
                pass
        else:
            # Check if direct reference ID
            stored = self.get_request(clean_input)
            if stored:
                return self.validate_payload(stored.qr_payload)

        # Check schema compliance
        ref = params.get("ref", "")
        proxy = params.get("proxy", "")
        p_type = params.get("type", "MOBILE").upper()
        country = params.get("country", "").upper()
        ccy = params.get("ccy", "").upper()
        amt_str = params.get("amt", "0")
        name = params.get("name", "Unknown Recipient")
        exp_str = params.get("exp", "")
        sig = params.get("sig", "")
        purpose = params.get("purpose", "P2P_TRANSFER")
        note = params.get("note")
        origin = params.get("origin")
        pubkey = params.get("pubkey")

        schema_valid = bool(ref and proxy and country and ccy and amt_str and exp_str)

        # Parse expiry date
        now = datetime.now(timezone.utc)
        is_expired = False
        try:
            exp_dt = datetime.fromisoformat(exp_str)
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            
            # Check stored record if exists
            stored_rec = self._requests.get(ref)
            if stored_rec and stored_rec.get("expires_at"):
                if now > stored_rec["expires_at"]:
                    is_expired = True
            elif now > exp_dt:
                is_expired = True
        except Exception:
            exp_dt = now
            is_expired = True
            schema_valid = False

        # Verify Signature Integrity
        expected_sig = self._compute_canonical_signature(
            ref=ref,
            proxy=proxy,
            country=country,
            ccy=ccy,
            amt=amt_str,
            exp=exp_str,
        )
        sig_verified = bool(sig and hmac.compare_digest(sig, expected_sig))

        # Check Proxy Standard
        proxy_val = ProxyService.validate_proxy(p_type, proxy, country)
        proxy_valid = proxy_val.is_valid

        # Amount parsing
        try:
            req_amount = Decimal(amt_str)
        except Exception:
            req_amount = Decimal("0")
            schema_valid = False

        decimals = spoke_service.get_currency_decimals(ccy)
        minor_units = int(round(req_amount * Decimal(10 ** decimals)))

        # Canonical digest
        canonical_str = f"{ref}:{proxy}:{country}:{ccy}:{amt_str}:{exp_str}:{sig}"
        payload_digest = self._compute_payload_digest(canonical_str)

        all_valid = schema_valid and sig_verified and not is_expired and proxy_valid

        error_msg = None
        if not schema_valid:
            error_msg = "Invalid payload schema: missing required ISO/Nexus fields"
        elif not sig_verified:
            error_msg = "Cryptographic signature mismatch: payment parameters have been altered or tampered"
        elif is_expired:
            error_msg = "Payment request has expired (TTL window closed)"
        elif not proxy_valid:
            error_msg = f"Invalid proxy standard: {proxy_val.error_message}"

        return PayloadValidationResponse(
            is_valid=all_valid,
            signature_verified=sig_verified,
            is_expired=is_expired,
            reference_id=ref,
            recipient_name=name,
            proxy_type=p_type,
            proxy_value=proxy,
            destination_country=country,
            destination_currency=ccy,
            origin_spoke=origin,
            requested_amount=req_amount,
            currency_decimals=decimals,
            amount_in_minor_units=minor_units,
            expires_at=exp_dt,
            purpose_code=purpose,
            note=note,
            recipient_public_key=pubkey,
            payload_digest=payload_digest,
            signature=sig or expected_sig,
            validation_checks=ValidationChecks(
                schema_compliance=schema_valid,
                signature_integrity=sig_verified,
                expiry_validity=not is_expired,
                proxy_standard=proxy_valid,
            ),
            error_details=error_msg,
        )

    def get_request(self, reference_id: str) -> Optional[DynamicPaymentRequestResponse]:
        record = self._requests.get(reference_id)
        if not record:
            return None

        now = datetime.now(timezone.utc)
        expires_at = record["expires_at"]

        if record["status"] == RequestStatus.ACTIVE and now > expires_at:
            record["status"] = RequestStatus.EXPIRED

        time_remaining = max(0, int((expires_at - now).total_seconds()))

        return DynamicPaymentRequestResponse(
            **record,
            time_remaining_seconds=time_remaining,
        )

    def mark_scanned(self, reference_id: str) -> Optional[DynamicPaymentRequestResponse]:
        req = self.get_request(reference_id)
        if not req:
            return None
        if req.status == RequestStatus.ACTIVE:
            self._requests[reference_id]["status"] = RequestStatus.SCANNED
        return self.get_request(reference_id)

    def mark_completed(self, reference_id: str) -> Optional[DynamicPaymentRequestResponse]:
        req = self.get_request(reference_id)
        if not req:
            return None
        self._requests[reference_id]["status"] = RequestStatus.COMPLETED
        return self.get_request(reference_id)

    def mark_completed_by_proxy(self, proxy: str) -> Optional[DynamicPaymentRequestResponse]:
        clean_proxy = proxy.strip().replace(" ", "").lower()
        for ref_id, rec in self._requests.items():
            if rec.get("recipient_proxy_value", "").strip().replace(" ", "").lower() == clean_proxy:
                if rec["status"] in [RequestStatus.ACTIVE, RequestStatus.SCANNED]:
                    rec["status"] = RequestStatus.COMPLETED
                    return self.get_request(ref_id)
        return None

    def cancel_request(self, reference_id: str) -> Optional[DynamicPaymentRequestResponse]:
        req = self.get_request(reference_id)
        if not req:
            return None
        self._requests[reference_id]["status"] = RequestStatus.CANCELLED
        return self.get_request(reference_id)

    def list_recent_requests(self, limit: int = 10) -> List[DynamicPaymentRequestResponse]:
        now = datetime.now(timezone.utc)
        sorted_records = sorted(
            self._requests.values(),
            key=lambda x: x["created_at"],
            reverse=True,
        )[:limit]
        
        results = []
        for r in sorted_records:
            time_rem = max(0, int((r["expires_at"] - now).total_seconds()))
            results.append(
                DynamicPaymentRequestResponse(
                    **r,
                    time_remaining_seconds=time_rem,
                )
            )
        return results

    def _generate_qr_base64(self, payload: str) -> str:
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=3,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            color_mask=SolidFillColorMask(
                front_color=(15, 23, 42),
                back_color=(255, 255, 255),
            ),
        )

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"


request_service = RequestService()
