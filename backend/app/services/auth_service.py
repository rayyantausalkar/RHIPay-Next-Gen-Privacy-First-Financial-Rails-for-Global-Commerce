import os
import secrets
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from sqlmodel import SQLModel, Session, create_engine, select

from app.models.auth import (
    UserRecord,
    UserSignupRequest,
    UserLoginRequest,
    UserProfileResponse,
    AuthTokenResponse,
    BankInfo,
    BankDirectoryResponse,
)
from app.services.spoke_service import spoke_service


# Database setup: SQLite database stored locally in backend/data/users.db
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "users.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)


class AuthService:
    # Comprehensive Directory of Member Banks across Hub Network Spokes
    BANK_DIRECTORY: Dict[str, List[Dict[str, Any]]] = {
        "SG": [
            {"name": "DBS Bank Singapore", "bic": "DBSGSGSG", "popular": True},
            {"name": "Oversea-Chinese Banking Corp (OCBC)", "bic": "OCBCSGSG", "popular": True},
            {"name": "United Overseas Bank (UOB)", "bic": "UOVBSGSG", "popular": True},
            {"name": "Standard Chartered Singapore", "bic": "SCBLSGSG", "popular": False},
            {"name": "Citibank Singapore", "bic": "CITISGSG", "popular": False},
            {"name": "HSBC Singapore", "bic": "HSBCSGSG", "popular": False},
        ],
        "IN": [
            {"name": "HDFC Bank Ltd", "bic": "HDFCINBB", "popular": True},
            {"name": "State Bank of India (SBI)", "bic": "SBININBB", "popular": True},
            {"name": "ICICI Bank Ltd", "bic": "ICICINBB", "popular": True},
            {"name": "Axis Bank Ltd", "bic": "UTIBINBB", "popular": True},
            {"name": "Kotak Mahindra Bank", "bic": "KKBKINBB", "popular": False},
            {"name": "Punjab National Bank", "bic": "PUNBINBB", "popular": False},
        ],
        "AE": [
            {"name": "First Abu Dhabi Bank (FAB)", "bic": "FABAAEAD", "popular": True},
            {"name": "Emirates NBD", "bic": "EBILAEAD", "popular": True},
            {"name": "Abu Dhabi Commercial Bank (ADCB)", "bic": "ADCBAEAA", "popular": True},
            {"name": "Dubai Islamic Bank", "bic": "DUBIAEAD", "popular": False},
            {"name": "Mashreq Bank", "bic": "MSHQAEAD", "popular": False},
        ],
        "US": [
            {"name": "JPMorgan Chase Bank", "bic": "CHASUS33", "popular": True},
            {"name": "Bank of America", "bic": "BOFAUS3N", "popular": True},
            {"name": "Citibank N.A.", "bic": "CITIUS33", "popular": True},
            {"name": "Wells Fargo Bank", "bic": "WFBIUS6S", "popular": True},
            {"name": "Goldman Sachs Bank USA", "bic": "GSCOUS33", "popular": False},
            {"name": "Morgan Stanley Bank", "bic": "MSNYUS33", "popular": False},
        ],
        "GB": [
            {"name": "Barclays Bank UK", "bic": "BARCGB22", "popular": True},
            {"name": "HSBC Bank UK", "bic": "MIDLGB22", "popular": True},
            {"name": "Lloyds Banking Group", "bic": "LOYDGB2L", "popular": True},
            {"name": "NatWest Bank", "bic": "NWBKGB2L", "popular": True},
            {"name": "Standard Chartered Bank", "bic": "SCBLGB2L", "popular": False},
        ],
        "EU": [
            {"name": "Deutsche Bank AG", "bic": "DEUTDEDD", "popular": True},
            {"name": "BNP Paribas", "bic": "BNPAFRPP", "popular": True},
            {"name": "Banco Santander", "bic": "BSCHESMM", "popular": True},
            {"name": "ING Bank N.V.", "bic": "INGBNL2A", "popular": True},
            {"name": "Société Générale", "bic": "SOGEFRPP", "popular": False},
        ],
        "JP": [
            {"name": "MUFG Bank Tokyo", "bic": "BOTKJPJT", "popular": True},
            {"name": "Sumitomo Mitsui Banking Corp (SMBC)", "bic": "SMBCJPJT", "popular": True},
            {"name": "Mizuho Bank Ltd", "bic": "MHCBJPJT", "popular": True},
            {"name": "Japan Post Bank", "bic": "JPPSJPJ1", "popular": False},
        ],
        "TH": [
            {"name": "Bangkok Bank", "bic": "BKKBBKBK", "popular": True},
            {"name": "Kasikornbank (KBank)", "bic": "KASITHBK", "popular": True},
            {"name": "Siam Commercial Bank (SCB)", "bic": "SICOTHBK", "popular": True},
            {"name": "Krungthai Bank", "bic": "KRTHBKBK", "popular": False},
        ],
        "MY": [
            {"name": "Maybank (Malayan Banking Bhd)", "bic": "MBBEMYKL", "popular": True},
            {"name": "CIMB Bank Bhd", "bic": "CIBBMYKL", "popular": True},
            {"name": "Public Bank Bhd", "bic": "PBBEMYKL", "popular": True},
            {"name": "RHB Bank Bhd", "bic": "RHBBMYKL", "popular": False},
        ],
        "AU": [
            {"name": "Commonwealth Bank of Australia", "bic": "CTBAAU2S", "popular": True},
            {"name": "National Australia Bank (NAB)", "bic": "NATAAU33", "popular": True},
            {"name": "Westpac Banking Corp", "bic": "WPACAU2S", "popular": True},
            {"name": "ANZ Banking Group", "bic": "ANZBAU3M", "popular": True},
        ],
        "CA": [
            {"name": "Royal Bank of Canada (RBC)", "bic": "ROYCCAT2", "popular": True},
            {"name": "Toronto-Dominion Bank (TD)", "bic": "TDOMCATT", "popular": True},
            {"name": "Bank of Nova Scotia (Scotiabank)", "bic": "NOSCCATT", "popular": True},
            {"name": "Bank of Montreal (BMO)", "bic": "BOFMCAM2", "popular": False},
        ],
        "BR": [
            {"name": "Itaú Unibanco", "bic": "ITAUUBRJ", "popular": True},
            {"name": "Banco do Brasil", "bic": "BRASBRRJ", "popular": True},
            {"name": "Banco Bradesco", "bic": "BBDEBRRJ", "popular": True},
            {"name": "Nubank", "bic": "NUBNBRRJ", "popular": True},
        ],
    }

    def __init__(self):
        # Create SQLModel tables if not exists
        SQLModel.metadata.create_all(engine)
        self._seed_default_users()

    @staticmethod
    def _hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
        """Hash password using PBKDF2-HMAC-SHA256 with cryptographic salt."""
        if not salt:
            salt = secrets.token_hex(16)
        hashed = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        ).hex()
        return hashed, salt

    @staticmethod
    def _verify_password(password: str, hashed: str, salt: str) -> bool:
        """Verify password against saved hash and salt."""
        check_hash, _ = AuthService._hash_password(password, salt)
        return secrets.compare_digest(check_hash, hashed)

    def _seed_default_users(self):
        """Seed initial benchmark fintech users if database is empty."""
        with Session(engine) as session:
            existing = session.exec(select(UserRecord)).first()
            if existing:
                return

            demo_users = [
                {
                    "email": "rahul@okhdfcbank.com",
                    "name": "Rahul Sharma",
                    "contact_number": "+919876543210",
                    "home_country": "IN",
                    "bank_name": "HDFC Bank Ltd",
                    "bic": "HDFCINBB",
                    "account_type": "INDIVIDUAL",
                    "preferred_currency": "INR",
                    "proxy_type": "VPA",
                    "proxy_value": "rahul@okhdfcbank",
                },
                {
                    "email": "meiling@dbs.sg",
                    "name": "Mei Ling",
                    "contact_number": "+6591234567",
                    "home_country": "SG",
                    "bank_name": "DBS Bank Singapore",
                    "bic": "DBSGSGSG",
                    "account_type": "INDIVIDUAL",
                    "preferred_currency": "SGD",
                    "proxy_type": "MOBILE",
                    "proxy_value": "+6591234567",
                },
                {
                    "email": "sarah.j@nexus.org",
                    "name": "Sarah Jenkins",
                    "contact_number": "+14155552671",
                    "home_country": "US",
                    "bank_name": "JPMorgan Chase Bank",
                    "bic": "CHASUS33",
                    "account_type": "INDIVIDUAL",
                    "preferred_currency": "USD",
                    "proxy_type": "EMAIL",
                    "proxy_value": "sarah.j@nexus.org",
                },
                {
                    "email": "demo@rhipay.io",
                    "name": "Alex Chen",
                    "contact_number": "+6581234567",
                    "home_country": "SG",
                    "bank_name": "Oversea-Chinese Banking Corp (OCBC)",
                    "bic": "OCBCSGSG",
                    "account_type": "MERCHANT",
                    "preferred_currency": "USD",
                    "proxy_type": "MOBILE",
                    "proxy_value": "+6581234567",
                },
            ]

            for u in demo_users:
                pwd_hash, salt = self._hash_password("Password123!")
                rec = UserRecord(
                    user_id=f"USR-{uuid.uuid4().hex[:10].upper()}",
                    email=u["email"].lower().strip(),
                    hashed_password=pwd_hash,
                    salt=salt,
                    name=u["name"],
                    contact_number=u["contact_number"],
                    home_country=u["home_country"].upper(),
                    bank_name=u["bank_name"],
                    bic=u["bic"],
                    account_type=u["account_type"],
                    preferred_currency=u["preferred_currency"],
                    proxy_type=u["proxy_type"],
                    proxy_value=u["proxy_value"],
                    kyc_status="VERIFIED",
                    created_at=datetime.now(timezone.utc),
                    is_active=True,
                )
                session.add(rec)
            session.commit()

    def get_bank_directory(self) -> BankDirectoryResponse:
        """Returns bank list grouped by country."""
        result: Dict[str, List[BankInfo]] = {}
        for country, banks in self.BANK_DIRECTORY.items():
            result[country] = [
                BankInfo(
                    name=b["name"],
                    bic=b["bic"],
                    country_code=country,
                    popular=b.get("popular", False),
                )
                for b in banks
            ]
        return BankDirectoryResponse(banks=result, total_countries=len(result))

    def signup(self, req: UserSignupRequest) -> AuthTokenResponse:
        """Register new user account in SQLite database."""
        if req.password != req.confirm_password:
            raise ValueError("Passwords do not match. Please re-enter your password.")

        if len(req.password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        clean_email = req.email.strip().lower()
        country_code = req.home_country.strip().upper()

        # Validate spoke country
        spoke = spoke_service.get_spoke(country_code)
        currency = req.preferred_currency or (spoke.currency if spoke else "USD")

        # Resolve BIC
        bic = None
        for b in self.BANK_DIRECTORY.get(country_code, []):
            if b["name"].lower() == req.bank_name.strip().lower():
                bic = b["bic"]
                break
        if not bic:
            bic = f"{country_code}BANKXX"

        # Determine default proxy
        p_type = (req.proxy_type or "MOBILE").upper()
        p_value = req.proxy_value or (
            req.contact_number if p_type == "MOBILE" else clean_email
        )

        with Session(engine) as session:
            # Check duplicate email
            statement = select(UserRecord).where(UserRecord.email == clean_email)
            existing = session.exec(statement).first()
            if existing:
                raise ValueError("An account with this email address already exists. Please log in.")

            pwd_hash, salt = self._hash_password(req.password)
            user_id = f"USR-{uuid.uuid4().hex[:10].upper()}"

            record = UserRecord(
                user_id=user_id,
                email=clean_email,
                hashed_password=pwd_hash,
                salt=salt,
                name=req.name.strip(),
                contact_number=req.contact_number.strip(),
                home_country=country_code,
                bank_name=req.bank_name.strip(),
                bic=bic,
                account_type=req.account_type.upper() if req.account_type else "INDIVIDUAL",
                preferred_currency=currency.upper(),
                proxy_type=p_type,
                proxy_value=p_value,
                kyc_status="VERIFIED",
                created_at=datetime.now(timezone.utc),
                is_active=True,
            )
            session.add(record)
            session.commit()
            session.refresh(record)

            profile = UserProfileResponse(
                id=record.user_id,
                email=record.email,
                name=record.name,
                contact_number=record.contact_number,
                home_country=record.home_country,
                bank_name=record.bank_name,
                bic=record.bic,
                account_type=record.account_type,
                preferred_currency=record.preferred_currency,
                proxy_type=record.proxy_type,
                proxy_value=record.proxy_value,
                kyc_status=record.kyc_status,
                created_at=record.created_at,
            )

            token = f"rhi_sec_{uuid.uuid4().hex}_{secrets.token_hex(16)}"
            return AuthTokenResponse(
                access_token=token,
                token_type="bearer",
                user=profile,
                message="Account successfully created! Welcome to RHI Pay Nexus.",
            )

    def login(self, req: UserLoginRequest) -> AuthTokenResponse:
        """Authenticate user against SQLite database."""
        clean_email = req.email.strip().lower()

        with Session(engine) as session:
            statement = select(UserRecord).where(UserRecord.email == clean_email)
            record = session.exec(statement).first()

            if not record or not self._verify_password(req.password, record.hashed_password, record.salt):
                raise ValueError("Invalid email address or password. Please try again.")

            if not record.is_active:
                raise ValueError("This account has been deactivated. Please contact support.")

            profile = UserProfileResponse(
                id=record.user_id,
                email=record.email,
                name=record.name,
                contact_number=record.contact_number,
                home_country=record.home_country,
                bank_name=record.bank_name,
                bic=record.bic,
                account_type=record.account_type,
                preferred_currency=record.preferred_currency,
                proxy_type=record.proxy_type,
                proxy_value=record.proxy_value,
                kyc_status=record.kyc_status,
                created_at=record.created_at,
            )

            token = f"rhi_sec_{uuid.uuid4().hex}_{secrets.token_hex(16)}"
            return AuthTokenResponse(
                access_token=token,
                token_type="bearer",
                user=profile,
                message=f"Welcome back, {record.name.split()[0]}!",
            )

    def get_user_by_email(self, email: str) -> Optional[UserProfileResponse]:
        """Fetch user profile by email."""
        clean_email = email.strip().lower()
        with Session(engine) as session:
            statement = select(UserRecord).where(UserRecord.email == clean_email)
            record = session.exec(statement).first()
            if not record:
                return None
            return UserProfileResponse(
                id=record.user_id,
                email=record.email,
                name=record.name,
                contact_number=record.contact_number,
                home_country=record.home_country,
                bank_name=record.bank_name,
                bic=record.bic,
                account_type=record.account_type,
                preferred_currency=record.preferred_currency,
                proxy_type=record.proxy_type,
                proxy_value=record.proxy_value,
                kyc_status=record.kyc_status,
                created_at=record.created_at,
            )


auth_service = AuthService()
