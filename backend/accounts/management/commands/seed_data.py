"""
Django management command to seed the database with realistic test data.
Run with: python manage.py seed_data
"""
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from profiles.models import TeacherProfile, InstitutionProfile
from jobs.models import JobListing, Application, ApplicationSnapshot, SavedJob
from feed.models import Post, Comment, Like, Follow
from events.models import Event, EventAttendee

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with realistic test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))

        self.stdout.write('Seeding database with test data...')
        
        # Create test users and profiles
        teachers = self.create_teachers()
        institutions = self.create_institutions()
        
        # Create content
        jobs = self.create_jobs(institutions)
        self.create_applications(teachers, jobs)
        self.create_saved_jobs(teachers, jobs)
        
        # Social features
        self.create_follows(teachers)
        posts = self.create_posts(teachers + institutions)
        self.create_comments_and_likes(posts, teachers)
        
        # Events
        self.create_events(teachers + institutions)
        
        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('=' * 50)
        self.stdout.write('TEST LOGIN CREDENTIALS:')
        self.stdout.write('=' * 50)
        self.stdout.write('')
        self.stdout.write('TEACHER ACCOUNTS:')
        self.stdout.write('  Email: priya.sharma@email.com')
        self.stdout.write('  Password: teacher123')
        self.stdout.write('')
        self.stdout.write('  Email: rahul.kumar@email.com')
        self.stdout.write('  Password: teacher123')
        self.stdout.write('')
        self.stdout.write('INSTITUTION ACCOUNTS:')
        self.stdout.write('  Email: admin@delhipublic.edu')
        self.stdout.write('  Password: institution123')
        self.stdout.write('')
        self.stdout.write('  Email: admin@stxaviers.edu')
        self.stdout.write('  Password: institution123')
        self.stdout.write('=' * 50)

    def create_teachers(self):
        """Create teacher users with profiles"""
        teachers_data = [
            {
                'email': 'priya.sharma@email.com',
                'username': 'priya_sharma',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'headline': 'Senior Mathematics Teacher | 10+ Years Experience | IIT Delhi',
                'bio': 'Passionate educator with over a decade of experience teaching Mathematics at the senior secondary level. Specialized in preparing students for JEE and board examinations. Published author of "Making Math Fun" workbook series.',
                'subjects': ['Mathematics', 'Physics', 'Statistics'],
                'skills': ['Classroom Management', 'Curriculum Development', 'EdTech Tools', 'Student Mentoring'],
                'experience_years': 12,
                'city': 'New Delhi',
                'state': 'Delhi',
                'current_school': 'Sacred Heart Convent School',
                'education': [
                    {'degree': 'M.Sc Mathematics', 'institution': 'IIT Delhi', 'year': 2012},
                    {'degree': 'B.Ed', 'institution': 'Delhi University', 'year': 2013},
                ],
            },
            {
                'email': 'rahul.kumar@email.com',
                'username': 'rahul_kumar',
                'first_name': 'Rahul',
                'last_name': 'Kumar',
                'headline': 'English Literature Teacher | Cambridge Certified | IELTS Trainer',
                'bio': 'Creative educator specializing in English Literature and Language. Cambridge CELTA certified with expertise in preparing students for IELTS, TOEFL, and competitive exams. Love for Shakespeare and modern poetry.',
                'subjects': ['English', 'Literature', 'Creative Writing'],
                'skills': ['Public Speaking', 'Drama Direction', 'Content Writing', 'Debate Coaching'],
                'experience_years': 8,
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'current_school': 'Ryan International School',
                'education': [
                    {'degree': 'M.A English Literature', 'institution': 'Mumbai University', 'year': 2015},
                    {'degree': 'CELTA', 'institution': 'Cambridge', 'year': 2016},
                ],
            },
            {
                'email': 'ananya.gupta@email.com',
                'username': 'ananya_gupta',
                'first_name': 'Ananya',
                'last_name': 'Gupta',
                'headline': 'Science Educator | CBSE Board Expert | Lab Coordinator',
                'bio': 'Dedicated science teacher with hands-on teaching approach. Experienced in setting up and managing school laboratories. Focused on making science concepts relatable through practical experiments.',
                'subjects': ['Physics', 'Chemistry', 'Environmental Science'],
                'skills': ['Laboratory Management', 'Science Fair Coordination', 'STEM Education', 'Research'],
                'experience_years': 6,
                'city': 'Bangalore',
                'state': 'Karnataka',
                'current_school': 'National Public School',
                'education': [
                    {'degree': 'M.Sc Physics', 'institution': 'IISc Bangalore', 'year': 2018},
                    {'degree': 'B.Ed', 'institution': 'Bangalore University', 'year': 2019},
                ],
            },
            {
                'email': 'vikram.singh@email.com',
                'username': 'vikram_singh',
                'first_name': 'Vikram',
                'last_name': 'Singh',
                'headline': 'History & Social Studies Teacher | Author | Educational Consultant',
                'bio': 'History enthusiast turned educator. Author of "India Through Ages" - a supplementary textbook adopted by 50+ schools. Consultant for NCERT curriculum development.',
                'subjects': ['History', 'Political Science', 'Geography'],
                'skills': ['Curriculum Design', 'Educational Writing', 'Field Trips', 'Museum Education'],
                'experience_years': 15,
                'city': 'Jaipur',
                'state': 'Rajasthan',
                'current_school': 'Mayo College',
                'education': [
                    {'degree': 'Ph.D History', 'institution': 'JNU Delhi', 'year': 2010},
                    {'degree': 'B.Ed', 'institution': 'Rajasthan University', 'year': 2008},
                ],
            },
            {
                'email': 'meera.nair@email.com',
                'username': 'meera_nair',
                'first_name': 'Meera',
                'last_name': 'Nair',
                'headline': 'Computer Science Teacher | Python Expert | Robotics Club Advisor',
                'bio': 'Former software developer turned educator. Bringing real-world coding experience to the classroom. Founded school robotics club that won 3 national championships.',
                'subjects': ['Computer Science', 'Information Technology', 'AI/ML'],
                'skills': ['Python', 'Java', 'Robotics', 'Web Development', 'Machine Learning'],
                'experience_years': 5,
                'city': 'Hyderabad',
                'state': 'Telangana',
                'current_school': 'Oakridge International',
                'education': [
                    {'degree': 'M.Tech Computer Science', 'institution': 'IIIT Hyderabad', 'year': 2019},
                    {'degree': 'B.Ed', 'institution': 'Osmania University', 'year': 2020},
                ],
            },
            {
                'email': 'amit.verma@email.com',
                'username': 'amit_verma',
                'first_name': 'Amit',
                'last_name': 'Verma',
                'headline': 'Economics Teacher | CA | Financial Literacy Advocate',
                'bio': 'Chartered Accountant with passion for teaching economics and financial literacy. Believe in practical learning through stock market simulations and business case studies.',
                'subjects': ['Economics', 'Business Studies', 'Accountancy'],
                'skills': ['Financial Analysis', 'Case Study Method', 'Stock Market Education', 'Entrepreneurship'],
                'experience_years': 7,
                'city': 'Pune',
                'state': 'Maharashtra',
                'current_school': 'Symbiosis International School',
                'education': [
                    {'degree': 'CA', 'institution': 'ICAI', 'year': 2016},
                    {'degree': 'MBA Finance', 'institution': 'IIM Indore', 'year': 2018},
                ],
            },
        ]

        teachers = []
        for data in teachers_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'user_type': 'TEACHER',
                    'is_verified': True,
                }
            )
            if created:
                user.set_password('teacher123')
                user.save()
            
            profile, _ = TeacherProfile.objects.get_or_create(
                user=user,
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'headline': data['headline'],
                    'bio': data['bio'],
                    'subjects': data['subjects'],
                    'skills': data['skills'],
                    'experience_years': data['experience_years'],
                    'city': data['city'],
                    'state': data['state'],
                    'current_school': data['current_school'],
                    'education': data['education'],
                    'is_searchable': True,
                    'contact_visible': random.choice([True, False]),
                }
            )
            teachers.append(user)
            self.stdout.write(f'  Created teacher: {data["first_name"]} {data["last_name"]}')

        return teachers

    def create_institutions(self):
        """Create institution users with profiles"""
        institutions_data = [
            {
                'email': 'admin@delhipublic.edu',
                'username': 'delhi_public_school',
                'institution_name': 'Delhi Public School',
                'institution_type': 'SCHOOL',
                'description': 'One of India\'s premier educational institutions with a legacy of excellence spanning over 70 years. Affiliated to CBSE with world-class infrastructure and a commitment to holistic education.',
                'campus_address': 'Mathura Road, New Delhi',
                'city': 'New Delhi',
                'state': 'Delhi',
                'pincode': '110025',
                'contact_email': 'admissions@delhipublic.edu',
                'contact_phone': '+91-11-26852456',
                'website_url': 'https://www.dpsdelhi.edu',
                'established_year': 1949,
                'student_count': 12000,
                'is_verified': True,
            },
            {
                'email': 'admin@stxaviers.edu',
                'username': 'st_xaviers_mumbai',
                'institution_name': 'St. Xavier\'s College',
                'institution_type': 'COLLEGE',
                'description': 'A premier Jesuit institution established in 1869, known for academic excellence and value-based education. Autonomous college affiliated to University of Mumbai with NAAC A++ accreditation.',
                'campus_address': 'Mahapalika Marg, CST',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
                'contact_email': 'principal@xaviers.edu',
                'contact_phone': '+91-22-22620661',
                'website_url': 'https://www.xaviers.edu',
                'established_year': 1869,
                'student_count': 8000,
                'is_verified': True,
            },
            {
                'email': 'admin@bitsacademy.edu',
                'username': 'bits_academy',
                'institution_name': 'BITS Academy',
                'institution_type': 'COACHING',
                'description': 'Leading coaching institute for JEE, NEET, and foundation courses. 15+ years of excellence with over 500 IITians produced. Known for personalized attention and innovative teaching methods.',
                'campus_address': 'Kalu Sarai, Near IIT Delhi',
                'city': 'New Delhi',
                'state': 'Delhi',
                'pincode': '110016',
                'contact_email': 'info@bitsacademy.edu',
                'contact_phone': '+91-11-40568900',
                'website_url': 'https://www.bitsacademy.edu',
                'established_year': 2008,
                'student_count': 5000,
                'is_verified': True,
            },
            {
                'email': 'admin@bangalore.edu',
                'username': 'bangalore_intl_school',
                'institution_name': 'Bangalore International School',
                'institution_type': 'SCHOOL',
                'description': 'IB World School offering PYP, MYP, and DP programs. Focus on international curriculum with Indian values. State-of-the-art campus with sports facilities, performing arts center, and innovation lab.',
                'campus_address': 'Geddalahalli, Hennur Bagalur Road',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'pincode': '560077',
                'contact_email': 'admissions@bangaloreinternational.edu',
                'contact_phone': '+91-80-28465060',
                'website_url': 'https://www.bangaloreinternational.edu',
                'established_year': 2000,
                'student_count': 3500,
                'is_verified': True,
            },
            {
                'email': 'admin@jnvu.edu',
                'username': 'jnvu_jodhpur',
                'institution_name': 'Jai Narain Vyas University',
                'institution_type': 'UNIVERSITY',
                'description': 'One of the oldest universities in Rajasthan, established by the Government of Rajasthan. Offers undergraduate, postgraduate, and doctoral programs across multiple disciplines.',
                'campus_address': 'Old University Campus',
                'city': 'Jodhpur',
                'state': 'Rajasthan',
                'pincode': '342001',
                'contact_email': 'registrar@jnvu.edu.in',
                'contact_phone': '+91-291-2649730',
                'website_url': 'https://www.jnvu.edu.in',
                'established_year': 1962,
                'student_count': 25000,
                'is_verified': False,  # Pending verification
            },
        ]

        institutions = []
        for data in institutions_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'user_type': 'INSTITUTION',
                    'is_verified': data['is_verified'],
                }
            )
            if created:
                user.set_password('institution123')
                user.save()
            
            profile, _ = InstitutionProfile.objects.get_or_create(
                user=user,
                defaults={
                    'institution_name': data['institution_name'],
                    'institution_type': data['institution_type'],
                    'description': data['description'],
                    'campus_address': data['campus_address'],
                    'city': data['city'],
                    'state': data['state'],
                    'pincode': data['pincode'],
                    'contact_email': data['contact_email'],
                    'contact_phone': data['contact_phone'],
                    'website_url': data['website_url'],
                    'established_year': data['established_year'],
                    'student_count': data['student_count'],
                    'is_verified': data['is_verified'],
                }
            )
            institutions.append(user)
            self.stdout.write(f'  Created institution: {data["institution_name"]}')

        return institutions

    def create_jobs(self, institutions):
        """Create job listings"""
        jobs_data = [
            {
                'title': 'Senior Mathematics Teacher',
                'description': '''We are looking for an experienced Mathematics teacher to join our prestigious institution. 

Responsibilities:
• Teach Mathematics to senior secondary students (Classes 11-12)
• Prepare students for CBSE Board examinations and competitive exams
• Develop innovative teaching methodologies
• Mentor students for JEE preparation
• Conduct regular assessments and parent-teacher meetings

Requirements:
• M.Sc in Mathematics from a recognized university
• B.Ed is mandatory
• Minimum 5 years of teaching experience
• Strong command over English
• Familiarity with NCF guidelines''',
                'required_subjects': ['Mathematics', 'Applied Mathematics'],
                'required_experience_years': 5,
                'required_qualifications': ['M.Sc Mathematics', 'B.Ed'],
                'required_skills': ['Board Exam Preparation', 'JEE Coaching', 'Classroom Management'],
                'job_type': 'FULL_TIME',
                'salary_min': 60000,
                'salary_max': 90000,
                'location': 'New Delhi',
                'is_remote': False,
            },
            {
                'title': 'English Literature Teacher (PGT)',
                'description': '''Join our dynamic faculty as a Post Graduate Teacher in English Literature.

We need a passionate educator who can bring literature to life for our students.

What we offer:
• Competitive salary package
• Medical insurance for family
• Professional development opportunities
• Sabbatical after 5 years

Requirements:
• Master's degree in English Literature
• Minimum 3 years teaching experience
• Cambridge/IELTS certification preferred''',
                'required_subjects': ['English', 'Literature'],
                'required_experience_years': 3,
                'required_qualifications': ['M.A English', 'B.Ed'],
                'required_skills': ['Public Speaking', 'Creative Writing', 'Student Counseling'],
                'job_type': 'FULL_TIME',
                'salary_min': 50000,
                'salary_max': 75000,
                'location': 'Mumbai',
                'is_remote': False,
            },
            {
                'title': 'Physics Faculty - JEE/NEET',
                'description': '''BITS Academy is expanding! We need top-notch Physics faculty for our JEE/NEET batches.

If you can make Physics exciting and help students crack the toughest exams, we want you!

Perks:
• Industry-best compensation (based on results)
• Flexible timings
• Performance bonuses
• Study material development royalties

Who we're looking for:
• IIT/NIT graduates preferred
• Proven track record in JEE/NEET coaching
• Minimum 2 years coaching experience''',
                'required_subjects': ['Physics'],
                'required_experience_years': 2,
                'required_qualifications': ['B.Tech/M.Sc Physics'],
                'required_skills': ['JEE Coaching', 'Problem Solving', 'Doubt Clearing'],
                'job_type': 'PART_TIME',
                'salary_min': 80000,
                'salary_max': 150000,
                'location': 'New Delhi',
                'is_remote': False,
            },
            {
                'title': 'IB Computer Science Teacher',
                'description': '''Bangalore International School is hiring IB Computer Science teachers for MYP and DP programs.

This is an exciting opportunity to work with motivated students in a truly international environment.

What you'll do:
• Teach Computer Science for IB MYP (Grades 6-10) and IB DP (Grades 11-12)
• Develop Technology curriculum
• Lead robotics and coding clubs
• Mentor students for IA and EE

What we need:
• B.Tech/M.Tech in Computer Science
• IB teaching experience (minimum 2 years)
• Knowledge of Python, Java, and web technologies
• Passion for innovation and technology''',
                'required_subjects': ['Computer Science', 'Information Technology'],
                'required_experience_years': 2,
                'required_qualifications': ['B.Tech Computer Science', 'IB Training Certificate'],
                'required_skills': ['Python', 'Java', 'Robotics', 'IB Curriculum'],
                'job_type': 'FULL_TIME',
                'salary_min': 70000,
                'salary_max': 100000,
                'location': 'Bangalore',
                'is_remote': False,
            },
            {
                'title': 'Online Economics Tutor',
                'description': '''Looking for part-time online tutors for Economics (Class 11-12, CBSE/ISC).

Work from the comfort of your home!

Requirements:
• Master's degree in Economics
• Stable internet connection
• Good communication skills
• Flexible to work in evening hours

This is a work-from-home position with flexible hours.''',
                'required_subjects': ['Economics', 'Business Studies'],
                'required_experience_years': 1,
                'required_qualifications': ['M.A Economics'],
                'required_skills': ['Online Teaching', 'Digital Tools', 'Economics'],
                'job_type': 'PART_TIME',
                'salary_min': 500,  # Per hour
                'salary_max': 1000,
                'location': 'Remote',
                'is_remote': True,
            },
            {
                'title': 'Primary School Teacher (All Subjects)',
                'description': '''We are looking for enthusiastic Primary Teachers who can teach multiple subjects to young learners.

The ideal candidate should love working with children and have creative teaching abilities.

Responsibilities:
• Teach English, Maths, EVS, and Hindi to Classes 1-5
• Create engaging lesson plans
• Organize activities and events
• Maintain positive classroom environment

Requirements:
• NTT/D.El.Ed/B.Ed with primary specialization
• Minimum 2 years experience with primary students
• Excellent communication skills
• Patient and nurturing attitude''',
                'required_subjects': ['English', 'Mathematics', 'EVS', 'Hindi'],
                'required_experience_years': 2,
                'required_qualifications': ['B.Ed', 'NTT', 'D.El.Ed'],
                'required_skills': ['Activity-Based Learning', 'Child Psychology', 'Storytelling'],
                'job_type': 'FULL_TIME',
                'salary_min': 35000,
                'salary_max': 50000,
                'location': 'New Delhi',
                'is_remote': False,
            },
            {
                'title': 'Chemistry Teacher (TGT)',
                'description': '''St. Xavier's College seeks a Trained Graduate Teacher for Chemistry.

Join our legacy of excellence!

We offer:
• Competitive pay
• Research opportunities
• Conference participation support
• Beautiful campus environment

Requirements:
• M.Sc Chemistry
• B.Ed mandatory
• 3+ years experience
• Lab management skills''',
                'required_subjects': ['Chemistry'],
                'required_experience_years': 3,
                'required_qualifications': ['M.Sc Chemistry', 'B.Ed'],
                'required_skills': ['Lab Management', 'Safety Protocols', 'Practical Training'],
                'job_type': 'FULL_TIME',
                'salary_min': 55000,
                'salary_max': 80000,
                'location': 'Mumbai',
                'is_remote': False,
            },
            {
                'title': 'History & Civics Teacher',
                'description': '''Seeking a passionate History teacher who can make the past come alive!

We need someone who can:
• Connect historical events to current affairs
• Organize heritage walks and museum visits
• Prepare students for humanities competitive exams
• Guide students in research projects

Join our team and inspire the next generation of historians and citizens!''',
                'required_subjects': ['History', 'Political Science', 'Geography'],
                'required_experience_years': 4,
                'required_qualifications': ['M.A History', 'B.Ed'],
                'required_skills': ['Research', 'Documentation', 'Field Trips', 'Public Speaking'],
                'job_type': 'FULL_TIME',
                'salary_min': 45000,
                'salary_max': 65000,
                'location': 'Jodhpur',
                'is_remote': False,
            },
        ]

        jobs = []
        for i, data in enumerate(jobs_data):
            # Assign jobs to institutions in round-robin
            institution = institutions[i % len(institutions)]
            
            job, created = JobListing.objects.get_or_create(
                institution=institution,
                title=data['title'],
                defaults={
                    'description': data['description'],
                    'required_subjects': data['required_subjects'],
                    'required_experience_years': data['required_experience_years'],
                    'required_qualifications': data['required_qualifications'],
                    'required_skills': data['required_skills'],
                    'job_type': data['job_type'],
                    'salary_min': data['salary_min'],
                    'salary_max': data['salary_max'],
                    'location': data['location'],
                    'is_remote': data['is_remote'],
                    'is_active': True,
                    'application_deadline': timezone.now().date() + timedelta(days=random.randint(14, 60)),
                }
            )
            jobs.append(job)
            if created:
                self.stdout.write(f'  Created job: {data["title"]}')

        return jobs

    def create_applications(self, teachers, jobs):
        """Create some applications"""
        statuses = ['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED']
        
        # Each teacher applies to 2-4 jobs
        for teacher in teachers:
            profile = teacher.teacher_profile
            sample_jobs = random.sample(jobs, min(random.randint(2, 4), len(jobs)))
            
            for job in sample_jobs:
                application, created = Application.objects.get_or_create(
                    teacher=teacher,
                    job=job,
                    defaults={
                        'cover_letter': f"Dear Hiring Manager,\n\nI am excited to apply for the {job.title} position. With {profile.experience_years} years of experience teaching {', '.join(profile.subjects[:2])}, I believe I would be a great fit for your team.\n\nI am particularly drawn to this opportunity because of the institution's reputation for excellence. My background in {profile.skills[0] if profile.skills else 'education'} aligns well with the requirements.\n\nPlease find my detailed profile attached. I look forward to discussing this opportunity.\n\nBest regards,\n{profile.full_name}",
                        'status': random.choice(statuses),
                    }
                )
                
                if created:
                    # Create snapshot
                    ApplicationSnapshot.create_from_profile(application, profile)
                    self.stdout.write(f'  Created application: {profile.full_name} -> {job.title}')

    def create_saved_jobs(self, teachers, jobs):
        """Teachers save some jobs"""
        for teacher in teachers:
            sample_jobs = random.sample(jobs, min(random.randint(1, 3), len(jobs)))
            for job in sample_jobs:
                SavedJob.objects.get_or_create(teacher=teacher, job=job)
        self.stdout.write('  Created saved jobs')

    def create_follows(self, teachers):
        """Create follow relationships between teachers"""
        for teacher in teachers:
            # Each teacher follows 2-4 other teachers
            others = [t for t in teachers if t != teacher]
            to_follow = random.sample(others, min(random.randint(2, 4), len(others)))
            
            for followed in to_follow:
                Follow.objects.get_or_create(follower=teacher, following=followed)
        
        self.stdout.write('  Created follow relationships')

    def create_posts(self, users):
        """Create feed posts"""
        posts_content = [
            "Just completed an amazing workshop on project-based learning! The future of education is interactive and student-centered. 🎓 #Teaching #Education",
            "Proud moment: Three of my students got selected for the National Science Olympiad! Hard work pays off. 🏆",
            "Looking for recommendations on the best EdTech tools for hybrid classrooms. What are you all using?",
            "NEP 2020 is bringing exciting changes to our curriculum. Attended a webinar today on competency-based education. Thoughts?",
            "Started a coding club at school and the response has been overwhelming! 50+ students signed up. The future is bright! 💻",
            "Reminder: The deadline for CBSE practical examination submissions is approaching. Make sure all your documentation is in order.",
            "Celebrating Teacher's Day with my wonderful students! Received the most heartwarming cards and letters. ❤️",
            "Anyone attending the EdTech Summit 2024 in Bangalore? Would love to connect and share ideas!",
            "Just published my research paper on 'Impact of Digital Learning Tools on Student Engagement'. Link in bio. 📚",
            "Board exam season is upon us. Sending positive vibes to all students and fellow teachers! You've got this! 💪",
            "Conducted a parent-teacher workshop on 'Managing Screen Time for Children'. Important topic in today's digital age.",
            "Excited to announce that our school's robotics team won the regional championship! 🤖🏆",
            "New semester, new opportunities! What innovative teaching methods are you trying this year?",
            "Just received my Cambridge certification! Grateful for the learning journey. #ProfessionalDevelopment",
            "Hiring alert: We're looking for passionate Math teachers. DM for details! Great opportunity for the right candidate.",
        ]

        posts = []
        for i, content in enumerate(posts_content):
            author = users[i % len(users)]
            post, created = Post.objects.get_or_create(
                author=author,
                content=content,
                defaults={
                    'created_at': timezone.now() - timedelta(days=random.randint(1, 30), hours=random.randint(1, 23)),
                }
            )
            posts.append(post)
            if created:
                self.stdout.write(f'  Created post by {author.username}')

        return posts

    def create_comments_and_likes(self, posts, teachers):
        """Add comments and likes to posts"""
        comments_content = [
            "This is so inspiring! Thanks for sharing.",
            "Congratulations! Well deserved.",
            "Would love to learn more about this. Can we connect?",
            "Great initiative! Keep up the good work.",
            "Very helpful information. Thank you!",
            "Sharing this with my colleagues.",
            "I've been thinking about the same thing!",
            "Excellent point. This needs more discussion.",
            "Can you share more details about this?",
            "This is exactly what I was looking for!",
        ]

        for post in posts:
            # Add 0-5 likes
            likers = random.sample(teachers, min(random.randint(0, 5), len(teachers)))
            for user in likers:
                Like.objects.get_or_create(user=user, post=post)
            
            # Add 0-3 comments
            commenters = random.sample(teachers, min(random.randint(0, 3), len(teachers)))
            for user in commenters:
                if user != post.author:
                    Comment.objects.get_or_create(
                        user=user,
                        post=post,
                        defaults={'content': random.choice(comments_content)}
                    )
        
        self.stdout.write('  Created comments and likes')

    def create_events(self, users):
        """Create events"""
        events_data = [
            {
                'title': 'Teaching with Technology Workshop',
                'description': 'A hands-on workshop exploring the latest EdTech tools for modern classrooms. Learn about interactive whiteboards, LMS platforms, and assessment tools.',
                'event_type': 'WORKSHOP',
                'is_online': True,
                'meeting_link': 'https://zoom.us/j/example',
                'max_attendees': 100,
            },
            {
                'title': 'NEP 2020 Implementation Strategies',
                'description': 'Seminar on practical implementation of National Education Policy 2020 in schools. Expert speakers from education ministry and leading institutions.',
                'event_type': 'SEMINAR',
                'is_online': False,
                'location': 'India Habitat Centre, New Delhi',
                'max_attendees': 200,
            },
            {
                'title': 'Teachers Networking Meetup - Mumbai',
                'description': 'Monthly networking event for teachers in Mumbai. Share experiences, discuss challenges, and build your professional network over coffee!',
                'event_type': 'MEETUP',
                'is_online': False,
                'location': 'Cafe Coffee Day, Bandra',
                'max_attendees': 30,
            },
            {
                'title': 'Child Psychology in Education Webinar',
                'description': 'Understanding child psychology for better teaching outcomes. Topics include learning disabilities, motivation, and emotional intelligence.',
                'event_type': 'WEBINAR',
                'is_online': True,
                'meeting_link': 'https://meet.google.com/example',
                'max_attendees': 500,
            },
            {
                'title': 'National Education Conference 2024',
                'description': 'Annual conference bringing together educators, policymakers, and EdTech leaders. Keynotes, panel discussions, and exhibition.',
                'event_type': 'CONFERENCE',
                'is_online': False,
                'location': 'Vigyan Bhawan, New Delhi',
                'max_attendees': 1000,
            },
            {
                'title': 'STEM Teaching Best Practices Workshop',
                'description': 'Learn innovative approaches to teaching Science, Technology, Engineering, and Mathematics. Hands-on activities and demonstrations.',
                'event_type': 'WORKSHOP',
                'is_online': True,
                'meeting_link': 'https://teams.microsoft.com/example',
                'max_attendees': 75,
            },
        ]

        events = []
        for i, data in enumerate(events_data):
            organizer = users[i % len(users)]
            start_date = timezone.now() + timedelta(days=random.randint(7, 60))
            
            event, created = Event.objects.get_or_create(
                title=data['title'],
                organizer=organizer,
                defaults={
                    'description': data['description'],
                    'event_type': data['event_type'],
                    'start_datetime': start_date,
                    'end_datetime': start_date + timedelta(hours=random.randint(2, 8)),
                    'is_online': data['is_online'],
                    'location': data.get('location', ''),
                    'meeting_link': data.get('meeting_link', ''),
                    'max_attendees': data.get('max_attendees'),
                }
            )
            events.append(event)
            
            if created:
                self.stdout.write(f'  Created event: {data["title"]}')
                
                # Add some attendees
                attendees = random.sample(users, min(random.randint(3, 10), len(users)))
                for user in attendees:
                    if user != organizer:
                        EventAttendee.objects.get_or_create(event=event, user=user)

        return events
