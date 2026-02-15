"""
Institution Models for AcadWorld
Public pages for Schools, Colleges, Universities with alumni tracking.
Uses UUIDs as primary keys for IDOR protection.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from config.sanitizers import sanitize_html


class Institution(models.Model):
    """
    Master Institution Profile (Brand/Legal Entity)
    One record per legal/brand entity.
    """
    
    # Institution Type
    INSTITUTION_TYPES = [
        ('SCHOOL', 'School'),
        ('COLLEGE', 'College'),
        ('UNIVERSITY', 'University'),
        ('COACHING', 'Coaching Institute'),
        ('TRAINING', 'Training Institute'),
        ('EDTECH', 'EdTech Company'),
        ('NGO', 'NGO'),
        ('CORPORATE', 'Corporate Training'),
        ('RESEARCH', 'Research Institute'),
        ('OTHER', 'Other'),
    ]

    SUB_TYPES = [
        ('CBSE', 'CBSE School'),
        ('ICSE', 'ICSE School'),
        ('IB', 'IB School'),
        ('IGCSE', 'IGCSE School'),
        ('STATE', 'State Board School'),
        ('IIT_JEE', 'IIT JEE Coaching'),
        ('NEET', 'NEET Coaching'),
        ('SKILL', 'Skill Training'),
        ('LANGUAGE', 'Language Institute'),
        ('OTHER', 'Other'),
    ]
    
    # Ownership Type
    OWNERSHIP_TYPES = [
        ('PRIVATE', 'Private'),
        ('GOVT', 'Government'),
        ('TRUST', 'Trust'),
        ('SOCIETY', 'Society'),
        ('CORPORATE', 'Corporate'),
        ('PPP', 'Public-Private Partnership'),
    ]

    # Verification Status
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('VERIFIED', 'Verified'),
        ('PREMIUM', 'Premium Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    # UUID Primary Key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # A. Basic Identity
    name = models.CharField(max_length=200, help_text="Legal Name")
    brand_name = models.CharField(max_length=200, blank=True, help_text="Display Name / Brand Name")
    slug = models.SlugField(unique=True, max_length=220)
    institution_type = models.CharField(max_length=20, choices=INSTITUTION_TYPES, default='SCHOOL')
    sub_type = models.CharField(max_length=50, choices=SUB_TYPES, blank=True)
    
    establishment_year = models.PositiveIntegerField(null=True, blank=True)
    ownership_type = models.CharField(max_length=20, choices=OWNERSHIP_TYPES, default='PRIVATE')
    
    # Registration Details (Private)
    registration_number = models.CharField(max_length=100, blank=True)
    pan_number = models.CharField(max_length=20, blank=True, help_text="PAN/CIN/Trust Reg No (Private)")

    # B. Branding
    logo = models.ImageField(upload_to='institutions/logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='institutions/covers/', blank=True, null=True)
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    vision_mission = models.TextField(blank=True, help_text="Vision & Mission Statement")
    
    # C. Digital Presence
    website = models.URLField(blank=True)
    portal_link = models.URLField(blank=True, help_text="LMS/Portal Link")
    has_app = models.BooleanField(default=False)
    
    # Social Links (JsonField for flexibility)
    social_links = models.JSONField(default=dict, blank=True, help_text='{"linkedin": "url", "facebook": "url", ...}')
    
    # D. Contact (Head Office)
    address = models.TextField(blank=True, help_text="Registered Address")
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10, blank=True)
    google_maps_link = models.URLField(blank=True)
    
    official_email = models.EmailField(blank=True)
    official_phone = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    
    # Point of Contact
    poc_name = models.CharField(max_length=100, blank=True)
    poc_designation = models.CharField(max_length=100, blank=True)
    poc_email = models.EmailField(blank=True)
    poc_phone = models.CharField(max_length=20, blank=True)

    # 6. Commercial & Engagement (Private/Internal)
    fee_range = models.CharField(
        max_length=20, 
        choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('PREMIUM', 'Premium')],
        blank=True
    )
    is_scholarship_available = models.BooleanField(default=False)
    is_corporate_training_available = models.BooleanField(default=False)
    is_franchise_available = models.BooleanField(default=False)
    is_advertisement_interested = models.BooleanField(default=False)
    vendor_requirements = models.TextField(blank=True)
    
    # 7. Platform Specific Intelligence
    profile_completion_percentage = models.PositiveIntegerField(default=0)
    engagement_score = models.PositiveIntegerField(default=0) # Internal score
    lead_potential_score = models.PositiveIntegerField(default=0)
    data_source = models.CharField(
        max_length=20, 
        choices=[('SELF', 'Self Registered'), ('SURVEY', 'Survey'), ('WEB', 'Web Scraped'), ('PARTNER', 'Partner')],
        default='SELF'
    )
    
    # 8. Custom Tags
    keywords = models.TextField(blank=True, help_text="Search keywords")
    usp = models.TextField(blank=True, help_text="Unique Selling Proposition")
    usp = models.TextField(blank=True, help_text="Unique Selling Proposition")
    collaboration_interests = models.TextField(blank=True)

    # Hiring Status
    is_hiring = models.BooleanField(default=False)
    
    # Notable Alumni (M2M with actual user profiles)
    notable_alumni = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='notable_at_institutions',
        blank=True,
        help_text='Link to actual user profiles as notable alumni'
    )

    # Relations
    admins = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='administered_institutions', blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_institutions')
    followers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='following_institutions', blank=True)
    
    # Verification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verified_domain = models.CharField(max_length=100, blank=True)
    verification_notes = models.TextField(blank=True)
    last_updated_date = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'institutions'
        ordering = ['name']
        verbose_name = 'Institution'
        verbose_name_plural = 'Institutions'

    def __str__(self):
        return self.brand_name or self.name

    def save(self, *args, **kwargs):
        if self.description:
            self.description = sanitize_html(self.description)
        
        if not self.slug:
            base_slug = slugify(self.brand_name or self.name)
            slug = base_slug
            counter = 1
            while Institution.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_verified(self):
        return self.status == 'VERIFIED'


class InstitutionContact(models.Model):
    """
    Contact details for an Institution.
    OneToOne relationship with Institution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='contact_details'
    )
    
    # Contact Info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=200, blank=True)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10, blank=True)
    
    # Google Maps
    google_maps_embed_url = models.URLField(blank=True, help_text='Google Maps embed iframe URL')
    
    # Working Hours
    working_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='e.g., {"monday": "9:00 AM - 5:00 PM", "saturday": "Closed"}'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_contacts'
        verbose_name = 'Institution Contact'

    def __str__(self):
        return f"Contact - {self.institution.name}"


class InstitutionAcademic(models.Model):
    """
    Academic details for an Institution.
    Uses PostgreSQL ArrayField for multi-value fields.
    """
    TEACHING_MODES = [
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('HYBRID', 'Hybrid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='academic_details'
    )
    
    # Levels Offered (e.g., ["Pre-Primary", "Primary", "Secondary", "Higher Secondary"])
    levels_offered = models.JSONField(default=list, blank=True)
    
    # Streams (e.g., ["Science", "Commerce", "Arts", "Vocational"])
    streams = models.JSONField(default=list, blank=True)
    
    # Courses (e.g., ["B.Tech", "MBA", "B.Ed", "M.Ed"])
    courses = models.JSONField(default=list, blank=True)
    
    # Boards & Affiliations (e.g., ["CBSE", "ICSE", "IB", "IGCSE", "State Board"])
    boards_affiliations = models.JSONField(default=list, blank=True)
    
    # Medium of Instruction (e.g., ["English", "Hindi", "Regional"])
    medium_of_instruction = models.JSONField(default=list, blank=True)
    
    # Teaching Mode
    teaching_mode = models.CharField(
        max_length=20,
        choices=TEACHING_MODES,
        default='OFFLINE'
    )
    
    # Accreditation
    accreditation_body = models.CharField(max_length=200, blank=True)
    accreditation_grade = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_academics'
        verbose_name = 'Institution Academic'

    def __str__(self):
        return f"Academics - {self.institution.name}"


class InstitutionSocial(models.Model):
    """
    Social media links and documents for an Institution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(
        Institution,
        on_delete=models.CASCADE,
        related_name='social_details'
    )
    
    # Social Links
    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    
    # Documents
    brochure_pdf = models.FileField(upload_to='institutions/brochures/', blank=True, null=True)
    prospectus_pdf = models.FileField(upload_to='institutions/prospectus/', blank=True, null=True)
    
    # Video
    intro_video_url = models.URLField(blank=True, help_text='YouTube/Vimeo link')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_social'
        verbose_name = 'Institution Social'

    def __str__(self):
        return f"Social - {self.institution.name}"

class Campus(models.Model):
    """
    Physical Campus / Branch Details
    One Institution -> Many Campuses
    """
    CAMPUS_TYPES = [
        ('MAIN', 'Main Campus'),
        ('BRANCH', 'Branch'),
        ('FRANCHISE', 'Franchise'),
        ('STUDY_CENTER', 'Study Center'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('UPCOMING', 'Upcoming'),
        ('CLOSED', 'Closed'),
    ]

    LOCATION_TYPES = [
        ('URBAN', 'Urban'),
        ('SEMI_URBAN', 'Semi-Urban'),
        ('RURAL', 'Rural'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='campuses')
    
    # Identity
    name = models.CharField(max_length=200, help_text="e.g., 'North Campus' or 'Indore Branch'")
    code = models.CharField(max_length=50, blank=True, help_text="Campus Code / ID")
    campus_type = models.CharField(max_length=20, choices=CAMPUS_TYPES, default='MAIN')
    start_year = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Location
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=10)
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPES, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    head_name = models.CharField(max_length=100, blank=True)
    head_designation = models.CharField(max_length=100, blank=True)
    
    # Campus Academic Ops (Summary)
    student_capacity = models.PositiveIntegerField(default=0)
    current_student_strength = models.PositiveIntegerField(default=0)
    faculty_count = models.PositiveIntegerField(default=0)
    student_teacher_ratio = models.CharField(max_length=20, blank=True, help_text="e.g. 1:25")
    medium_of_instruction = models.CharField(max_length=100, blank=True) # Could be comma separated
    shift_details = models.CharField(max_length=100, blank=True, help_text="Morning/Evening/Multiple")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campuses'
        verbose_name = 'Campus'
        verbose_name_plural = 'Campuses'

    def __str__(self):
        return f"{self.name} - {self.institution.brand_name or self.institution.name}"


class InstitutionInfrastructure(models.Model):
    """
    Infrastructure details linked to a specific Campus.
    Refactored to link to Campus instead of Institution.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campus = models.OneToOneField(Campus, on_delete=models.CASCADE, related_name='infrastructure')
    
    # Area
    campus_area = models.CharField(max_length=100, blank=True, help_text='e.g., "10 acres"')
    
    # Facilities (Boolean toggles)
    has_library = models.BooleanField(default=False)
    has_computer_lab = models.BooleanField(default=False)
    has_science_lab = models.BooleanField(default=False)
    has_sports_facility = models.BooleanField(default=False)
    has_playground = models.BooleanField(default=False)
    has_auditorium = models.BooleanField(default=False)
    has_cafeteria = models.BooleanField(default=False)
    has_hostel = models.BooleanField(default=False)
    hostel_type = models.CharField(
        max_length=20, 
        choices=[('BOYS', 'Boys'), ('GIRLS', 'Girls'), ('BOTH', 'Both'), ('NONE', 'None')], 
        default='NONE'
    )
    has_transport = models.BooleanField(default=False)
    has_smart_class = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)
    has_air_conditioning = models.BooleanField(default=False)
    
    total_classrooms = models.PositiveIntegerField(default=0)
    total_labs = models.PositiveIntegerField(default=0)

    other_facilities = models.TextField(blank=True)

    class Meta:
        db_table = 'institution_infrastructure'

    def __str__(self):
        return f"Infra - {self.campus.name}"


class Course(models.Model):
    """
    Courses Offered by the Institution.
    Can be linked to specific campuses via ManyToMany.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='courses')
    campuses = models.ManyToManyField(Campus, related_name='courses_offered', blank=True)
    
    name = models.CharField(max_length=200)
    level = models.CharField(max_length=100, blank=True, help_text="UG, PG, Diploma, etc.")
    stream = models.CharField(max_length=100, blank=True, help_text="Science, Commerce, Arts, etc.")
    duration = models.CharField(max_length=50, blank=True, help_text="e.g. 4 Years")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'institution_courses'

    def __str__(self):
        return self.name


class Accreditation(models.Model):
    """
    Compliance and Accreditation Details
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='accreditations')
    
    authority_name = models.CharField(max_length=200, help_text="NBA, NAAC, AICTE, etc.")
    grade = models.CharField(max_length=50, blank=True)
    accreditation_year = models.PositiveIntegerField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    doc_link = models.URLField(blank=True, help_text="Link to certificate")

    class Meta:
        db_table = 'institution_accreditations'

    def __str__(self):
        return f"{self.authority_name} - {self.institution.name}"


class InstitutionStats(models.Model):
    """
    Student & Alumni Metrics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.OneToOneField(Institution, on_delete=models.CASCADE, related_name='stats')
    
    avg_annual_admissions = models.PositiveIntegerField(default=0)
    pass_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    placement_assistance = models.BooleanField(default=False)
    placement_partners = models.TextField(blank=True, help_text="Comma separated")
    top_recruiters = models.TextField(blank=True)
    alumni_count_manual = models.PositiveIntegerField(default=0, help_text="Manually entered count if needed")
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_stats'


class InstitutionReview(models.Model):
    """
    Reviews/Testimonials (Kept as is, just updated related_name if needed)
    """
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='institution_reviews')
    
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    relationship = models.CharField(
        max_length=50,
        choices=[('STUDENT', 'Student'), ('ALUMNI', 'Alumni'), ('PARENT', 'Parent'), ('TEACHER', 'Teacher'), ('OTHER', 'Other')],
        default='STUDENT'
    )
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institution_reviews'
        ordering = ['-created_at']
        unique_together = ['institution', 'reviewer']

    def __str__(self):
        return f"{self.rating}★ - {self.institution.name}"


