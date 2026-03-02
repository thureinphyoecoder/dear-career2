from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0006_channelcredential"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="contact_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="job",
            name="contact_phone",
            field=models.CharField(blank=True, max_length=60),
        ),
    ]
