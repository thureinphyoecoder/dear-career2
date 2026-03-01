from django.core.management.base import BaseCommand

from jobs.models import FetchSource, Job


DEFAULT_SOURCES = [
    {
        "key": "jobthai",
        "label": "JobThai",
        "domain": "jobthai.com",
        "feed_url": "https://www.jobthai.com/%E0%B8%AB%E0%B8%B2%E0%B8%87%E0%B8%B2%E0%B8%99",
        "mode": FetchSource.ModeChoices.MANUAL,
        "enabled": True,
        "requires_manual_url": True,
        "auto_publish_website": False,
        "auto_publish_facebook": False,
        "approval_required_for_website": True,
        "approval_required_for_facebook": True,
        "default_category": Job.CategoryChoices.WHITE_COLLAR,
        "cadence_value": 30,
        "cadence_unit": FetchSource.CadenceUnit.MINUTES,
        "max_jobs_per_run": 40,
        "status": FetchSource.HealthStatus.WARNING,
        "last_error": "Landing page does not expose stable server-rendered job cards for auto-ingest.",
    },
    {
        "key": "jobsdb-th",
        "label": "JobsDB Thailand",
        "domain": "jobsdb.com",
        "feed_url": "https://th.jobsdb.com/",
        "mode": FetchSource.ModeChoices.MANUAL,
        "enabled": True,
        "requires_manual_url": True,
        "auto_publish_website": False,
        "auto_publish_facebook": False,
        "approval_required_for_website": True,
        "approval_required_for_facebook": True,
        "default_category": Job.CategoryChoices.WHITE_COLLAR,
        "cadence_value": 2,
        "cadence_unit": FetchSource.CadenceUnit.HOURS,
        "max_jobs_per_run": 40,
        "status": FetchSource.HealthStatus.WARNING,
        "last_error": "Homepage is accessible but does not expose stable job result cards without a search query.",
    },
    {
        "key": "linkedin",
        "label": "LinkedIn",
        "domain": "linkedin.com",
        "feed_url": "",
        "mode": FetchSource.ModeChoices.MANUAL,
        "enabled": True,
        "requires_manual_url": True,
        "auto_publish_website": False,
        "auto_publish_facebook": False,
        "approval_required_for_website": True,
        "approval_required_for_facebook": True,
        "default_category": Job.CategoryChoices.WHITE_COLLAR,
        "cadence_value": 0,
        "cadence_unit": FetchSource.CadenceUnit.HOURS,
        "max_jobs_per_run": 25,
    },
]


class Command(BaseCommand):
    help = "Seed default fetch source configurations."

    def handle(self, *args, **options):
        for source_data in DEFAULT_SOURCES:
            source, created = FetchSource.objects.update_or_create(
                key=source_data["key"], defaults=source_data
            )
            status = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(f"{source.label}: {status}"))
