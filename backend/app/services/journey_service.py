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
from app.models.transaction import (
    TransactionRecord,
    JourneyCancelResponse,
)
from app.core.database import engine

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

            # Deduct home bank balance and allocate to travel wallet
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

                # Deduct from home wallet balance (if positive) and credit travel wallet
                user.wallet_balance = max(0.0, round(user.wallet_balance - added_home, 2))
                user.travel_wallet_balance = round(user.travel_wallet_balance + dest_amt, 2)
                user.active_journey_country = record.destination_country
                user.active_journey_currency = record.destination_currency
                session.add(user)

                # Record transaction
                now = datetime.now(timezone.utc)
                tx_record = TransactionRecord(
                    transaction_id=f"TX-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                    uetr=str(uuid.uuid4()),
                    sender_user_id=user.user_id,
                    sender_name=user.name,
                    sender_proxy=user.proxy_value,
                    sender_country=user.home_country,
                    sender_currency=record.home_currency,
                    sender_amount=added_home,
                    sender_account_number=user.account_number,
                    recipient_user_id=user.user_id,
                    recipient_name=f"RHI Pay Travel Vault ({record.destination_country})",
                    recipient_proxy=f"WALLET-{record.destination_currency}",
                    recipient_country=record.destination_country,
                    recipient_currency=record.destination_currency,
                    recipient_amount=dest_amt,
                    recipient_account_number=f"RHIVLT{record.destination_currency}",
                    exchange_rate=record.exchange_rate,
                    purpose_code="TRAVEL_ALLOCATION",
                    status="SETTLED",
                    category="JOURNEY_ALLOCATION",
                    iso_status="ACCP_SETTLED_FUNDS_AVAILABLE",
                    note=f"Approved travel exchange allocation for {record.destination_country}",
                    created_at=now,
                )
                session.add(tx_record)

            session.add(record)
            session.commit()
            session.refresh(record)

            # Send approval notification
            notification_service.create_notification(
                user_id=record.user_id,
                title="🎉 Travel Currency Approved!",
                message=f"RHI Pay authorities approved your travel exchange. {record.destination_currency} {record.destination_amount_calculated:,.2f} ({record.home_currency} {record.home_amount_requested:,.2f}) has been credited to your RHI Pay wallet for travel to {record.destination_country}.",
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

    def cancel_journey(self, user_id: str, reason: Optional[str] = "Cancelled by user") -> JourneyCancelResponse:
        """
        Cancel active journey:
        1. Calculate home worth of remaining travel wallet balance
        2. Deduct 2.5% reconversion / cancellation penalty
        3. Refund net balance to primary user account
        4. Reset travel balance & clear active journey
        5. Record transaction in database & send push notification
        """
        with Session(engine) as session:
            user = session.exec(select(UserRecord).where(UserRecord.user_id == user_id)).first()
            if not user:
                raise ValueError(f"User {user_id} not found")

            # Look for active approved or pending journey
            journey = session.exec(
                select(JourneyRequestRecord)
                .where(
                    JourneyRequestRecord.user_id == user_id,
                    JourneyRequestRecord.status.in_(["APPROVED", "PENDING"])
                )
                .order_by(JourneyRequestRecord.created_at.desc())
            ).first()

            if not journey:
                # Check any journey record for user
                journey = session.exec(
                    select(JourneyRequestRecord)
                    .where(JourneyRequestRecord.user_id == user_id)
                    .order_by(JourneyRequestRecord.created_at.desc())
                ).first()

            # If user has no active journey country and no travel balance and no pending/approved journey
            if not journey and not user.active_journey_country and (user.travel_wallet_balance or 0.0) <= 0:
                raise ValueError("No active travel journey found to cancel.")

            home_cur = user.preferred_currency or "INR"
            dest_cur = user.active_journey_currency or (journey.destination_currency if journey else "USD")
            dest_country = user.active_journey_country or (journey.destination_country if journey else "US")

            if journey and journey.status == "PENDING" and not user.active_journey_country and (user.travel_wallet_balance or 0.0) <= 0:
                # For pending requests where funds have not been credited yet
                journey.status = "CANCELLED"
                journey.rejection_reason = "Cancelled by user before approval."
                session.add(journey)
                session.commit()
                return JourneyCancelResponse(
                    success=True,
                    user_id=user.user_id,
                    gross_refund_home=0.0,
                    penalty_fee_home=0.0,
                    net_refund_home=0.0,
                    home_currency=home_cur,
                    new_wallet_balance=user.wallet_balance,
                    message="Pending travel request cancelled. No penalty fee incurred.",
                )

            # For approved journeys: refund remaining travel balance
            remaining_travel = float(user.travel_wallet_balance or 0.0)
            if remaining_travel > 0:
                # Convert back to home currency
                if journey and journey.exchange_rate and journey.exchange_rate > 0:
                    gross_refund = round(remaining_travel / journey.exchange_rate, 2)
                else:
                    _, inv = fx_service.get_exchange_rate(home_cur, dest_cur)
                    inv_f = float(inv)
                    gross_refund = round(remaining_travel / inv_f, 2) if inv_f > 0 else round(remaining_travel * 86.85, 2)
            else:
                gross_refund = 0.0

            # Apply 2.5% penalty fee
            penalty_rate = 0.025
            penalty_fee = round(gross_refund * penalty_rate, 2)
            net_refund = max(0.0, round(gross_refund - penalty_fee, 2))

            # Credit back to user's primary bank account
            user.wallet_balance = round(user.wallet_balance + net_refund, 2)
            user.travel_wallet_balance = 0.0
            user.active_journey_country = None
            user.active_journey_currency = None

            if journey:
                journey.status = "CANCELLED"
                journey.rejection_reason = (
                    f"Journey cancelled by user. 2.5% fee ({home_cur} {penalty_fee:,.2f}) deducted. "
                    f"Net refund {home_cur} {net_refund:,.2f} returned to bank account."
                )
                session.add(journey)

            # Cancel any other pending journey requests for this user
            all_pending = session.exec(
                select(JourneyRequestRecord)
                .where(
                    JourneyRequestRecord.user_id == user_id,
                    JourneyRequestRecord.status == "PENDING"
                )
            ).all()
            for p in all_pending:
                p.status = "CANCELLED"
                p.rejection_reason = "Cancelled upon active journey refund."
                session.add(p)

            now = datetime.now(timezone.utc)
            tx_record = TransactionRecord(
                transaction_id=f"TX-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                uetr=str(uuid.uuid4()),
                sender_user_id=user.user_id,
                sender_name=f"RHI Pay Travel Vault ({dest_country})",
                sender_proxy=f"WALLET-{dest_cur}",
                sender_country=dest_country,
                sender_currency=dest_cur,
                sender_amount=remaining_travel,
                sender_account_number=f"RHIVLT{dest_cur}",
                recipient_user_id=user.user_id,
                recipient_name=user.name,
                recipient_proxy=user.proxy_value,
                recipient_country=user.home_country,
                recipient_currency=home_cur,
                recipient_amount=net_refund,
                recipient_account_number=user.account_number,
                exchange_rate=journey.exchange_rate if journey and journey.exchange_rate else 1.0,
                purpose_code="JOURNEY_CANCELLATION_REFUND",
                status="SETTLED",
                category="JOURNEY_CANCELLATION_REFUND",
                iso_status="ACCP_SETTLED_FUNDS_AVAILABLE",
                note=f"Journey cancellation refund: {dest_cur} {remaining_travel:,.2f} returned to bank. 2.5% penalty: {home_cur} {penalty_fee:,.2f}, Net credited: {home_cur} {net_refund:,.2f}",
                created_at=now,
            )

            session.add(user)
            session.add(tx_record)
            session.commit()
            session.refresh(user)
            if journey:
                session.refresh(journey)

            notification_service.create_notification(
                user_id=user.user_id,
                title="✈️ Travel Journey Cancelled & Refunded",
                message=f"Journey to {dest_country} cancelled. Net refund of {home_cur} {net_refund:,.2f} credited to your bank account ({user.bank_name}) after 2.5% reconversion penalty ({home_cur} {penalty_fee:,.2f}).",
                notif_type="SYSTEM",
            )

            return JourneyCancelResponse(
                success=True,
                user_id=user.user_id,
                gross_refund_home=gross_refund,
                penalty_fee_home=penalty_fee,
                net_refund_home=net_refund,
                home_currency=home_cur,
                new_wallet_balance=user.wallet_balance,
                message=f"Journey cancelled successfully. {home_cur} {net_refund:,.2f} refunded to {user.bank_name} after 2.5% penalty ({home_cur} {penalty_fee:,.2f}).",
            )


journey_service = JourneyService()

