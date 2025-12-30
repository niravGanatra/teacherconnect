"""
Certificate generation utility using ReportLab.
Generates PDF certificates from a template image.
"""
import io
import os
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def generate_certificate_pdf(user_name, course_title, completion_date, credential_id):
    """
    Generate a PDF certificate.
    
    Args:
        user_name: Name of the certificate recipient
        course_title: Title of the completed course
        completion_date: Date of completion (string format)
        credential_id: Unique credential ID (UUID)
    
    Returns:
        BytesIO buffer containing the PDF
    """
    buffer = io.BytesIO()
    
    # Create canvas with landscape A4
    width, height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    
    # Try to load custom font (optional)
    try:
        font_path = os.path.join(settings.STATIC_ROOT or settings.BASE_DIR, 'fonts', 'Montserrat-Bold.ttf')
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('Montserrat-Bold', font_path))
            title_font = 'Montserrat-Bold'
        else:
            title_font = 'Helvetica-Bold'
    except Exception:
        title_font = 'Helvetica-Bold'
    
    # Try to load template image (optional)
    template_path = os.path.join(settings.STATIC_ROOT or settings.BASE_DIR, 'certificate_template.png')
    if os.path.exists(template_path):
        try:
            template = ImageReader(template_path)
            c.drawImage(template, 0, 0, width=width, height=height)
        except Exception:
            _draw_default_background(c, width, height)
    else:
        _draw_default_background(c, width, height)
    
    # Draw certificate content
    # Title
    c.setFont(title_font, 36)
    c.setFillColorRGB(0.15, 0.15, 0.15)
    c.drawCentredString(width / 2, height - 120, "Certificate of Completion")
    
    # Subtitle
    c.setFont('Helvetica', 14)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.drawCentredString(width / 2, height - 160, "This is to certify that")
    
    # User Name
    c.setFont(title_font, 32)
    c.setFillColorRGB(0.1, 0.3, 0.6)  # Blue
    c.drawCentredString(width / 2, height - 220, user_name)
    
    # Has successfully completed
    c.setFont('Helvetica', 14)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.drawCentredString(width / 2, height - 270, "has successfully completed the course")
    
    # Course Title
    c.setFont(title_font, 24)
    c.setFillColorRGB(0.15, 0.15, 0.15)
    c.drawCentredString(width / 2, height - 320, course_title)
    
    # Date
    c.setFont('Helvetica', 12)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawCentredString(width / 2, height - 380, f"Completed on {completion_date}")
    
    # Credential ID (bottom)
    c.setFont('Helvetica', 10)
    c.setFillColorRGB(0.6, 0.6, 0.6)
    c.drawCentredString(width / 2, 60, f"Credential ID: {credential_id}")
    c.drawCentredString(width / 2, 45, "Verify at: acadworld.com/certificates/verify")
    
    # Platform logo/name (bottom left)
    c.setFont(title_font, 16)
    c.setFillColorRGB(0.2, 0.4, 0.8)
    c.drawString(60, 50, "AcadWorld")
    
    c.save()
    buffer.seek(0)
    return buffer


def _draw_default_background(canvas_obj, width, height):
    """Draw a simple default certificate background."""
    # Background color
    canvas_obj.setFillColorRGB(0.98, 0.98, 0.98)
    canvas_obj.rect(0, 0, width, height, fill=True)
    
    # Border
    canvas_obj.setStrokeColorRGB(0.2, 0.4, 0.8)  # Blue border
    canvas_obj.setLineWidth(3)
    canvas_obj.rect(20, 20, width - 40, height - 40, fill=False)
    
    # Inner border
    canvas_obj.setStrokeColorRGB(0.8, 0.85, 0.95)
    canvas_obj.setLineWidth(1)
    canvas_obj.rect(30, 30, width - 60, height - 60, fill=False)
    
    # Corner decorations (simple lines)
    canvas_obj.setStrokeColorRGB(0.3, 0.5, 0.9)
    canvas_obj.setLineWidth(2)
    # Top left
    canvas_obj.line(40, height - 40, 80, height - 40)
    canvas_obj.line(40, height - 40, 40, height - 80)
    # Top right
    canvas_obj.line(width - 40, height - 40, width - 80, height - 40)
    canvas_obj.line(width - 40, height - 40, width - 40, height - 80)
    # Bottom left
    canvas_obj.line(40, 40, 80, 40)
    canvas_obj.line(40, 40, 40, 80)
    # Bottom right
    canvas_obj.line(width - 40, 40, width - 80, 40)
    canvas_obj.line(width - 40, 40, width - 40, 80)
