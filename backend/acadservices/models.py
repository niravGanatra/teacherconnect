from django.db import models
from django.conf import settings

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50)
    description = models.CharField(max_length=200)

    def __str__(self):
        return self.name

class Service(models.Model):
    DELIVERY_CHOICES = [
        ('online', 'Online'),
        ('in_person', 'In-Person'),
        ('hybrid', 'Hybrid')
    ]
    PRICING_CHOICES = [
        ('fixed', 'Fixed Price'),
        ('hourly', 'Per Hour'),
        ('negotiable', 'Negotiable')
    ]

    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=150)
    tagline = models.CharField(max_length=200)
    description = models.TextField()
    
    delivery_format = models.CharField(max_length=20, choices=DELIVERY_CHOICES)
    pricing_type = models.CharField(max_length=20, choices=PRICING_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_currency = models.CharField(max_length=3, default='INR')
    turnaround_days = models.PositiveIntegerField(null=True, blank=True)
    
    subjects = models.JSONField(default=list, blank=True)
    grades_served = models.JSONField(default=list, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ServiceReview(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_reviews')
    rating = models.PositiveSmallIntegerField()  # 1-5 expected
    review_text = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('service', 'reviewer')

    def __str__(self):
        return f"Review by {self.reviewer.email} on {self.service.title}"


class ServiceInquiry(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('responded', 'Responded'),
        ('closed', 'Closed')
    ]
    
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='inquiries')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_inquiries')
    message = models.TextField(max_length=1000)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry from {self.client.email} for {self.service.title}"
