"""
Admin configuration for payments.
"""
from django.contrib import admin
from .models import PaymentOrder, RefundRequest


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = ['razorpay_order_id', 'user', 'course', 'amount', 'status', 'created_at', 'paid_at']
    list_filter = ['status', 'created_at']
    search_fields = ['razorpay_order_id', 'razorpay_payment_id', 'user__email']
    readonly_fields = ['razorpay_order_id', 'razorpay_payment_id', 'created_at', 'paid_at']


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display = ['payment_order', 'amount', 'is_processed', 'requested_at']
    list_filter = ['is_processed']
