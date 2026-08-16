import uuid
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional, Tuple

from app.models.fx_quote import (
    FXQuoteLockRequest,
    FXQuoteResponse,
    FXQuoteVerifyResponse,
)
from app.services.spoke_service import spoke_service


class FXService:
    _SIGNING_SECRET = b"RHIPAY_FX_LIQUIDITY_PROVIDER_KEY_2026"
    _quotes: Dict[str, dict] = {}

    # Mid-market FX benchmark base rates against USD
    _BASE_RATES_TO_USD: Dict[str, Decimal] = {
        "USD": Decimal("1.000000"),
        "SGD": Decimal("1.345000"),
        "INR": Decimal("86.850000"),
        "AED": Decimal("3.672500"),
        "GBP": Decimal("0.785000"),
        "EUR": Decimal("0.925000"),
        "JPY": Decimal("153.200000"),
        "CHF": Decimal("0.885000"),
        "AUD": Decimal("1.540000"),
        "CAD": Decimal("1.390000"),
        "BRL": Decimal("5.750000"),
        "CNY": Decimal("7.240000"),
        "HKD": Decimal("7.780000"),
        "KRW": Decimal("1435.000000"),
        "MYR": Decimal("4.450000"),
        "NZD": Decimal("1.710000"),
        "PHP": Decimal("58.600000"),
        "SAR": Decimal("3.750000"),
        "THB": Decimal("34.500000"),
        "ZAR": Decimal("18.250000"),
    }

    _FX_PROVIDERS = [
        {"id": "FXP-NEXUS-BILATERAL-01", "name": "Nexus Bilateral Liquidity Pool"},
        {"id": "FXP-DBS-GLOBAL", "name": "DBS Global Markets FX"},
        {"id": "FXP-HDFC-TREASURY", "name": "HDFC Bilateral FX Pool"},
        {"id": "FXP-FAB-MENA", "name": "First Abu Dhabi Bank Liquidity Desk"},
    ]

    @classmethod
    def _compute_quote_signature(
        cls,
        quote_id: str,
        origin_ccy: str,
        dest_ccy: str,
        dest_amt: str,
        debit_amt: str,
        exp_iso: str,
    ) -> str:
        msg = f"qid={quote_id}|orig={origin_ccy}|dest={dest_ccy}|amt={dest_amt}|debit={debit_amt}|exp={exp_iso}"
        return hmac.new(cls._SIGNING_SECRET, msg.encode("utf-8"), hashlib.sha256).hexdigest()

    @classmethod
    def get_exchange_rate(
        cls, origin_ccy: str, dest_ccy: str, markup_bps: int = 5
    ) -> Tuple[Decimal, Decimal]:
        """
        Calculates cross-currency exchange rate:
        - fx_rate: Units of Origin Currency per 1 Unit of Destination Currency
        - inverse_rate: Units of Destination Currency per 1 Unit of Origin Currency
        """
        orig_rate = cls._BASE_RATES_TO_USD.get(origin_ccy.upper(), Decimal("1.000000"))
        dest_rate = cls._BASE_RATES_TO_USD.get(dest_ccy.upper(), Decimal("1.000000"))

        # Raw rate: 1 Dest = (orig_rate / dest_rate) Origin
        raw_rate = (orig_rate / dest_rate)

        # Apply spread (5 bps = 0.05%)
        spread_multiplier = Decimal("1.000000") + (Decimal(markup_bps) / Decimal("10000"))
        fx_rate = (raw_rate * spread_multiplier).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
        inverse_rate = (Decimal("1.000000") / fx_rate).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)

        return fx_rate, inverse_rate

    @classmethod
    def lock_quote(cls, request_in: FXQuoteLockRequest) -> FXQuoteResponse:
        orig_ccy = request_in.origin_currency.upper()
        dest_ccy = request_in.destination_currency.upper()
        dest_amt = request_in.destination_amount
        ttl = request_in.ttl_seconds or 60

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=ttl)
        exp_iso = expires_at.isoformat()

        # Currency decimals
        orig_dec = spoke_service.get_currency_decimals(orig_ccy)
        dest_dec = spoke_service.get_currency_decimals(dest_ccy)

        # Exchange rate calculation
        markup_bps = 5
        fx_rate, inverse_rate = cls.get_exchange_rate(orig_ccy, dest_ccy, markup_bps)

        # Origin Debit Amount = dest_amt * fx_rate (Rounded up to prevent underpayment)
        orig_debit_amount = (dest_amt * fx_rate).quantize(
            Decimal(10) ** -orig_dec, rounding=ROUND_HALF_UP
        )

        dest_minor = int(round(dest_amt * Decimal(10 ** dest_dec)))
        orig_minor = int(round(orig_debit_amount * Decimal(10 ** orig_dec)))

        rand_id = uuid.uuid4().hex[:8].upper()
        quote_id = f"RHIPAY-FXQ-{now.strftime('%Y%m%d')}-{rand_id}"

        # Assign FX Provider
        fx_provider = cls._FX_PROVIDERS[0]
        if orig_ccy == "SGD" or dest_ccy == "SGD":
            fx_provider = cls._FX_PROVIDERS[1]
        elif orig_ccy == "INR" or dest_ccy == "INR":
            fx_provider = cls._FX_PROVIDERS[2]
        elif orig_ccy == "AED" or dest_ccy == "AED":
            fx_provider = cls._FX_PROVIDERS[3]

        # Compute Cryptographic Signature
        sig = cls._compute_quote_signature(
            quote_id=quote_id,
            origin_ccy=orig_ccy,
            dest_ccy=dest_ccy,
            dest_amt=f"{dest_amt:.{dest_dec}f}",
            debit_amt=f"{orig_debit_amount:.{orig_dec}f}",
            exp_iso=exp_iso,
        )

        record = {
            "quote_id": quote_id,
            "origin_currency": orig_ccy,
            "destination_currency": dest_ccy,
            "fx_rate": fx_rate,
            "inverse_fx_rate": inverse_rate,
            "destination_amount": dest_amt,
            "origin_debit_amount": orig_debit_amount,
            "destination_amount_in_cents": dest_minor,
            "origin_debit_amount_in_cents": orig_minor,
            "origin_decimals": orig_dec,
            "destination_decimals": dest_dec,
            "fx_markup_bps": markup_bps,
            "fx_provider_id": fx_provider["id"],
            "fx_provider_name": fx_provider["name"],
            "created_at": now,
            "expires_at": expires_at,
            "quote_signature": sig,
            "slippage_protection": True,
        }

        cls._quotes[quote_id] = record

        time_remaining = max(0, int((expires_at - now).total_seconds()))

        return FXQuoteResponse(
            **record,
            ttl_remaining_seconds=time_remaining,
        )

    @classmethod
    def verify_quote(cls, quote_id: str) -> FXQuoteVerifyResponse:
        record = cls._quotes.get(quote_id)
        if not record:
            return FXQuoteVerifyResponse(
                is_valid=False,
                signature_verified=False,
                is_expired=True,
                quote_id=quote_id,
                origin_currency="UNK",
                destination_currency="UNK",
                fx_rate=Decimal("0"),
                destination_amount=Decimal("0"),
                origin_debit_amount=Decimal("0"),
                ttl_remaining_seconds=0,
                error_details=f"Quote ID {quote_id} not found",
            )

        now = datetime.now(timezone.utc)
        expires_at = record["expires_at"]
        is_expired = now > expires_at

        # Verify signature
        orig_dec = record["origin_decimals"]
        dest_dec = record["destination_decimals"]
        expected_sig = cls._compute_quote_signature(
            quote_id=quote_id,
            origin_ccy=record["origin_currency"],
            dest_ccy=record["destination_currency"],
            dest_amt=f"{record['destination_amount']:.{dest_dec}f}",
            debit_amt=f"{record['origin_debit_amount']:.{orig_dec}f}",
            exp_iso=expires_at.isoformat(),
        )

        sig_verified = hmac.compare_digest(record["quote_signature"], expected_sig)
        time_rem = max(0, int((expires_at - now).total_seconds()))

        return FXQuoteVerifyResponse(
            is_valid=(sig_verified and not is_expired),
            signature_verified=sig_verified,
            is_expired=is_expired,
            quote_id=quote_id,
            origin_currency=record["origin_currency"],
            destination_currency=record["destination_currency"],
            fx_rate=record["fx_rate"],
            destination_amount=record["destination_amount"],
            origin_debit_amount=record["origin_debit_amount"],
            ttl_remaining_seconds=time_rem,
            error_details="Quote expired" if is_expired else None,
        )


fx_service = FXService()
