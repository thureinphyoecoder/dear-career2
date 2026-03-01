from django.core.management.base import BaseCommand

from jobs.models import FetchSource
from jobs.services.ingest import ingest_source


class Command(BaseCommand):
    help = "Run ingestion across all enabled fetch sources."

    def handle(self, *args, **options):
        sources = FetchSource.objects.filter(enabled=True)
        if not sources.exists():
            self.stdout.write(self.style.WARNING("No enabled fetch sources found."))
            return

        for source in sources:
            try:
                result = ingest_source(source)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{source.label}: {result['created_count']} created, "
                        f"{result['updated_count']} updated, "
                        f"{result['published_count']} published"
                    )
                )
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"{source.label}: {exc}"))
