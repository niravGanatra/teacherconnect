"""
Signals for LMS - triggers certificate generation on course completion.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import LessonProgress, Enrollment, Certificate


@receiver(post_save, sender=LessonProgress)
def check_course_completion(sender, instance, **kwargs):
    """
    When a lesson is marked complete, check if the entire course is complete.
    If so, mark enrollment as completed and trigger certificate generation.
    """
    if not instance.is_completed:
        return

    enrollment = instance.enrollment
    
    # Check if all lessons are complete
    if enrollment.percent_complete >= 100.0:
        # Mark enrollment as completed
        if not enrollment.completed_at:
            enrollment.completed_at = timezone.now()
            enrollment.save(update_fields=['completed_at'])
            
            # Generate certificate if course has certificate enabled
            if enrollment.course.issue_certificate:
                # Check if certificate already exists
                if not Certificate.objects.filter(user=enrollment.user, course=enrollment.course).exists():
                    # Create certificate (PDF generation will be async via Celery)
                    Certificate.objects.create(
                        user=enrollment.user,
                        course=enrollment.course,
                        enrollment=enrollment
                    )
                    
                    # TODO: Trigger Celery task for PDF generation
                    # from courses.tasks import generate_certificate_pdf
                    # generate_certificate_pdf.delay(certificate.id)
