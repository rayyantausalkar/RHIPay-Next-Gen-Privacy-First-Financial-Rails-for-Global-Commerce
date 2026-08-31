from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.notification import (
    NotificationResponse,
    BroadcastNotificationRequest,
)
from app.services.notification_service import notification_service

router = APIRouter()


@router.get(
    "/user/{user_id}",
    response_model=List[NotificationResponse],
    summary="Get User Notifications List",
)
def get_user_notifications(user_id: str, limit: int = 50):
    return notification_service.get_user_notifications(user_id=user_id, limit=limit)


@router.post(
    "/{notification_id}/read",
    summary="Mark Notification as Read",
)
def mark_notification_read(notification_id: str):
    success = notification_service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return {"success": True, "notification_id": notification_id}


@router.post(
    "/user/{user_id}/read-all",
    summary="Mark All Notifications as Read for User",
)
def mark_all_notifications_read(user_id: str):
    count = notification_service.mark_all_read(user_id)
    return {"success": True, "read_count": count}


@router.post(
    "/admin/broadcast",
    response_model=NotificationResponse,
    summary="Admin Broadcast System Notification",
)
def broadcast_notification(req: BroadcastNotificationRequest):
    return notification_service.broadcast_notification(req)
