# Generated manually to add new fields to existing teacher_profiles table
# This is a SAFE migration that only adds missing columns without data loss

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0002_institution_modular_models'),
        ('profiles', '0006_add_teacher_attributes'),
    ]

    operations = [
        # Add new columns to existing teacher_profiles table
        migrations.AddField(
            model_name='teacherprofile',
            name='current_role',
            field=models.CharField(blank=True, choices=[('PRT', 'Primary Teacher (PRT)'), ('TGT', 'Trained Graduate Teacher (TGT)'), ('PGT', 'Post Graduate Teacher (PGT)'), ('LECTURER', 'Lecturer'), ('PROFESSOR', 'Professor'), ('HOD', 'Head of Department'), ('PRINCIPAL', 'Principal/Vice Principal'), ('COORDINATOR', 'Academic Coordinator'), ('TRAINER', 'Corporate Trainer'), ('COUNSELOR', 'Counselor'), ('OTHER', 'Other')], max_length=50, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='current_role_custom',
            field=models.CharField(blank=True, help_text='Custom role if Other selected', max_length=100, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='qualifications',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='open_to_work',
            field=models.BooleanField(default=True, help_text='Show "Open to Work" badge'),
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='expert_subjects',
            field=models.JSONField(default=list, help_text='Primary teaching subjects'),
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='linkedin_url',
            field=models.URLField(blank=True, help_text='LinkedIn profile URL', default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='current_institution',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='current_educators', to='institutions.institution'),
        ),
    ]
