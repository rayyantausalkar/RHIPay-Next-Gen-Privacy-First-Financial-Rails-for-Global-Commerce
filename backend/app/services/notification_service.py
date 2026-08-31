import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select

from app.models.auth import UserRecord
from app.models.notification import (
    NotificationRecord,
    NotificationResponse,
    BroadcastNotificationRequest,
)
from app.core.database import engine



class NotificationService:
    def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notif_type: str = "SYSTEM",
        metadata_json: Optional[str] = None,
    ) -> NotificationRecord:
        notif_id = f"NOTIF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        with Session(engine) as session:
            record = NotificationRecord(
                notification_id=notif_id,
                user_id=user_id,
                title=title,
                message=message,
                type=notif_type,
                is_read=False,
                metadata_json=metadata_json,
                created_at=datetime.now(timezone.utc),
            )
            session.add(record)
            session.commit()
            session.refresh(record)
            return record

    def get_user_notifications(self, user_id: str, limit: int = 50) -> List[NotificationRecord]:
        with Session(engine) as session:
            records = session.exec(
                select(NotificationRecord)
                .where((NotificationRecord.user_id == user_id) | (NotificationRecord.user_id == "ALL"))
                .order_by(NotificationRecord.created_at.desc())
                .limit(limit)
            ).all()
            return list(records)

    def mark_as_read(self, notification_id: str) -> bool:
        with Session(engine) as session:
            record = session.exec(
                select(NotificationRecord).where(NotificationRecord.notification_id == notification_id)
            ).first()
            if record:
                record.is_read = True
                session.add(record)
                session.commit()
                return True
            return False

    def mark_all_read(self, user_id: str) -> int:
        with Session(engine) as session:
            records = session.exec(
                select(NotificationRecord).where(
                    (NotificationRecord.user_id == user_id) | (NotificationRecord.user_id == "ALL"),
                    NotificationRecord.is_read == False,
                )
            ).all()
            count = len(records)
            for r in records:
                r.is_read = True
                session.add(r)
            session.commit()
            return count

    def broadcast_notification(self, req: BroadcastNotificationRequest) -> NotificationRecord:
        return self.create_notification(
            user_id=req.target_user_id or "ALL",
            title=req.title,
            message=req.message,
            notif_type=req.type,
        )


notification_service = NotificationService()
