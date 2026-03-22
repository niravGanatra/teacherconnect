from django.core.management.base import BaseCommand
from acadservices.models import ServiceCategory
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seeds initial Service Categories for AcadServices'

    def handle(self, *args, **kwargs):
        categories = [
            {'name': 'Curriculum Design', 'icon': 'book-open', 'desc': 'Design and structure impactful courses'},
            {'name': 'Subject Tutoring', 'icon': 'graduation-cap', 'desc': 'Personalized tutoring in specific subjects'},
            {'name': 'Exam Coaching', 'icon': 'award', 'desc': 'Preparation for academic or competitive exams'},
            {'name': 'Academic Consulting', 'icon': 'lightbulb', 'desc': 'Guidance on academic paths and institution strategy'},
            {'name': 'Content Creation', 'icon': 'file-text', 'desc': 'Creation of study materials and assessments'},
            {'name': 'Teacher Training', 'icon': 'users', 'desc': 'Professional development for educators'},
            {'name': 'Research Assistance', 'icon': 'search', 'desc': 'Support with data collection and literature reviews'},
            {'name': 'Language Coaching', 'icon': 'message-circle', 'desc': 'Fluency and linguistic training'},
            {'name': 'Special Education', 'icon': 'heart', 'desc': 'Tailored support for special needs students'},
            {'name': 'Digital Learning Design', 'icon': 'laptop', 'desc': 'E-learning and instructional technology integration'},
        ]

        count = 0
        for cat in categories:
            obj, created = ServiceCategory.objects.get_or_create(
                slug=slugify(cat['name']),
                defaults={
                    'name': cat['name'],
                    'icon': cat['icon'],
                    'description': cat['desc']
                }
            )
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} Service Categories.'))
