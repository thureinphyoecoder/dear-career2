from django.db import migrations, models


def migrate_archived_jobs_to_draft(apps, schema_editor):
    Job = apps.get_model("jobs", "Job")
    Job.objects.filter(status="archived").update(status="draft")


class Migration(migrations.Migration):
    dependencies = [
        ("jobs", "0015_managedad_add_home_hero_placement"),
    ]

    operations = [
        migrations.RunPython(
            migrate_archived_jobs_to_draft,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="job",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("pending-review", "Pending Review"),
                ],
                default="published",
                max_length=32,
            ),
        ),
    ]
