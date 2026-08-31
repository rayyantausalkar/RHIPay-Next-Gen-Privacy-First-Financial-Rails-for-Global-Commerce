import os
import random
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
    UpiPinChangeRequest,
    UpiPinVerifyRequest,
    BalanceCheckRequest,
    BalanceCheckResponse,
    AdminUserManagementItem,
)
from app.models.journey import JourneyRequestRecord
from app.models.notification import NotificationRecord
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
    def _generate_account_number(bank_name: str, country_code: str) -> str:
        """Generate realistic unique bank account number matching bank format."""
        prefix = "".join([c for c in bank_name.upper() if c.isalnum()])[:4]
        if len(prefix) < 3:
            prefix = f"{country_code}BK"
        random_digits = "".join([str(random.randint(0, 9)) for _ in range(10)])
        return f"{prefix}{random_digits}"

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

    @classmethod
    def _to_profile_response(cls, record: UserRecord) -> UserProfileResponse:
        return UserProfileResponse(
            id=record.user_id,
            email=record.email,
            name=record.name,
            contact_number=record.contact_number,
            home_country=record.home_country,
            bank_name=record.bank_name,
            bic=record.bic,
            account_number=record.account_number or f"{record.home_country}0019283746",
            ifsc_or_bic=record.ifsc_or_bic or record.bic,
            account_type=record.account_type,
            preferred_currency=record.preferred_currency,
            proxy_type=record.proxy_type,
            proxy_value=record.proxy_value,
            kyc_status=record.kyc_status,
            wallet_balance=record.wallet_balance,
            travel_wallet_balance=record.travel_wallet_balance,
            active_journey_country=record.active_journey_country,
            active_journey_currency=record.active_journey_currency,
            role=record.role or "USER",
            is_blocked=record.is_blocked,
            has_upi_pin=bool(record.upi_pin_hash),
            created_at=record.created_at,
        )

    def _seed_default_users(self):
        """Seed initial benchmark fintech users and admin if database is empty."""
        with Session(engine) as session:
            # Check if admin exists
            admin = session.exec(select(UserRecord).where(UserRecord.email == "admin.rhipay@gmail.com")).first()
            if not admin:
                pwd_hash, salt = self._hash_password("admin@123.")
                pin_hash, pin_salt = self._hash_password("1234")
                admin_rec = UserRecord(
                    user_id="RHI-ADMIN-001",
                    email="admin.rhipay@gmail.com",
                    hashed_password=pwd_hash,
                    salt=salt,
                    name="RHI Pay Correspondent Bank Authority",
                    contact_number="+18005557447",
                    home_country="US",
                    bank_name="Central Correspondent Clearing Bank",
                    bic="RHICUS33",
                    account_number="RHICENTRAL990011",
                    ifsc_or_bic="RHICUS33",
                    upi_pin_hash=pin_hash,
                    upi_pin_salt=pin_salt,
                    wallet_balance=10000000.0,
                    travel_wallet_balance=10000000.0,
                    account_type="MERCHANT",
                    preferred_currency="USD",
                    proxy_type="EMAIL",
                    proxy_value="admin.rhipay@gmail.com",
                    kyc_status="VERIFIED",
                    role="ADMIN",
                    created_at=datetime.now(timezone.utc),
                    is_active=True,
                    is_blocked=False,
                )
                session.add(admin_rec)

            existing = session.exec(select(UserRecord).where(UserRecord.email == "rahul@okhdfcbank.com")).first()
            if not existing:
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
                        "wallet_balance": 50000.0,
                        "travel_wallet_balance": 0.0,
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
                        "wallet_balance": 5000.0,
                        "travel_wallet_balance": 0.0,
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
                        "wallet_balance": 10000.0,
                        "travel_wallet_balance": 0.0,
                    },
                ]

                for u in demo_users:
                    pwd_hash, salt = self._hash_password("Password123!")
                    pin_hash, pin_salt = self._hash_password("1234")
                    acct_num = self._generate_account_number(u["bank_name"], u["home_country"])
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
                        account_number=acct_num,
                        ifsc_or_bic=u["bic"],
                        upi_pin_hash=pin_hash,
                        upi_pin_salt=pin_salt,
                        wallet_balance=u.get("wallet_balance", 0.0),
                        travel_wallet_balance=u.get("travel_wallet_balance", 0.0),
                        account_type=u["account_type"],
                        preferred_currency=u["preferred_currency"],
                        proxy_type=u["proxy_type"],
                        proxy_value=u["proxy_value"],
                        kyc_status="VERIFIED",
                        role="USER",
                        created_at=datetime.now(timezone.utc),
                        is_active=True,
                        is_blocked=False,
                    )
                    session.add(rec)

            # Ensure all users have valid account numbers and default UPI PIN
            all_users = session.exec(select(UserRecord)).all()
            for u in all_users:
                modified = False
                if not u.upi_pin_hash:
                    pin_h, pin_s = self._hash_password("1234")
                    u.upi_pin_hash = pin_h
                    u.upi_pin_salt = pin_s
                    modified = True
                if not u.account_number:
                    u.account_number = self._generate_account_number(u.bank_name, u.home_country)
                    modified = True
                if modified:
                    session.add(u)

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
        """Register new user account in SQLite database with unique allocated bank details."""
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

        # Generate unique bank account number
        account_number = self._generate_account_number(req.bank_name, country_code)

        # Determine default proxy
        p_type = (req.proxy_type or "MOBILE").upper()
        p_value = req.proxy_value or (
            req.contact_number if p_type == "MOBILE" else clean_email
        )

        # Setup initial UPI pin (default 1234 if not provided)
        initial_pin = req.upi_pin or "1234"
        pin_hash, pin_salt = self._hash_password(initial_pin)

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
                account_number=account_number,
                ifsc_or_bic=bic,
                upi_pin_hash=pin_hash,
                upi_pin_salt=pin_salt,
                wallet_balance=0.0,
                travel_wallet_balance=0.0,
                account_type=req.account_type.upper() if req.account_type else "INDIVIDUAL",
                preferred_currency=currency.upper(),
                proxy_type=p_type,
                proxy_value=p_value,
                kyc_status="VERIFIED",
                role="USER",
                created_at=datetime.now(timezone.utc),
                is_active=True,
                is_blocked=False,
            )
            session.add(record)
            session.commit()
            session.refresh(record)

            profile = self._to_profile_response(record)
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

            if record.is_blocked:
                raise ValueError("Your account has been temporarily blocked by RHI Pay authorities. Please contact support.")

            if not record.is_active:
                raise ValueError("This account has been deactivated. Please contact support.")

            profile = self._to_profile_response(record)
            token = f"rhi_sec_{uuid.uuid4().hex}_{secrets.token_hex(16)}"
            return AuthTokenResponse(
                access_token=token,
                token_type="bearer",
                user=profile,
                message=f"Welcome back, {record.name.split()[0]}!",
            )

    def change_upi_pin(self, req: UpiPinChangeRequest) -> Dict[str, Any]:
        """Update UPI PIN for user account."""
        if len(req.new_pin) not in (4, 6) or not req.new_pin.isdigit():
            raise ValueError("UPI PIN must be either 4 or 6 digits.")

        with Session(engine) as session:
            record = session.exec(select(UserRecord).where(UserRecord.user_id == req.user_id)).first()
            if not record:
                raise ValueError("User not found.")

            if record.upi_pin_hash and req.current_pin:
                if not self._verify_password(req.current_pin, record.upi_pin_hash, record.upi_pin_salt):
                    raise ValueError("Current UPI PIN is incorrect.")

            pin_hash, pin_salt = self._hash_password(req.new_pin)
            record.upi_pin_hash = pin_hash
            record.upi_pin_salt = pin_salt
            session.add(record)
            session.commit()

            return {"success": True, "message": "UPI PIN updated successfully."}

    def verify_upi_pin(self, req: UpiPinVerifyRequest) -> bool:
        """Verify user entered UPI PIN."""
        with Session(engine) as session:
            record = session.exec(select(UserRecord).where(UserRecord.user_id == req.user_id)).first()
            if not record or not record.upi_pin_hash:
                return False
            return self._verify_password(req.pin, record.upi_pin_hash, record.upi_pin_salt)

    def check_balance(self, req: BalanceCheckRequest) -> BalanceCheckResponse:
        """Verify PIN and return account balance."""
        with Session(engine) as session:
            record = session.exec(select(UserRecord).where(UserRecord.user_id == req.user_id)).first()
            if not record:
                raise ValueError("User not found.")

            if record.upi_pin_hash:
                if not self._verify_password(req.pin, record.upi_pin_hash, record.upi_pin_salt):
                    raise ValueError("Incorrect UPI PIN. Please try again.")

            home_cur = record.preferred_currency or "USD"
            dest_cur = record.active_journey_currency or "USD"

            return BalanceCheckResponse(
                user_id=record.user_id,
                home_currency=home_cur,
                wallet_balance=record.wallet_balance,
                wallet_balance_formatted=f"{home_cur} {record.wallet_balance:,.2f}",
                active_journey_country=record.active_journey_country,
                active_journey_currency=record.active_journey_currency,
                travel_wallet_balance=record.travel_wallet_balance,
                travel_wallet_balance_formatted=f"{dest_cur} {record.travel_wallet_balance:,.2f}" if record.active_journey_country else None,
                verified=True,
            )

    def get_all_users(self) -> List[AdminUserManagementItem]:
        """Fetch all users for Admin management."""
        with Session(engine) as session:
            records = session.exec(select(UserRecord).order_by(UserRecord.created_at.desc())).all()
            return [
                AdminUserManagementItem(
                    user_id=r.user_id,
                    name=r.name,
                    email=r.email,
                    contact_number=r.contact_number,
                    home_country=r.home_country,
                    bank_name=r.bank_name,
                    account_number=r.account_number or "N/A",
                    wallet_balance=r.wallet_balance,
                    travel_wallet_balance=r.travel_wallet_balance,
                    active_journey_country=r.active_journey_country,
                    kyc_status=r.kyc_status,
                    role=r.role or "USER",
                    is_blocked=r.is_blocked,
                    created_at=r.created_at,
                )
                for r in records
            ]

    def toggle_block_user(self, user_id: str) -> Dict[str, Any]:
        """Block or unblock a user account."""
        with Session(engine) as session:
            record = session.exec(select(UserRecord).where(UserRecord.user_id == user_id)).first()
            if not record:
                raise ValueError("User not found.")
            record.is_blocked = not record.is_blocked
            session.add(record)
            session.commit()
            session.refresh(record)
            status_text = "blocked" if record.is_blocked else "unblocked"
            return {
                "success": True,
                "user_id": user_id,
                "is_blocked": record.is_blocked,
                "message": f"User account has been {status_text}.",
            }

    def process_payment_transfer(
        self,
        sender_proxy: str,
        recipient_proxy: str,
        sender_debit_amt: float,
        recipient_credit_amt: float,
    ) -> Dict[str, Any]:
        """Deduct sender balance and credit recipient balance upon settled payment."""
        with Session(engine) as session:
            sender = session.exec(
                select(UserRecord).where(
                    (UserRecord.proxy_value == sender_proxy)
                    | (UserRecord.contact_number == sender_proxy)
                    | (UserRecord.email == sender_proxy)
                    | (UserRecord.user_id == sender_proxy)
                )
            ).first()

            recipient = session.exec(
                select(UserRecord).where(
                    (UserRecord.proxy_value == recipient_proxy)
                    | (UserRecord.contact_number == recipient_proxy)
                    | (UserRecord.email == recipient_proxy)
                    | (UserRecord.user_id == recipient_proxy)
                )
            ).first()

            if sender:
                sender.wallet_balance = max(0.0, sender.wallet_balance - sender_debit_amt)
                if sender.travel_wallet_balance > 0:
                    sender.travel_wallet_balance = max(0.0, sender.travel_wallet_balance - recipient_credit_amt)
                session.add(sender)

            if recipient:
                recipient.wallet_balance += recipient_credit_amt
                session.add(recipient)

            session.commit()

            return {
                "sender_balance_after": sender.wallet_balance if sender else 0.0,
                "recipient_balance_after": recipient.wallet_balance if recipient else 0.0,
            }

    def get_user_by_email(self, email: str) -> Optional[UserProfileResponse]:
        """Fetch user profile by email."""
        clean_email = email.strip().lower()
        with Session(engine) as session:
            statement = select(UserRecord).where(UserRecord.email == clean_email)
            record = session.exec(statement).first()
            if not record:
                return None
            return self._to_profile_response(record)

    def get_user_by_id(self, user_id: str) -> Optional[UserProfileResponse]:
        """Fetch user profile by user_id."""
        with Session(engine) as session:
            statement = select(UserRecord).where(UserRecord.user_id == user_id)
            record = session.exec(statement).first()
            if not record:
                return None
            return self._to_profile_response(record)


auth_service = AuthService()
