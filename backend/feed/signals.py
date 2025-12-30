from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Post, PostAttachment
from .tasks import process_pdf_attachment, generate_video_thumbnail, fetch_link_preview

@receiver(post_save, sender=PostAttachment)
def attachment_created(sender, instance, created, **kwargs):
    if created:
        if instance.media_type == 'DOCUMENT':
            transaction.on_commit(lambda: process_pdf_attachment.delay(instance.id))
        elif instance.media_type == 'VIDEO':
            transaction.on_commit(lambda: generate_video_thumbnail.delay(instance.id))

@receiver(post_save, sender=Post)
def post_created_or_updated(sender, instance, created, **kwargs):
    # Retrieve old content? Or just always run task (it checks if parsed already).
    # Since we can edit posts, we should re-check.
    # But LinkPreview logic checks for duplicates.
    transaction.on_commit(lambda: fetch_link_preview.delay(instance.id))
