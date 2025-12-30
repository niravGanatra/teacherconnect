"""
Payment views for Razorpay integration.
Handles order creation and payment verification.
"""
import hashlib
import hmac
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from courses.models import Course, Enrollment
from .models import PaymentOrder

# Try to import razorpay (optional dependency)
try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False
    razorpay = None

# Initialize Razorpay client (credentials from environment)
razorpay_client = None
if RAZORPAY_AVAILABLE and hasattr(settings, 'RAZORPAY_KEY_ID') and settings.RAZORPAY_KEY_ID:
    razorpay_client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )



class CreateOrderView(APIView):
    """
    Create a Razorpay order for course purchase.
    POST /api/payment/create-order/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        
        if not course_id:
            return Response(
                {'error': 'course_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course = get_object_or_404(Course, id=course_id, is_published=True)
        
        # Check if already enrolled
        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'error': 'Already enrolled in this course'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if free course
        if course.price == 0:
            return Response(
                {'error': 'This is a free course. Use the enroll endpoint.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing unpaid order (idempotency)
        existing_order = PaymentOrder.objects.filter(
            user=request.user,
            course=course,
            status='CREATED'
        ).first()
        
        if existing_order:
            return Response({
                'order_id': existing_order.razorpay_order_id,
                'amount': int(existing_order.amount * 100),
                'currency': existing_order.currency,
                'key_id': settings.RAZORPAY_KEY_ID,
                'course_title': course.title,
            })
        
        # Create Razorpay order
        if not razorpay_client:
            return Response(
                {'error': 'Payment gateway not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        amount_in_paise = int(course.price * 100)
        
        try:
            razorpay_order = razorpay_client.order.create({
                'amount': amount_in_paise,
                'currency': 'INR',
                'notes': {
                    'course_id': str(course.id),
                    'user_id': str(request.user.id),
                    'user_email': request.user.email,
                }
            })
        except Exception as e:
            return Response(
                {'error': f'Payment gateway error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Save order to database
        payment_order = PaymentOrder.objects.create(
            user=request.user,
            course=course,
            amount=course.price,
            razorpay_order_id=razorpay_order['id']
        )
        
        return Response({
            'order_id': razorpay_order['id'],
            'amount': amount_in_paise,
            'currency': 'INR',
            'key_id': settings.RAZORPAY_KEY_ID,
            'course_title': course.title,
            'internal_order_id': str(payment_order.id),
        })


class VerifyPaymentView(APIView):
    """
    Verify Razorpay payment signature and create enrollment.
    POST /api/payment/verify/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {'error': 'Missing payment details'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the order
        payment_order = PaymentOrder.objects.filter(
            razorpay_order_id=razorpay_order_id,
            user=request.user
        ).first()
        
        if not payment_order:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Idempotency: Check if already paid
        if payment_order.status == 'PAID':
            enrollment = Enrollment.objects.filter(
                user=request.user,
                course=payment_order.course
            ).first()
            return Response({
                'success': True,
                'message': 'Payment already verified',
                'enrollment_id': str(enrollment.id) if enrollment else None
            })
        
        # Verify signature
        if not self._verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
            payment_order.status = 'FAILED'
            payment_order.save()
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update payment order
        payment_order.razorpay_payment_id = razorpay_payment_id
        payment_order.razorpay_signature = razorpay_signature
        payment_order.status = 'PAID'
        payment_order.paid_at = timezone.now()
        payment_order.save()
        
        # Create enrollment (with idempotency check)
        enrollment, created = Enrollment.objects.get_or_create(
            user=request.user,
            course=payment_order.course,
            defaults={
                'price_paid': payment_order.amount,
                'payment_id': razorpay_payment_id,
            }
        )
        
        # TODO: Send confirmation email
        # from notifications.tasks import send_enrollment_confirmation
        # send_enrollment_confirmation.delay(enrollment.id)
        
        return Response({
            'success': True,
            'message': 'Payment verified successfully',
            'enrollment_id': str(enrollment.id),
            'course_slug': payment_order.course.slug,
        })

    def _verify_signature(self, order_id, payment_id, signature):
        """Verify Razorpay signature using HMAC SHA256."""
        message = f"{order_id}|{payment_id}"
        secret = settings.RAZORPAY_KEY_SECRET.encode('utf-8')
        
        generated_signature = hmac.new(
            secret,
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(generated_signature, signature)


class RazorpayWebhookView(APIView):
    """
    Webhook endpoint for Razorpay events.
    POST /api/payment/webhook/
    """
    permission_classes = [AllowAny]  # Razorpay webhook doesn't send auth

    def post(self, request):
        # Verify webhook signature
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
        
        if not webhook_secret:
            return Response({'status': 'ok'})  # Webhook not configured
        
        # Verify signature
        try:
            razorpay_client.utility.verify_webhook_signature(
                request.body.decode('utf-8'),
                webhook_signature,
                webhook_secret
            )
        except Exception:
            return Response(
                {'error': 'Invalid webhook signature'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process event
        event = request.data.get('event')
        payload = request.data.get('payload', {})
        
        if event == 'payment.captured':
            # Handle successful payment (backup for verification)
            payment = payload.get('payment', {}).get('entity', {})
            order_id = payment.get('order_id')
            payment_id = payment.get('id')
            
            if order_id:
                PaymentOrder.objects.filter(
                    razorpay_order_id=order_id,
                    status='CREATED'
                ).update(
                    razorpay_payment_id=payment_id,
                    status='PAID',
                    paid_at=timezone.now()
                )
        
        return Response({'status': 'ok'})
