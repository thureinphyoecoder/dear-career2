from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("jobs", "0010_channelcredential_profile_image_url_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminnotification",
            name="read_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="adminnotification",
            name="target_url",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddIndex(
            model_name="adminnotification",
            index=models.Index(fields=["read_at"], name="jobs_adminn_read_at_08d8f6_idx"),
        ),
    ]
