from django.db import models
from django.conf import settings
from django.db.models import Q
from django.contrib.auth import get_user_model

User = settings.AUTH_USER_MODEL

class ConnectionRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('withdrawn', 'Withdrawn'),
    )

    sender = models.ForeignKey(User, related_name='acadconnect_sent_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='acadconnect_received_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('sender', 'receiver')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender} -> {self.receiver} ({self.status})"

class Connection(models.Model):
    user_a = models.ForeignKey(User, related_name='acadconnect_connections_as_a', on_delete=models.CASCADE)
    user_b = models.ForeignKey(User, related_name='acadconnect_connections_as_b', on_delete=models.CASCADE)
    connected_since = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user_a', 'user_b')
        ordering = ['-connected_since']

    def __str__(self):
        return f"{self.user_a} connected with {self.user_b}"

    @classmethod
    def get_connections(cls, user):
        """Returns all User objects connected to this user"""
        UserModel = get_user_model()
        user_b_ids = cls.objects.filter(user_a=user).values_list('user_b_id', flat=True)
        user_a_ids = cls.objects.filter(user_b=user).values_list('user_a_id', flat=True)
        connected_ids = list(user_b_ids) + list(user_a_ids)
        return UserModel.objects.filter(id__in=connected_ids)

    @classmethod
    def are_connected(cls, user1, user2):
        """Returns bool indicating if user1 and user2 are connected"""
        if user1.is_anonymous or user2.is_anonymous:
            return False
            
        return cls.objects.filter(
            Q(user_a=user1, user_b=user2) | Q(user_a=user2, user_b=user1)
        ).exists()

    @classmethod
    def connection_count(cls, user):
        """Returns the number of connections for a user"""
        if user.is_anonymous:
            return 0
        return cls.objects.filter(Q(user_a=user) | Q(user_b=user)).count()
