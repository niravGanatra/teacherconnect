from django.db import models
from accounts.models import User
from institutions.models import Institution

class Opportunity(models.Model):
    OPPORTUNITY_TYPES = [
        ('fulltime', 'Full-time Teaching Position'),
        ('parttime', 'Part-time / Visiting Faculty'),
        ('research', 'Research Collaboration'),
        ('fdp_gig', 'FDP Facilitation Gig'),
        ('partnership', 'Institution Partnership'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]

    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='opportunities')
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_opportunities')
    title = models.CharField(max_length=200)
    opportunity_type = models.CharField(max_length=50, choices=OPPORTUNITY_TYPES)
    description = models.TextField()
    requirements = models.TextField()
    subjects = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=200)
    is_remote = models.BooleanField(default=False)
    compensation = models.CharField(max_length=200, blank=True)
    application_deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    views_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Application(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('hired', 'Hired'),
    ]

    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='opportunity_applications')
    cover_note = models.TextField(max_length=1000)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('opportunity', 'applicant')

    def __str__(self):
        return f"{self.applicant} -> {self.opportunity}"
