class NotificationService:
    """
    Service for dispatching push/email notifications.
    """
    def send_notification(self, user_id: str, message: str):
        # Stub implementation
        print(f"Sending notification to {user_id}: {message}")
