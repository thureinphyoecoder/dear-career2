from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0016_remove_archived_job_status"),
    ]

    operations = [
        migrations.CreateModel(
            name="CvGuideContent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(default="default", max_length=50, unique=True)),
                ("title", models.CharField(default="CV Guide: Design Better, Write Clearer", max_length=180)),
                ("intro", models.TextField(default="Use this guide to build a clean CV that recruiters can scan quickly and trust.")),
                ("guide_text", models.TextField(blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["key"],
            },
        ),
    ]
