"""
Email Notification Service for AcadWorld
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings


class EmailNotificationService:
    """Service class for sending email notifications"""
    
    @staticmethod
    def send_email(to_email, subject, template_name, context):
        """
        Send an HTML email with plain text fallback
        """
        try:
            # Render HTML content
            html_content = render_to_string(f'emails/{template_name}.html', context)
            text_content = strip_tags(html_content)
            
            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            return True
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False

    @classmethod
    def send_welcome_email(cls, user):
        """Send welcome email after registration"""
        context = {
            'username': user.username,
            'user_type': user.user_type,
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=user.email,
            subject='Welcome to AcadWorld!',
            template_name='welcome',
            context=context
        )

    @classmethod
    def send_application_received(cls, application):
        """Notify teacher that their application was submitted"""
        teacher = application.teacher
        job = application.job
        context = {
            'teacher_name': teacher.teacher_profile.first_name or teacher.username,
            'job_title': job.title,
            'institution_name': job.institution.institution_profile.institution_name,
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=teacher.email,
            subject=f'Application Submitted: {job.title}',
            template_name='application_received',
            context=context
        )

    @classmethod
    def send_new_applicant(cls, application):
        """Notify institution about new applicant"""
        institution = application.job.institution
        job = application.job
        snapshot = application.snapshot
        context = {
            'institution_name': institution.institution_profile.institution_name,
            'job_title': job.title,
            'applicant_name': snapshot.full_name if snapshot else 'New Applicant',
            'application_id': application.id,
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=institution.email,
            subject=f'New Application: {job.title}',
            template_name='new_applicant',
            context=context
        )

    @classmethod
    def send_application_status_update(cls, application):
        """Notify teacher about application status change"""
        teacher = application.teacher
        job = application.job
        status_messages = {
            'REVIEWING': 'is under review',
            'SHORTLISTED': 'has been shortlisted!',
            'INTERVIEW': 'has moved to interview stage!',
            'ACCEPTED': 'has been accepted! Congratulations!',
            'REJECTED': 'was not selected for this position',
        }
        context = {
            'teacher_name': teacher.teacher_profile.first_name or teacher.username,
            'job_title': job.title,
            'institution_name': job.institution.institution_profile.institution_name,
            'status': application.status,
            'status_message': status_messages.get(application.status, 'has been updated'),
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=teacher.email,
            subject=f'Application Update: {job.title}',
            template_name='application_status',
            context=context
        )

    @classmethod
    def send_new_follower(cls, follow):
        """Notify teacher about new follower"""
        followed = follow.followed
        follower = follow.follower
        context = {
            'followed_name': followed.teacher_profile.first_name or followed.username,
            'follower_name': follower.teacher_profile.first_name or follower.username,
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=followed.email,
            subject=f'{context["follower_name"]} started following you!',
            template_name='new_follower',
            context=context
        )

    @classmethod
    def send_job_posted(cls, job):
        """Send confirmation when institution posts a new job"""
        institution = job.institution
        context = {
            'institution_name': institution.institution_profile.institution_name,
            'job_title': job.title,
            'job_id': job.id,
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=institution.email,
            subject=f'Job Posted: {job.title}',
            template_name='job_posted',
            context=context
        )

    @classmethod
    def send_event_reminder(cls, attendee):
        """Send event reminder to attendee"""
        event = attendee.event
        user = attendee.user
        
        # Get display name based on user type
        if hasattr(user, 'teacher_profile'):
            name = user.teacher_profile.first_name or user.username
        elif hasattr(user, 'institution_profile'):
            name = user.institution_profile.institution_name or user.username
        else:
            name = user.username
            
        context = {
            'user_name': name,
            'event_title': event.title,
            'event_date': event.start_datetime,
            'event_location': 'Online' if event.is_online else event.location,
            'meeting_link': event.meeting_link if event.is_online else None,
            'site_url': settings.FRONTEND_URL,
        }
        return cls.send_email(
            to_email=user.email,
            subject=f'Reminder: {event.title}',
            template_name='event_reminder',
            context=context
        )
