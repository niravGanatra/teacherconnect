from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0017_learnerprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='institutioncampus',
            name='google_maps_link',
            field=models.URLField(blank=True),
        ),
    ]
