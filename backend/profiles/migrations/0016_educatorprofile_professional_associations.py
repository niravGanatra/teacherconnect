from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0015_add_google_avatar_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='educatorprofile',
            name='professional_associations',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
