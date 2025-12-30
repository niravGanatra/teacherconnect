import tempfile
import os
import re
import requests
from bs4 import BeautifulSoup
from celery import shared_task
from django.core.files import File
from django.core.files.base import ContentFile
from io import BytesIO

# Try importing pdf2image and ffmpeg, handle if missing to avoid import errors
try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None

try:
    import ffmpeg
except ImportError:
    ffmpeg = None

from .models import Post, PostAttachment, AttachmentPage, LinkPreview

@shared_task
def process_pdf_attachment(attachment_id):
    """
    Convert PDF pages to images.
    """
    if not convert_from_bytes:
        print("pdf2image not installed.")
        return

    try:
        attachment = PostAttachment.objects.get(id=attachment_id)
        if attachment.media_type != 'DOCUMENT':
            return

        # Read file content
        with attachment.file.open('rb') as f:
            file_content = f.read()
        
        # Convert
        images = convert_from_bytes(file_content, fmt='jpeg')
        
        for i, image in enumerate(images):
            thumb_io = BytesIO()
            image.save(thumb_io, format='JPEG', quality=85)
            
            # Check if page already exists to prevent duplicates
            if not AttachmentPage.objects.filter(attachment=attachment, page_number=i + 1).exists():
                page = AttachmentPage(
                    attachment=attachment,
                    page_number=i + 1
                )
                page.image.save(
                    f'{attachment.id}_page_{i+1}.jpg', 
                    ContentFile(thumb_io.getvalue()), 
                    save=True
                )
            
    except Exception as e:
        print(f"Error processing PDF {attachment_id}: {e}")


@shared_task
def generate_video_thumbnail(attachment_id):
    """
    Generate thumbnail from video at 1s mark.
    """
    if not ffmpeg:
        print("ffmpeg-python not installed.")
        return

    try:
        attachment = PostAttachment.objects.get(id=attachment_id)
        if attachment.media_type != 'VIDEO':
            return
        
        # Create temp file for video
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
            with attachment.file.open('rb') as f:
                 for chunk in f.chunks():
                     temp_video.write(chunk)
            temp_video_path = temp_video.name
        
        out_filename = f"{temp_video_path}_thumb.jpg"
        
        try:
            (
                ffmpeg
                .input(temp_video_path, ss=1) # Capture at 1s
                .filter('scale', 800, -1) # Resize width to 800, keep aspect ratio
                .output(out_filename, vframes=1)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            if os.path.exists(out_filename):
                with open(out_filename, 'rb') as f:
                    attachment.thumbnail.save(
                        f'{attachment.id}_thumb.jpg', 
                        File(f), 
                        save=True
                    )
        except ffmpeg.Error as e:
             print(f"ffmpeg error: {e.stderr.decode('utf8')}")
        finally:
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
            if os.path.exists(out_filename):
                os.remove(out_filename)

    except Exception as e:
        print(f"Error generating thumbnail for {attachment_id}: {e}")


@shared_task
def fetch_link_preview(post_id):
    """
    Extract first URL from post content and fetch OG tags.
    """
    try:
        post = Post.objects.get(id=post_id)
        
        # Find URL
        url_pattern = re.compile(r'https?://\S+')
        match = url_pattern.search(post.content)
        if not match:
            return
            
        url = match.group(0)
        
        # Check if preview already exists
        if LinkPreview.objects.filter(post=post, url=url).exists():
            return

        # Fetch URL
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; AcadWorldBot/1.0)'}
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        title = soup.find("meta", property="og:title")
        description = soup.find("meta", property="og:description")
        image = soup.find("meta", property="og:image")
        
        title = title["content"] if title else soup.title.string if soup.title else ""
        description = description["content"] if description else ""
        image_url = image["content"] if image else ""
        
        if title or description or image_url:
            LinkPreview.objects.create(
                post=post,
                url=url,
                title=title[:255],
                description=description,
                image_url=image_url[:500]
            )
            
    except Exception as e:
        print(f"Error fetching link preview for {post_id}: {e}")
