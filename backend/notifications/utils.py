from django.contrib.contenttypes.models import ContentType


def notify(recipient, actor, verb, target=None):
    """
    Create a Notification instance.

    Args:
        recipient: User who receives the notification
        actor: User who triggered the action (may be None for system notifications)
        verb: Human-readable action string, e.g. 'viewed your profile'
        target: Optional model instance related to the action

    Returns:
        Notification instance, or None if suppressed (e.g. self-notification)
    """
    from .models import Notification

    # Suppress self-notifications
    if actor and recipient.pk == actor.pk:
        return None

    notification = Notification(
        recipient=recipient,
        actor=actor,
        verb=verb,
    )

    if target is not None:
        notification.target_content_type = ContentType.objects.get_for_model(target)
        notification.target_object_id = str(target.pk)

    notification.save()
    return notification
