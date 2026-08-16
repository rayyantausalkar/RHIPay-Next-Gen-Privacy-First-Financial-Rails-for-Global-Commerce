from typing import Dict, List, Optional
from app.models.spoke_registry import SpokeNetworkConfig, SpokeRegisterRequest


class SpokeService:
    def __init__(self):
        # Pre-populate registry with major global Instant Payment Systems (IPS)
        self._spokes: Dict[str, SpokeNetworkConfig] = {
            "SG": SpokeNetworkConfig(
                country_code="SG",
                country_name="Singapore",
                currency="SGD",
                flag_emoji="🇸🇬",
                ips_scheme_name="PayNow / FAST",
                supported_proxy_types=["MOBILE", "UEN", "NATIONAL_ID", "VPA"],
                currency_decimals=2,
                default_proxy_example="+6591234567",
            ),
            "IN": SpokeNetworkConfig(
                country_code="IN",
                country_name="India",
                currency="INR",
                flag_emoji="🇮🇳",
                ips_scheme_name="UPI / IMPS",
                supported_proxy_types=["VPA", "MOBILE", "NATIONAL_ID"],
                currency_decimals=2,
                default_proxy_example="merchant@okhdfcbank",
            ),
            "AE": SpokeNetworkConfig(
                country_code="AE",
                country_name="United Arab Emirates",
                currency="AED",
                flag_emoji="🇦🇪",
                ips_scheme_name="Aani (IPP)",
                supported_proxy_types=["MOBILE", "EMAIL", "NATIONAL_ID", "IBAN"],
                currency_decimals=2,
                default_proxy_example="+971501234567",
            ),
            "US": SpokeNetworkConfig(
                country_code="US",
                country_name="United States",
                currency="USD",
                flag_emoji="🇺🇸",
                ips_scheme_name="FedNow / RTP",
                supported_proxy_types=["EMAIL", "MOBILE", "ALIAS"],
                currency_decimals=2,
                default_proxy_example="payee@nexus.org",
            ),
            "GB": SpokeNetworkConfig(
                country_code="GB",
                country_name="United Kingdom",
                currency="GBP",
                flag_emoji="🇬🇧",
                ips_scheme_name="Faster Payments (FPS)",
                supported_proxy_types=["MOBILE", "EMAIL", "IBAN", "ALIAS"],
                currency_decimals=2,
                default_proxy_example="+447911123456",
            ),
            "EU": SpokeNetworkConfig(
                country_code="EU",
                country_name="Eurozone",
                currency="EUR",
                flag_emoji="🇪🇺",
                ips_scheme_name="TIPS / SEPA Instant",
                supported_proxy_types=["IBAN", "EMAIL", "MOBILE", "ALIAS"],
                currency_decimals=2,
                default_proxy_example="DE89370400440532013000",
            ),
            "JP": SpokeNetworkConfig(
                country_code="JP",
                country_name="Japan",
                currency="JPY",
                flag_emoji="🇯🇵",
                ips_scheme_name="Zengin System",
                supported_proxy_types=["MOBILE", "EMAIL", "ALIAS"],
                currency_decimals=0,
                default_proxy_example="+819012345678",
            ),
            "TH": SpokeNetworkConfig(
                country_code="TH",
                country_name="Thailand",
                currency="THB",
                flag_emoji="🇹🇭",
                ips_scheme_name="PromptPay",
                supported_proxy_types=["MOBILE", "NATIONAL_ID", "VPA"],
                currency_decimals=2,
                default_proxy_example="+66812345678",
            ),
            "MY": SpokeNetworkConfig(
                country_code="MY",
                country_name="Malaysia",
                currency="MYR",
                flag_emoji="🇲🇾",
                ips_scheme_name="DuitNow",
                supported_proxy_types=["MOBILE", "NATIONAL_ID", "ALIAS"],
                currency_decimals=2,
                default_proxy_example="+60123456789",
            ),
            "AU": SpokeNetworkConfig(
                country_code="AU",
                country_name="Australia",
                currency="AUD",
                flag_emoji="🇦🇺",
                ips_scheme_name="New Payments Platform (NPP/PayID)",
                supported_proxy_types=["MOBILE", "EMAIL", "ALIAS"],
                currency_decimals=2,
                default_proxy_example="+61412345678",
            ),
            "CA": SpokeNetworkConfig(
                country_code="CA",
                country_name="Canada",
                currency="CAD",
                flag_emoji="🇨🇦",
                ips_scheme_name="Interac / RTR",
                supported_proxy_types=["EMAIL", "MOBILE"],
                currency_decimals=2,
                default_proxy_example="user@domain.ca",
            ),
            "BR": SpokeNetworkConfig(
                country_code="BR",
                country_name="Brazil",
                currency="BRL",
                flag_emoji="🇧🇷",
                ips_scheme_name="Pix",
                supported_proxy_types=["MOBILE", "EMAIL", "NATIONAL_ID", "ALIAS"],
                currency_decimals=2,
                default_proxy_example="+5511987654321",
            ),
        }

    def list_spokes(self) -> List[SpokeNetworkConfig]:
        return [s for s in self._spokes.values() if s.active]

    def get_spoke(self, country_code: str) -> Optional[SpokeNetworkConfig]:
        return self._spokes.get(country_code.upper())

    def get_currency_decimals(self, currency: str) -> int:
        cur_upper = currency.upper()
        # Non-fractional currencies
        if cur_upper in ["JPY", "KRW", "VND", "CLP"]:
            return 0
        # 3-decimal currencies
        if cur_upper in ["BHD", "KWD", "OMR", "JOD"]:
            return 3
        return 2

    def register_or_update_spoke(self, req: SpokeRegisterRequest) -> SpokeNetworkConfig:
        code = req.country_code.upper()
        cfg = SpokeNetworkConfig(
            country_code=code,
            country_name=req.country_name,
            currency=req.currency.upper(),
            flag_emoji=req.flag_emoji,
            ips_scheme_name=req.ips_scheme_name,
            supported_proxy_types=req.supported_proxy_types or ["MOBILE", "EMAIL", "VPA", "NATIONAL_ID", "ALIAS", "IBAN"],
            currency_decimals=req.currency_decimals if req.currency_decimals is not None else 2,
            active=True,
            default_proxy_example=req.default_proxy_example,
        )
        self._spokes[code] = cfg
        return cfg


spoke_service = SpokeService()
