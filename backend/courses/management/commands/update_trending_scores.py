"""
Management command: python manage.py update_trending_scores

Recalculates trending_score for all published FDPs using:
  enrollment_count * 0.4 + bookmark_count * 0.3 + recency_score * 0.3

Recency decays over 30 days from created_at (published_at field absent).
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from courses.models import Course


class Command(BaseCommand):
    help = 'Recalculate trending_score for all published FDPs'

    def handle(self, *args, **options):
        now = timezone.now()
        qs = Course.objects.filter(is_published=True).prefetch_related(
            'enrollments', 'bookmarked_by'
        )
        updated = 0
        for fdp in qs:
            enrollment_count = fdp.enrollments.count()
            bookmark_count = fdp.bookmarked_by.count()
            days_since = (now - fdp.created_at).days
            recency_score = max(0.0, 1.0 - (days_since / 30.0))
            score = (
                enrollment_count * 0.4
                + bookmark_count * 0.3
                + recency_score * 0.3
            )
            Course.objects.filter(pk=fdp.pk).update(trending_score=score)
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(f'Updated trending_score for {updated} published FDP(s).')
        )
