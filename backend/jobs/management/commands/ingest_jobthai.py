from django.core.management.base import BaseCommand

from jobs.services.ingest import ingest_jobs


class Command(BaseCommand):
    help = "Trigger the JobThai ingestion workflow."

    def handle(self, *args, **options):
        result = ingest_jobs("jobthai")
        self.stdout.write(
            self.style.SUCCESS(f"Ingestion initialized: {result['source']}")
        )
