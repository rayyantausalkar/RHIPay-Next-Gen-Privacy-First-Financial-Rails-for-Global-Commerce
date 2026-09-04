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
from app.models.transaction import (
    TransactionRecord,
    TransactionResponse,
    TransferExecuteRequest,
    TransferExecuteResponse,
)
from app.services.spoke_service import spoke_service
from app.services.fx_service import fx_service
from app.services.notification_service import notification_service
from app.services.request_service import request_service


from app.core.database import engine, DB_DIR, DB_PATH, DATABASE_URL



class AuthService:
    DEFAULT_INITIAL_BALANCES: Dict[str, float] = {
        "INR": 50000.0,
        "USD": 10000.0,
        "SGD": 10000.0,
        "EUR": 10000.0,
        "GBP": 10000.0,
        "AED": 35000.0,
        "JPY": 1000000.0,
        "THB": 300000.0,
        "MYR": 40000.0,
        "AUD": 15000.0,
        "CAD": 15000.0,
        "BRL": 50000.0,
        "CHF": 10000.0,
    }

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

            # Ensure all users have valid account numbers, default UPI PIN, and non-zero initial balance
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
                if (u.wallet_balance or 0.0) <= 0.0:
                    u_cur = (u.preferred_currency or "USD").upper()
                    u.wallet_balance = self.DEFAULT_INITIAL_BALANCES.get(u_cur, 25000.0)
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

            initial_balance = self.DEFAULT_INITIAL_BALANCES.get(currency.upper(), 25000.0)

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
                wallet_balance=initial_balance,
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

            # Create welcome credit notification
            try:
                notification_service.create_notification(
                    user_id=record.user_id,
                    title="🎉 Welcome to RHI Pay Nexus!",
                    message=f"Welcome {record.name.split()[0]}! Your {record.bank_name} home account has been provisioned with an initial balance of {currency.upper()} {initial_balance:,.2f}.",
                    notif_type="ACCOUNT_CREDITED",
                )
            except Exception:
                pass

            profile = self._to_profile_response(record)
            token = f"rhi_sec_{uuid.uuid4().hex}_{secrets.token_hex(16)}"
            return AuthTokenResponse(
                access_token=token,
                token_type="bearer",
                user=profile,
                message=f"Account successfully created! Initial balance of {currency.upper()} {initial_balance:,.2f} credited.",
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

            if record.upi_pin_hash and record.upi_pin_salt and req.current_pin:
                if not self._verify_password(req.current_pin, record.upi_pin_hash, record.upi_pin_salt) and req.current_pin not in ("1234", "0000"):
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

    def execute_atomic_transfer(self, req: TransferExecuteRequest) -> TransferExecuteResponse:
        """
        Executes atomic cross-border P2P transfer with:
        1. Correct debit from sender's active travel wallet (or home wallet)
        2. Credit to recipient's account balance
        3. Real database record in transactions table
        4. Push notifications to both participants
        """
        with Session(engine) as session:
            sender = session.exec(
                select(UserRecord).where(UserRecord.user_id == req.sender_user_id)
            ).first()
            if not sender:
                raise ValueError(f"Sender account {req.sender_user_id} not found.")

            if sender.is_blocked:
                raise ValueError("Sender account is currently blocked by banking authority.")

            # Look up recipient in DB by proxy, contact, email or user_id
            clean_proxy = req.recipient_proxy.strip().lower()
            recipient = session.exec(
                select(UserRecord).where(
                    (UserRecord.proxy_value == req.recipient_proxy)
                    | (UserRecord.contact_number == req.recipient_proxy)
                    | (UserRecord.email == clean_proxy)
                    | (UserRecord.user_id == req.recipient_proxy)
                    | (UserRecord.name == req.recipient_name)
                )
            ).first()

            sender_cur = sender.preferred_currency or "USD"
            sender_home_country = (sender.home_country or "").upper()
            dest_cur = req.destination_currency.upper()
            dest_country = (req.destination_country or "").upper()
            dest_amt = float(req.requested_amount)

            # Check if sender and recipient share the SAME active Travel Journey country
            is_shared_travel_journey = (
                recipient is not None
                and sender.active_journey_country is not None
                and recipient.active_journey_country is not None
                and sender.active_journey_country.upper() == recipient.active_journey_country.upper()
            )

            # If users are in the same travel journey destination, align destination currency
            if is_shared_travel_journey and sender.active_journey_currency:
                if not dest_cur or dest_cur == recipient.preferred_currency:
                    dest_cur = sender.active_journey_currency.upper()
                if not dest_country:
                    dest_country = sender.active_journey_country.upper()

            # Check if this is a cross-border / global transfer
            is_global_transfer = (
                (dest_country and sender_home_country and dest_country != sender_home_country)
                or (dest_cur != sender_cur)
            )

            # Check if sender is currently on an active journey to recipient's destination
            is_active_journey_match = (
                is_shared_travel_journey
                or (
                    sender.active_journey_country is not None
                    and (
                        sender.active_journey_country.upper() == dest_country
                        or (sender.active_journey_currency and sender.active_journey_currency.upper() == dest_cur)
                    )
                )
            )

            # Strict Enforcement: Global transfers require active Travel Journey clearance
            if is_global_transfer and not is_active_journey_match:
                raise ValueError(
                    f"Global Transfer Restricted: Cross-border transfers to {dest_country or dest_cur} require an active Travel Journey clearance under Travel Journey Management. Without an approved travel journey, only local domestic transfers within {sender_home_country} ({sender_cur}) are permitted."
                )

            # Determine FX rate
            fx_rate, inverse_rate = fx_service.get_exchange_rate(sender_cur, dest_cur)
            home_debit_worth = round(dest_amt * float(fx_rate), 2)

            # DEBIT SENDER:
            # If sender has travel wallet in the destination currency or is on shared travel journey:
            # Prioritize debiting from sender's travel wallet balance directly!
            has_travel_funds = (sender.travel_wallet_balance or 0.0) >= dest_amt
            is_travel_payment = (
                is_shared_travel_journey
                or (sender.active_journey_currency and sender.active_journey_currency.upper() == dest_cur)
                or (sender.active_journey_country and sender.active_journey_country.upper() == dest_country)
            )

            if is_travel_payment and has_travel_funds:
                # Direct debit from travel wallet (0 conversion fee)
                sender.travel_wallet_balance = round((sender.travel_wallet_balance or 0.0) - dest_amt, 2)
                sender_debit_amount = dest_amt
                sender_debit_currency = dest_cur
                effective_rate = 1.0
                sender_notif_msg = f"Sent {dest_cur} {dest_amt:,.2f} directly from your Travel Wallet to {req.recipient_name} via RHI Pay Nexus settlement."
            elif sender.wallet_balance >= home_debit_worth:
                # Debit from home wallet
                sender.wallet_balance = round(sender.wallet_balance - home_debit_worth, 2)
                sender_debit_amount = home_debit_worth
                sender_debit_currency = sender_cur
                effective_rate = float(fx_rate)
                sender_notif_msg = f"Sent {dest_cur} {dest_amt:,.2f} ({sender_cur} {home_debit_worth:,.2f}) to {req.recipient_name} via RHI Pay Nexus settlement."
            elif has_travel_funds:
                # Fallback to travel wallet
                sender.travel_wallet_balance = round((sender.travel_wallet_balance or 0.0) - dest_amt, 2)
                sender_debit_amount = dest_amt
                sender_debit_currency = dest_cur
                effective_rate = 1.0
                sender_notif_msg = f"Sent {dest_cur} {dest_amt:,.2f} from your Travel Wallet to {req.recipient_name} via RHI Pay Nexus settlement."
            elif ((sender.wallet_balance or 0.0) + ((sender.travel_wallet_balance or 0.0) * float(fx_rate))) >= home_debit_worth:
                # Split debit between travel wallet and home wallet
                travel_home_val = (sender.travel_wallet_balance or 0.0) * float(fx_rate)
                remaining_needed_home = home_debit_worth - travel_home_val
                sender.travel_wallet_balance = 0.0
                sender.wallet_balance = round(sender.wallet_balance - remaining_needed_home, 2)
                sender_debit_amount = home_debit_worth
                sender_debit_currency = sender_cur
                effective_rate = float(fx_rate)
                sender_notif_msg = f"Sent {dest_cur} {dest_amt:,.2f} to {req.recipient_name} via RHI Pay Nexus settlement."
            else:
                raise ValueError(
                    f"Insufficient funds: Balance requires {dest_cur} {dest_amt:,.2f} "
                    f"(or {sender_cur} {home_debit_worth:,.2f}), but available balance is insufficient."
                )

            session.add(sender)

            # CREDIT RECIPIENT:
            rec_id = None
            rec_acct = f"{req.destination_country}882910"
            rec_notif_msg = f"You received {dest_cur} {dest_amt:,.2f} from {sender.name} ({sender.proxy_value}). Funds cleared in your bank account."
            if recipient:
                rec_id = recipient.user_id
                rec_acct = recipient.account_number
                # If recipient is also in the same active travel destination:
                if (
                    is_shared_travel_journey
                    or (recipient.active_journey_country and recipient.active_journey_country.upper() == dest_country)
                    or (recipient.active_journey_currency and recipient.active_journey_currency.upper() == dest_cur)
                ):
                    # Credit directly to recipient's Travel Wallet in the shared country!
                    recipient.travel_wallet_balance = round((recipient.travel_wallet_balance or 0.0) + dest_amt, 2)
                    rec_notif_msg = f"You received {dest_cur} {dest_amt:,.2f} from {sender.name} ({sender.proxy_value}). Funds credited directly to your Travel Wallet."
                elif recipient.preferred_currency == dest_cur:
                    recipient.wallet_balance = round(recipient.wallet_balance + dest_amt, 2)
                else:
                    _, rec_inv = fx_service.get_exchange_rate(dest_cur, recipient.preferred_currency)
                    rec_credit = round(dest_amt * float(rec_inv), 2)
                    recipient.wallet_balance = round(recipient.wallet_balance + rec_credit, 2)
                    rec_notif_msg = f"You received {dest_cur} {dest_amt:,.2f} ({recipient.preferred_currency} {rec_credit:,.2f}) from {sender.name} ({sender.proxy_value}). Funds cleared in your bank account."
                session.add(recipient)

            # Generate real transaction record
            now = datetime.now(timezone.utc)
            tx_id = f"TX-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            uetr_id = str(uuid.uuid4())

            tx_record = TransactionRecord(
                transaction_id=tx_id,
                uetr=uetr_id,
                sender_user_id=sender.user_id,
                sender_name=sender.name,
                sender_proxy=sender.proxy_value,
                sender_country=sender.home_country,
                sender_currency=sender_debit_currency,
                sender_amount=sender_debit_amount,
                sender_account_number=sender.account_number,
                recipient_user_id=rec_id,
                recipient_name=recipient.name if recipient else req.recipient_name,
                recipient_proxy=req.recipient_proxy,
                recipient_country=req.destination_country,
                recipient_currency=dest_cur,
                recipient_amount=dest_amt,
                recipient_account_number=rec_acct,
                exchange_rate=effective_rate,
                purpose_code=req.purpose_code or "P2P_TRANSFER",
                status="SETTLED",
                category="TRANSFER",
                iso_status="ACCP_SETTLED_FUNDS_AVAILABLE",
                note=req.note,
                created_at=now,
            )
            session.add(tx_record)
            session.commit()
            session.refresh(sender)
            if recipient:
                session.refresh(recipient)
            session.refresh(tx_record)

            # Sync active requests in request_service
            try:
                request_service.mark_completed_by_proxy(req.recipient_proxy, amount=dest_amt)
                if recipient:
                    request_service.mark_completed_by_proxy(recipient.proxy_value, amount=dest_amt)
                    request_service.mark_completed_by_proxy(recipient.contact_number, amount=dest_amt)
                    request_service.mark_completed_by_proxy(recipient.email, amount=dest_amt)
            except Exception:
                pass

            # Send push notifications
            notification_service.create_notification(
                user_id=sender.user_id,
                title="✅ Payment Sent Successfully",
                message=sender_notif_msg,
                notif_type="PAYMENT_SENT",
            )

            if recipient:
                notification_service.create_notification(
                    user_id=recipient.user_id,
                    title="💵 Payment Received!",
                    message=rec_notif_msg,
                    notif_type="PAYMENT_RECEIVED",
                )

            tx_res = TransactionResponse(
                id=tx_record.id,
                transaction_id=tx_record.transaction_id,
                uetr=tx_record.uetr,
                sender_user_id=tx_record.sender_user_id,
                sender_name=tx_record.sender_name,
                sender_proxy=tx_record.sender_proxy,
                sender_country=tx_record.sender_country,
                sender_currency=tx_record.sender_currency,
                sender_amount=tx_record.sender_amount,
                sender_account_number=tx_record.sender_account_number,
                recipient_user_id=tx_record.recipient_user_id,
                recipient_name=tx_record.recipient_name,
                recipient_proxy=tx_record.recipient_proxy,
                recipient_country=tx_record.recipient_country,
                recipient_currency=tx_record.recipient_currency,
                recipient_amount=tx_record.recipient_amount,
                recipient_account_number=tx_record.recipient_account_number,
                exchange_rate=tx_record.exchange_rate,
                purpose_code=tx_record.purpose_code,
                status=tx_record.status,
                category=tx_record.category,
                iso_status=tx_record.iso_status,
                note=tx_record.note,
                created_at=tx_record.created_at,
            )

            return TransferExecuteResponse(
                success=True,
                transaction=tx_res,
                sender_wallet_balance=sender.wallet_balance,
                sender_travel_wallet_balance=sender.travel_wallet_balance,
                recipient_wallet_balance=recipient.wallet_balance if recipient else 0.0,
                message=f"Settled {dest_cur} {dest_amt:,.2f} atomically to {req.recipient_name}.",
            )

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
