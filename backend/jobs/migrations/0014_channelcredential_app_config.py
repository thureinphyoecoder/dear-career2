from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0013_jobreport"),
    ]

    operations = [
        migrations.AddField(
            model_name="channelcredential",
            name="app_id",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="channelcredential",
            name="app_secret",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
