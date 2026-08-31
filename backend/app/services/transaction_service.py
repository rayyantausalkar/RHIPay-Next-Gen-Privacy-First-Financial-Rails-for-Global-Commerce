import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlmodel import Session, select, or_

from app.models.transaction import TransactionRecord, TransactionResponse
from app.models.auth import UserRecord
from app.core.database import engine



class TransactionService:
    def __init__(self):
        self._seed_initial_transactions()

    def _seed_initial_transactions(self):
        """Seed realistic initial transactions for demo users if empty."""
        with Session(engine) as session:
            count = session.exec(select(TransactionRecord)).first()
            if count:
                return

            # Find demo users
            rahul = session.exec(select(UserRecord).where(UserRecord.email == "rahul@okhdfcbank.com")).first()
            meiling = session.exec(select(UserRecord).where(UserRecord.email == "meiling@dbs.sg")).first()
            sarah = session.exec(select(UserRecord).where(UserRecord.email == "sarah.j@nexus.org")).first()

            if not (rahul and meiling and sarah):
                return

            now = datetime.now(timezone.utc)
            base_txs = [
                TransactionRecord(
                    transaction_id=f"TX-{now.strftime('%Y%m%d')}-9812",
                    uetr=str(uuid.uuid4()),
                    sender_user_id=meiling.user_id,
                    sender_name=meiling.name,
                    sender_proxy=meiling.proxy_value,
                    sender_country=meiling.home_country,
                    sender_currency="SGD",
                    sender_amount=45.0,
                    sender_account_number=meiling.account_number,
                    recipient_user_id=rahul.user_id,
                    recipient_name=rahul.name,
                    recipient_proxy=rahul.proxy_value,
                    recipient_country=rahul.home_country,
                    recipient_currency="INR",
                    recipient_amount=2835.0,
                    recipient_account_number=rahul.account_number,
                    exchange_rate=63.0,
                    purpose_code="P2P_TRANSFER",
                    status="SETTLED",
                    category="TRANSFER",
                    iso_status="ACCP_SETTLED_FUNDS_AVAILABLE",
                    note="Dinner reimbursement in Singapore",
                    created_at=now - timedelta(hours=2),
                ),
                TransactionRecord(
                    transaction_id=f"TX-{(now - timedelta(days=1)).strftime('%Y%m%d')}-4821",
                    uetr=str(uuid.uuid4()),
                    sender_user_id=rahul.user_id,
                    sender_name=rahul.name,
                    sender_proxy=rahul.proxy_value,
                    sender_country=rahul.home_country,
                    sender_currency="INR",
                    sender_amount=4342.5,
                    sender_account_number=rahul.account_number,
                    recipient_user_id=sarah.user_id,
                    recipient_name=sarah.name,
                    recipient_proxy=sarah.proxy_value,
                    recipient_country=sarah.home_country,
                    recipient_currency="USD",
                    recipient_amount=50.0,
                    recipient_account_number=sarah.account_number,
                    exchange_rate=86.85,
                    purpose_code="P2P_TRANSFER",
                    status="SETTLED",
                    category="TRANSFER",
                    iso_status="ACCP_SETTLED_FUNDS_AVAILABLE",
                    note="Conference split payment",
                    created_at=now - timedelta(days=1),
                ),
            ]

            for tx in base_txs:
                session.add(tx)
            session.commit()

    def record_transaction(
        self,
        sender_user_id: str,
        sender_name: str,
        sender_proxy: str,
        sender_country: str,
        sender_currency: str,
        sender_amount: float,
        sender_account_number: str,
        recipient_user_id: Optional[str],
        recipient_name: str,
        recipient_proxy: str,
        recipient_country: str,
        recipient_currency: str,
        recipient_amount: float,
        recipient_account_number: str,
        exchange_rate: float,
        purpose_code: str = "P2P_TRANSFER",
        status: str = "SETTLED",
        category: str = "TRANSFER",
        note: Optional[str] = None,
        uetr: Optional[str] = None,
    ) -> TransactionRecord:
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        rand_id = uuid.uuid4().hex[:6].upper()
        tx_id = f"TX-{date_str}-{rand_id}"
        tx_uetr = uetr or str(uuid.uuid4())

        record = TransactionRecord(
            transaction_id=tx_id,
            uetr=tx_uetr,
            sender_user_id=sender_user_id,
            sender_name=sender_name,
            sender_proxy=sender_proxy,
            sender_country=sender_country,
            sender_currency=sender_currency,
            sender_amount=float(sender_amount),
            sender_account_number=sender_account_number or "",
            recipient_user_id=recipient_user_id,
            recipient_name=recipient_name,
            recipient_proxy=recipient_proxy,
            recipient_country=recipient_country,
            recipient_currency=recipient_currency,
            recipient_amount=float(recipient_amount),
            recipient_account_number=recipient_account_number or "",
            exchange_rate=float(exchange_rate),
            purpose_code=purpose_code,
            status=status,
            category=category,
            iso_status="ACCP_SETTLED_FUNDS_AVAILABLE",
            note=note,
            created_at=now,
        )

        with Session(engine) as session:
            session.add(record)
            session.commit()
            session.refresh(record)
            return record

    def get_user_transactions(self, user_id: str, limit: int = 50) -> List[TransactionRecord]:
        with Session(engine) as session:
            user = session.exec(select(UserRecord).where(UserRecord.user_id == user_id)).first()
            if not user:
                return []

            # Match on sender_user_id, recipient_user_id, or proxy matches
            statement = (
                select(TransactionRecord)
                .where(
                    or_(
                        TransactionRecord.sender_user_id == user_id,
                        TransactionRecord.recipient_user_id == user_id,
                        TransactionRecord.recipient_proxy == user.proxy_value,
                        TransactionRecord.recipient_proxy == user.contact_number,
                        TransactionRecord.recipient_proxy == user.email,
                    )
                )
                .order_by(TransactionRecord.created_at.desc())
                .limit(limit)
            )
            return list(session.exec(statement).all())

    def get_all_transactions(self, limit: int = 100) -> List[TransactionRecord]:
        with Session(engine) as session:
            statement = select(TransactionRecord).order_by(TransactionRecord.created_at.desc()).limit(limit)
            return list(session.exec(statement).all())


transaction_service = TransactionService()
