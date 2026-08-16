import io
import uuid
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
from app.services.proxy_service import ProxyService
from app.services.spoke_service import spoke_service


class RequestService:
    def __init__(self):
        self._requests: Dict[str, dict] = {}

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

        # 4. Expiry handling
        expiry_seconds = request_in.expiry_seconds or 900
        expires_at = now + timedelta(seconds=expiry_seconds)

        # 5. Machine-Readable Structured Payload Data
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
            requested_amount=f"{request_in.requested_amount:.{decimals}f}",
            amount_in_minor_units=amount_in_minor_units,
            decimals=decimals,
            expires_at=expires_at.isoformat(),
            purpose_code=request_in.purpose_code or "P2P_TRANSFER",
            note=request_in.note,
            recipient_public_key=request_in.recipient_public_key,
        )

        # 6. Standardized Interoperable URI
        query_params = {
            "ref": reference_id,
            "proxy": formatted_proxy,
            "type": p_type,
            "country": dest_country,
            "ccy": dest_currency,
            "amt": f"{request_in.requested_amount:.{decimals}f}",
            "minor": str(amount_in_minor_units),
            "name": request_in.recipient_name,
            "exp": expires_at.isoformat(),
            "purpose": request_in.purpose_code or "P2P_TRANSFER",
        }
        if request_in.origin_spoke:
            query_params["origin"] = request_in.origin_spoke.upper()
        if request_in.note:
            query_params["note"] = request_in.note
        if request_in.recipient_public_key:
            query_params["pubkey"] = request_in.recipient_public_key

        qr_payload = f"rhipay://pay?{urllib.parse.urlencode(query_params)}"

        # 7. Generate high-resolution Stylized QR Code
        qr_code_base64 = self._generate_qr_base64(qr_payload)

        # 8. Store request record
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
        }
        self._requests[reference_id] = record

        time_remaining = max(0, int((expires_at - now).total_seconds()))

        return DynamicPaymentRequestResponse(
            **record,
            time_remaining_seconds=time_remaining,
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
                front_color=(15, 23, 42),  # Slate 900
                back_color=(255, 255, 255),
            ),
        )

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"


request_service = RequestService()
