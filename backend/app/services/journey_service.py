import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select

from app.models.auth import UserRecord
from app.models.journey import (
    JourneyRequestRecord,
    JourneyCreateRequest,
    JourneyResponse,
    JourneyApproveRequest,
    JourneyRejectRequest,
)
from app.services.auth_service import engine
from app.services.fx_service import fx_service
from app.services.notification_service import notification_service


COUNTRY_CURRENCY_MAP = {
    "SG": "SGD",
    "IN": "INR",
    "AE": "AED",
    "US": "USD",
    "GB": "GBP",
    "EU": "EUR",
    "JP": "JPY",
    "TH": "THB",
    "MY": "MYR",
    "AU": "AUD",
    "CA": "CAD",
    "BR": "BRL",
}


class JourneyService:
    def create_journey_request(self, req: JourneyCreateRequest) -> JourneyRequestRecord:
        with Session(engine) as session:
            user = session.exec(select(UserRecord).where(UserRecord.user_id == req.user_id)).first()
            if not user:
                raise ValueError(f"User {req.user_id} not found")

            home_country = user.home_country.upper()
            home_currency = user.preferred_currency or COUNTRY_CURRENCY_MAP.get(home_country, "USD")
            dest_country = req.destination_country.upper()
            dest_currency = COUNTRY_CURRENCY_MAP.get(dest_country, "USD")

            # Calculate FX rate & destination amount
            fx_rate, inverse_rate = fx_service.get_exchange_rate(home_currency, dest_currency)
            dest_amt = float(req.home_amount_requested * float(inverse_rate))

            req_id = f"JR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

            record = JourneyRequestRecord(
                request_id=req_id,
                user_id=user.user_id,
                user_name=user.name,
                user_email=user.email,
                home_country=home_country,
                home_currency=home_currency,
                bank_name=user.bank_name,
                destination_country=dest_country,
                destination_currency=dest_currency,
                purpose_of_travel=req.purpose_of_travel,
                start_date=req.start_date,
                end_date=req.end_date,
                home_amount_requested=float(req.home_amount_requested),
                destination_amount_calculated=round(dest_amt, 2),
                exchange_rate=float(inverse_rate),
                passport_data_url=req.passport_data_url,
                passport_filename=req.passport_filename or "passport_scan.pdf",
                status="PENDING",
                created_at=datetime.now(timezone.utc),
            )
            session.add(record)
            session.commit()
            session.refresh(record)

            # Send submission notification
            notification_service.create_notification(
                user_id=user.user_id,
                title="✈️ Journey Request Submitted",
                message=f"Your travel currency request for {dest_country} ({dest_currency} {dest_amt:,.2f}) is under review by RHI Pay authorities.",
                notif_type="SYSTEM",
            )

            return record

    def get_user_journey(self, user_id: str) -> Optional[JourneyRequestRecord]:
        with Session(engine) as session:
            record = session.exec(
                select(JourneyRequestRecord)
                .where(JourneyRequestRecord.user_id == user_id)
                .order_by(JourneyRequestRecord.created_at.desc())
            ).first()
            return record

    def list_all_requests(self, limit: int = 50) -> List[JourneyRequestRecord]:
        with Session(engine) as session:
            records = session.exec(
                select(JourneyRequestRecord)
                .order_by(JourneyRequestRecord.created_at.desc())
                .limit(limit)
            ).all()
            return list(records)

    def approve_journey(self, request_id: str, approve_data: JourneyApproveRequest) -> JourneyRequestRecord:
        with Session(engine) as session:
            record = session.exec(
                select(JourneyRequestRecord).where(JourneyRequestRecord.request_id == request_id)
            ).first()
            if not record:
                raise ValueError(f"Journey request {request_id} not found")

            record.status = "APPROVED"
            record.reviewed_at = datetime.now(timezone.utc)
            record.reviewed_by = approve_data.admin_email

            # Credit user's wallet
            user = session.exec(select(UserRecord).where(UserRecord.user_id == record.user_id)).first()
            if user:
                added_home = approve_data.custom_amount_approved or record.home_amount_requested
                # calculate destination amount if custom
                if approve_data.custom_amount_approved:
                    dest_amt = round(added_home * record.exchange_rate, 2)
                    record.home_amount_requested = added_home
                    record.destination_amount_calculated = dest_amt
                else:
                    dest_amt = record.destination_amount_calculated

                user.wallet_balance += added_home
                user.travel_wallet_balance += dest_amt
                user.active_journey_country = record.destination_country
                user.active_journey_currency = record.destination_currency
                session.add(user)

            session.add(record)
            session.commit()
            session.refresh(record)

            # Send approval notification
            notification_service.create_notification(
                user_id=record.user_id,
                title="🎉 Travel Currency Approved!",
                message=f"RHI Pay authorities approved your travel exchange. {record.destination_currency} {record.destination_amount_calculated:,.2f} ({record.home_currency} {record.home_amount_requested:,.2f}) has been credited to your balance for travel to {record.destination_country}.",
                notif_type="JOURNEY_APPROVAL",
            )

            return record

    def reject_journey(self, request_id: str, reject_data: JourneyRejectRequest) -> JourneyRequestRecord:
        if not reject_data.rejection_reason or len(reject_data.rejection_reason.strip()) < 3:
            raise ValueError("A valid rejection reason must be provided.")

        with Session(engine) as session:
            record = session.exec(
                select(JourneyRequestRecord).where(JourneyRequestRecord.request_id == request_id)
            ).first()
            if not record:
                raise ValueError(f"Journey request {request_id} not found")

            record.status = "REJECTED"
            record.rejection_reason = reject_data.rejection_reason.strip()
            record.reviewed_at = datetime.now(timezone.utc)
            record.reviewed_by = reject_data.admin_email

            session.add(record)
            session.commit()
            session.refresh(record)

            # Send rejection notification with compulsory reason
            notification_service.create_notification(
                user_id=record.user_id,
                title="⚠️ Travel Request Rejected",
                message=f"Your journey request for {record.destination_country} was rejected. Reason: {record.rejection_reason}. You may re-plan your journey and submit revised documents.",
                notif_type="JOURNEY_REJECTION",
            )

            return record


journey_service = JourneyService()
