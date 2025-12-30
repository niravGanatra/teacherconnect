"""
Network models for Connection and Follow relationship management.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings


class ConnectionRequestStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    REJECTED = 'REJECTED', 'Rejected'
    WITHDRAWN = 'WITHDRAWN', 'Withdrawn'


class ConnectionRequest(models.Model):
    """
    Request to connect with another user.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_connection_requests'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_connection_requests'
    )
    status = models.CharField(
        max_length=20,
        choices=ConnectionRequestStatus.choices,
        default=ConnectionRequestStatus.PENDING
    )
    message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'connection_requests'
        unique_together = ['sender', 'recipient']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.email} -> {self.recipient.email} ({self.status})"


class Connection(models.Model):
    """
    Established connection between two users.
    Always stores lower ID as user_a to prevent duplicate A-B and B-A rows.
    Uses UUID as primary key to prevent ID enumeration attacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='connections_as_a'
    )
    user_b = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='connections_as_b'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'connections'
        unique_together = ['user_a', 'user_b']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_a.email} <-> {self.user_b.email}"

    @classmethod
    def create_connection(cls, user1, user2):
        """
        Create a connection ensuring user_a has lower ID.
        """
        if user1.id < user2.id:
            user_a, user_b = user1, user2
        else:
            user_a, user_b = user2, user1
        
        connection, created = cls.objects.get_or_create(
            user_a=user_a,
            user_b=user_b
        )
        return connection, created

    @classmethod
    def are_connected(cls, user1, user2):
        """
        Check if two users are connected.
        """
        if user1.id < user2.id:
            user_a, user_b = user1, user2
        else:
            user_a, user_b = user2, user1
        
        return cls.objects.filter(user_a=user_a, user_b=user_b).exists()

    @classmethod
    def get_user_connections(cls, user):
        """
        Get all connections for a user.
        """
        from django.db.models import Q
        return cls.objects.filter(Q(user_a=user) | Q(user_b=user))
