"""
Management command to seed dummy educator users for testing AcadConnect suggestions.
Usage: python manage.py seed_acadconnect
       python manage.py seed_acadconnect --clear   (removes previously seeded users first)
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

SEED_PASSWORD = "Test@1234"
SEED_TAG = "seed_acadconnect"

EDUCATORS = [
    {
        "email": "priya.sharma@seed.test",
        "username": "priya_sharma_seed",
        "first_name": "Priya",
        "last_name": "Sharma",
        "headline": "Post Graduate Teacher (PGT)",
        "current_role": "PGT",
        "current_institution_name": "Delhi Public School",
        "expert_subjects": ["Mathematics", "Physics"],
        "city": "New Delhi",
        "state": "Delhi",
        "experience_years": 8,
    },
    {
        "email": "arjun.mehta@seed.test",
        "username": "arjun_mehta_seed",
        "first_name": "Arjun",
        "last_name": "Mehta",
        "headline": "Professor",
        "current_role": "PROFESSOR",
        "current_institution_name": "IIT Bombay",
        "expert_subjects": ["Computer Science", "Mathematics"],
        "city": "Mumbai",
        "state": "Maharashtra",
        "experience_years": 15,
    },
    {
        "email": "sunita.patel@seed.test",
        "username": "sunita_patel_seed",
        "first_name": "Sunita",
        "last_name": "Patel",
        "headline": "Primary Teacher (PRT)",
        "current_role": "PRT",
        "current_institution_name": "Ryan International School",
        "expert_subjects": ["English", "Social Studies"],
        "city": "Ahmedabad",
        "state": "Gujarat",
        "experience_years": 5,
    },
    {
        "email": "ravi.kumar@seed.test",
        "username": "ravi_kumar_seed",
        "first_name": "Ravi",
        "last_name": "Kumar",
        "headline": "Head of Department",
        "current_role": "HOD",
        "current_institution_name": "Kendriya Vidyalaya",
        "expert_subjects": ["Chemistry", "Biology"],
        "city": "Bangalore",
        "state": "Karnataka",
        "experience_years": 12,
    },
    {
        "email": "neha.singh@seed.test",
        "username": "neha_singh_seed",
        "first_name": "Neha",
        "last_name": "Singh",
        "headline": "Lecturer",
        "current_role": "LECTURER",
        "current_institution_name": "Amity University",
        "expert_subjects": ["Economics", "Commerce"],
        "city": "Noida",
        "state": "Uttar Pradesh",
        "experience_years": 6,
    },
    {
        "email": "vikram.nair@seed.test",
        "username": "vikram_nair_seed",
        "first_name": "Vikram",
        "last_name": "Nair",
        "headline": "Trained Graduate Teacher (TGT)",
        "current_role": "TGT",
        "current_institution_name": "St. Xavier's School",
        "expert_subjects": ["History", "Geography"],
        "city": "Kochi",
        "state": "Kerala",
        "experience_years": 9,
    },
    {
        "email": "ananya.reddy@seed.test",
        "username": "ananya_reddy_seed",
        "first_name": "Ananya",
        "last_name": "Reddy",
        "headline": "Academic Coordinator",
        "current_role": "COORDINATOR",
        "current_institution_name": "Narayana School",
        "expert_subjects": ["Biology", "Chemistry"],
        "city": "Hyderabad",
        "state": "Telangana",
        "experience_years": 11,
    },
    {
        "email": "mohit.joshi@seed.test",
        "username": "mohit_joshi_seed",
        "first_name": "Mohit",
        "last_name": "Joshi",
        "headline": "Corporate Trainer",
        "current_role": "TRAINER",
        "current_institution_name": "Infosys BPM",
        "expert_subjects": ["Computer Science"],
        "city": "Pune",
        "state": "Maharashtra",
        "experience_years": 7,
    },
    {
        "email": "kavita.iyer@seed.test",
        "username": "kavita_iyer_seed",
        "first_name": "Kavita",
        "last_name": "Iyer",
        "headline": "Principal/Vice Principal",
        "current_role": "PRINCIPAL",
        "current_institution_name": "Bishop Cotton School",
        "expert_subjects": ["English", "Hindi"],
        "city": "Shimla",
        "state": "Himachal Pradesh",
        "experience_years": 20,
    },
    {
        "email": "deepak.verma@seed.test",
        "username": "deepak_verma_seed",
        "first_name": "Deepak",
        "last_name": "Verma",
        "headline": "Counselor",
        "current_role": "COUNSELOR",
        "current_institution_name": "Shri Ram College",
        "expert_subjects": ["Psychology", "Sociology"],
        "city": "Chandigarh",
        "state": "Punjab",
        "experience_years": 4,
    },
    {
        "email": "meena.pillai@seed.test",
        "username": "meena_pillai_seed",
        "first_name": "Meena",
        "last_name": "Pillai",
        "headline": "Post Graduate Teacher (PGT)",
        "current_role": "PGT",
        "current_institution_name": "Army Public School",
        "expert_subjects": ["Political Science", "Economics"],
        "city": "Chennai",
        "state": "Tamil Nadu",
        "experience_years": 13,
    },
    {
        "email": "suresh.bansal@seed.test",
        "username": "suresh_bansal_seed",
        "first_name": "Suresh",
        "last_name": "Bansal",
        "headline": "Lecturer",
        "current_role": "LECTURER",
        "current_institution_name": "Rajasthan University",
        "expert_subjects": ["Accountancy", "Business Studies"],
        "city": "Jaipur",
        "state": "Rajasthan",
        "experience_years": 10,
    },
]


class Command(BaseCommand):
    help = "Seed dummy educator users for testing AcadConnect suggestions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded users before re-seeding",
        )

    def handle(self, *args, **options):
        from profiles.models import EducatorProfile

        if options["clear"]:
            deleted_count, _ = User.objects.filter(
                email__endswith="@seed.test"
            ).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted_count} previously seeded records."))

        created = 0
        skipped = 0

        for data in EDUCATORS:
            if User.objects.filter(email=data["email"]).exists():
                skipped += 1
                self.stdout.write(f"  Skipping (exists): {data['email']}")
                continue

            user = User.objects.create_user(
                email=data["email"],
                username=data["username"],
                password=SEED_PASSWORD,
                user_type="EDUCATOR",
                is_verified=True,
                is_active=True,
            )

            profile, _ = EducatorProfile.objects.get_or_create(user=user)
            profile.first_name = data["first_name"]
            profile.last_name = data["last_name"]
            profile.current_role = data["current_role"]
            profile.current_institution_name = data["current_institution_name"]
            profile.expert_subjects = data["expert_subjects"]
            profile.city = data["city"]
            profile.state = data["state"]
            profile.experience_years = data["experience_years"]
            profile.availability = "AVAILABLE"
            profile.save()

            created += 1
            self.stdout.write(self.style.SUCCESS(f"  Created: {data['first_name']} {data['last_name']} ({data['email']})"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Done! Created {created} users, skipped {skipped}. "
            f"Password for all: {SEED_PASSWORD}"
        ))
