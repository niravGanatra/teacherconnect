"""
Payment models for course purchases with Razorpay integration.
"""
import uuid
from django.db import models
from django.conf import settings
from courses.models import Course


class PaymentOrder(models.Model):
    """
    Tracks payment orders created with Razorpay.
    Used for idempotency and payment verification.
    """
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User and Course
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_orders'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='payment_orders')
    
    # Order Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    
    # Razorpay IDs
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=256, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payment_orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.razorpay_order_id} - {self.status}"


class RefundRequest(models.Model):
    """
    Tracks refund requests.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    payment_order = models.ForeignKey(
        PaymentOrder, 
        on_delete=models.CASCADE, 
        related_name='refunds'
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    
    razorpay_refund_id = models.CharField(max_length=100, blank=True)
    
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'refund_requests'

    def __str__(self):
        return f"Refund for {self.payment_order.razorpay_order_id}"
