from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Post, PostAttachment
from .tasks import process_pdf_attachment, generate_video_thumbnail, fetch_link_preview
import logging

logger = logging.getLogger(__name__)

def safe_delay(task, *args):
    """Safely call a Celery task's delay method, catching connection errors."""
    try:
        task.delay(*args)
    except Exception as e:
        logger.warning(f"Failed to queue Celery task {task.name}: {e}")

@receiver(post_save, sender=PostAttachment)
def attachment_created(sender, instance, created, **kwargs):
    if created:
        if instance.media_type == 'DOCUMENT':
            transaction.on_commit(lambda: safe_delay(process_pdf_attachment, instance.id))
        elif instance.media_type == 'VIDEO':
            transaction.on_commit(lambda: safe_delay(generate_video_thumbnail, instance.id))

@receiver(post_save, sender=Post)
def post_created_or_updated(sender, instance, created, **kwargs):
    transaction.on_commit(lambda: safe_delay(fetch_link_preview, instance.id))
