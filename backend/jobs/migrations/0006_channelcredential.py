from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0005_feedbackmessage"),
    ]

    operations = [
        migrations.CreateModel(
            name="ChannelCredential",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "platform",
                    models.CharField(
                        choices=[("facebook", "Facebook")],
                        max_length=32,
                        unique=True,
                    ),
                ),
                ("account_name", models.CharField(blank=True, max_length=120)),
                ("page_id", models.CharField(blank=True, max_length=120)),
                ("access_token", models.TextField(blank=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["platform"],
            },
        ),
    ]
