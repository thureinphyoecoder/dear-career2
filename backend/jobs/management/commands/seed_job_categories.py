from django.core.management.base import BaseCommand

from jobs.models import Job


SEED_JOBS = [
    {
        "title": "Program Coordinator",
        "company": "Community Bridge Myanmar",
        "location": "Yangon",
        "category": Job.CategoryChoices.NGO,
        "employment_type": Job.EmploymentType.FULL_TIME,
        "salary": "900,000 MMK",
        "source": Job.SourceChoices.SCRAPER,
        "source_url": "https://example.org/ngo/program-coordinator",
        "source_job_id": "ngo-program-coordinator",
        "description_mm": "Community projects ကို coordinate လုပ်ပေးမယ့် NGO role.",
    },
    {
        "title": "Monitoring and Evaluation Officer",
        "company": "Impact Forward",
        "location": "Mandalay",
        "category": Job.CategoryChoices.NGO,
        "employment_type": Job.EmploymentType.FULL_TIME,
        "salary": "1,100,000 MMK",
        "source": Job.SourceChoices.SCRAPER,
        "source_url": "https://example.org/ngo/me-officer",
        "source_job_id": "ngo-me-officer",
        "description_mm": "Project data, reporting, evaluation workflow များကိုကိုင်တွယ်မယ့် role.",
    },
    {
        "title": "Finance Executive",
        "company": "Delta Advisory",
        "location": "Yangon",
        "category": Job.CategoryChoices.WHITE_COLLAR,
        "employment_type": Job.EmploymentType.FULL_TIME,
        "salary": "1,300,000 MMK",
        "source": Job.SourceChoices.SCRAPER,
        "source_url": "https://example.com/white-collar/finance-exec",
        "source_job_id": "white-finance-exec",
        "description_mm": "Office-based finance and reporting role.",
    },
    {
        "title": "HR and Admin Officer",
        "company": "Bright Ledger Co.",
        "location": "Naypyitaw",
        "category": Job.CategoryChoices.WHITE_COLLAR,
        "employment_type": Job.EmploymentType.FULL_TIME,
        "salary": "950,000 MMK",
        "source": Job.SourceChoices.MANUAL,
        "source_url": "https://www.linkedin.com/jobs/view/example-hr-admin",
        "source_job_id": "white-hr-admin",
        "description_mm": "LinkedIn ကတွေ့တဲ့ white-collar opening ကို manual URL paste နဲ့ထည့်ထားတဲ့ sample role.",
    },
    {
        "title": "Warehouse Supervisor",
        "company": "Metro Distribution",
        "location": "Hlaing Tharyar",
        "category": Job.CategoryChoices.BLUE_COLLAR,
        "employment_type": Job.EmploymentType.FULL_TIME,
        "salary": "700,000 MMK",
        "source": Job.SourceChoices.SCRAPER,
        "source_url": "https://example.net/blue-collar/warehouse-supervisor",
        "source_job_id": "blue-warehouse-supervisor",
        "description_mm": "Warehouse operation နှင့် shift team ကိုစီမံခန့်ခွဲမယ့် role.",
    },
    {
        "title": "Maintenance Technician",
        "company": "Summit Facilities",
        "location": "Bago",
        "category": Job.CategoryChoices.BLUE_COLLAR,
        "employment_type": Job.EmploymentType.FULL_TIME,
        "salary": "650,000 MMK",
        "source": Job.SourceChoices.MANUAL,
        "source_url": "https://www.linkedin.com/jobs/view/example-maintenance-tech",
        "source_job_id": "blue-maintenance-technician",
        "description_mm": "Manual source URL paste workflow အတွက် blue-collar sample role.",
    },
]


class Command(BaseCommand):
    help = "Seed sample jobs across NGO, white-collar, and blue-collar categories."

    def handle(self, *args, **options):
        created_count = 0

        for payload in SEED_JOBS:
            _, created = Job.objects.update_or_create(
                source_job_id=payload["source_job_id"],
                defaults=payload,
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete. Created {created_count} jobs, synced {len(SEED_JOBS)} total."
            )
        )
