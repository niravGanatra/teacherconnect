from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Conversation(models.Model):
    participant_a = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='acadtalk_conversations_as_a'
    )
    participant_b = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='acadtalk_conversations_as_b'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'acadtalk_conversation'
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        unique_together = ('participant_a', 'participant_b')
        ordering = ['-last_message_at']

    def __str__(self):
        return f"Conversation: {self.participant_a_id} and {self.participant_b_id}"

    @classmethod
    def get_or_create_conversation(cls, user1, user2):
        """
        Enforce canonical ordering by user ID to prevent duplicate conversation rows
        (e.g., A-B vs B-A).
        Returns the conversation instance.
        """
        if user1.pk == user2.pk:
            raise ValueError("Cannot create a conversation with oneself.")

        p_a, p_b = sorted([user1, user2], key=lambda u: str(u.pk))
        
        conversation, created = cls.objects.get_or_create(
            participant_a=p_a,
            participant_b=p_b
        )
        return conversation

    def get_other_participant(self, user):
        """Return the participant that is not the given user."""
        if self.participant_a_id == user.id:
            return self.participant_b
        elif self.participant_b_id == user.id:
            return self.participant_a
        return None

class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='acadtalk_sent_messages'
    )
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'acadtalk_message'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['-sent_at']  # Newest first

    def __str__(self):
        return f"Msg {self.id} in Conv {self.conversation_id} by {self.sender_id}"

    @property
    def is_read(self):
        return self.read_at is not None
