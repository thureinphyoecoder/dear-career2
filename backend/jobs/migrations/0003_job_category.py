from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0002_rename_jobs_job_slug_idx_jobs_job_slug_9562d1_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="category",
            field=models.CharField(
                choices=[
                    ("ngo", "NGO"),
                    ("white-collar", "White Collar"),
                    ("blue-collar", "Blue Collar"),
                ],
                default="white-collar",
                max_length=50,
            ),
        ),
        migrations.AddIndex(
            model_name="job",
            index=models.Index(fields=["category"], name="jobs_job_categor_653d6e_idx"),
        ),
    ]
