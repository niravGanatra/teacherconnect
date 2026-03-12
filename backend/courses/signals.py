"""
Signals for LMS - triggers certificate generation on course completion.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.core.files.base import ContentFile

from .models import LessonProgress, Enrollment, Certificate

logger = logging.getLogger(__name__)


def _get_user_display_name(user):
    """Return the best display name for a user."""
    try:
        if hasattr(user, 'teacher_profile'):
            p = user.teacher_profile
            name = f"{p.first_name or ''} {p.last_name or ''}".strip()
            return name or user.email
    except Exception:
        pass
    return user.get_full_name() or user.email


def _generate_certificate_number():
    """Generate a unique sequential certificate number like CERT-2025-00042."""
    year = timezone.now().year
    # Count all certs this year (including the one being created)
    count = Certificate.objects.filter(issued_at__year=year).count() + 1
    return f"CERT-{year}-{count:05d}"


@receiver(post_save, sender=LessonProgress)
def check_course_completion(sender, instance, **kwargs):
    """
    When a lesson is marked complete, check if the entire course is complete.
    If so, mark enrollment as completed and generate a certificate (PDF included).
    """
    if not instance.is_completed:
        return

    enrollment = instance.enrollment

    # Check if all lessons are complete
    if enrollment.percent_complete < 100.0:
        return

    # Mark enrollment as completed (idempotent)
    if not enrollment.completed_at:
        enrollment.completed_at = timezone.now()
        enrollment.save(update_fields=['completed_at'])

    # Skip if no certificate should be issued
    if not enrollment.course.issue_certificate:
        return

    # Skip if certificate already exists
    if Certificate.objects.filter(user=enrollment.user, course=enrollment.course).exists():
        return

    # ── Generate unique certificate number ──────────────────────────────────
    cert_number = _generate_certificate_number()

    # ── Create certificate record ────────────────────────────────────────────
    cert = Certificate.objects.create(
        user=enrollment.user,
        course=enrollment.course,
        enrollment=enrollment,
        certificate_number=cert_number,
    )

    # ── Generate PDF synchronously ───────────────────────────────────────────
    try:
        from .certificate_generator import generate_certificate_pdf

        user_name = _get_user_display_name(enrollment.user)
        completion_date = enrollment.completed_at.strftime('%B %d, %Y')

        pdf_buffer = generate_certificate_pdf(
            user_name=user_name,
            course_title=enrollment.course.title,
            completion_date=completion_date,
            credential_id=str(cert.credential_id),
        )

        filename = f"cert_{cert.credential_id}.pdf"
        cert.file.save(filename, ContentFile(pdf_buffer.read()), save=True)
        logger.info(f"Certificate PDF saved for {enrollment.user.email} — {cert_number}")

    except Exception as exc:
        logger.error(f"Certificate PDF generation failed for {cert_number}: {exc}")

    # ── Create feed activity post ────────────────────────────────────────────
    try:
        from feed.models import Post
        Post.objects.create(
            author=enrollment.user,
            content=(
                f"🎓 I just earned a certificate for completing "
                f"\"{enrollment.course.title}\"! "
                f"Certificate #{cert_number} | #AcadWorld #FDP #Certificate"
            )
        )
    except Exception as exc:
        logger.warning(f"Feed post creation failed after certificate issue: {exc}")

    # ── Send certificate email to learner ─────────────────────────────────────
    try:
        from emails.utils import send_certificate_issued_email
        send_certificate_issued_email(cert)
    except Exception as exc:
        logger.warning(f"Certificate email failed for {cert_number}: {exc}")
