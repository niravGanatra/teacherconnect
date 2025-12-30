"""
Signals for network app.
Handles auto-follow creation when connection is accepted.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction

from .models import ConnectionRequest, ConnectionRequestStatus, Connection
from feed.models import Follow


@receiver(pre_save, sender=ConnectionRequest)
def track_status_change(sender, instance, **kwargs):
    """
    Track if status is changing to ACCEPTED.
    """
    if instance.pk:
        try:
            old_instance = ConnectionRequest.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except ConnectionRequest.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=ConnectionRequest)
def handle_connection_accepted(sender, instance, created, **kwargs):
    """
    When a connection request is accepted:
    1. Create a Connection record between the two users
    2. Create bi-directional Follow relationships if they don't exist
    """
    # Only process if status changed to ACCEPTED
    old_status = getattr(instance, '_old_status', None)
    
    if instance.status == ConnectionRequestStatus.ACCEPTED and old_status != ConnectionRequestStatus.ACCEPTED:
        with transaction.atomic():
            # 1. Create Connection (with ID ordering)
            Connection.create_connection(instance.sender, instance.recipient)
            
            # 2. Create Follow: sender -> recipient (if not exists)
            Follow.objects.get_or_create(
                follower=instance.sender,
                following=instance.recipient
            )
            
            # 3. Create Follow: recipient -> sender (if not exists)
            Follow.objects.get_or_create(
                follower=instance.recipient,
                following=instance.sender
            )
