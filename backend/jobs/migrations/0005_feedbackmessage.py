from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("jobs", "0004_fetchrun_fetchsource_job_requires_facebook_approval_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="FeedbackMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("email", models.EmailField(max_length=254)),
                ("subject", models.CharField(max_length=180)),
                ("message", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
