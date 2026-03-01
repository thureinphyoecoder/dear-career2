from django.test import Client, TestCase

from .models import FetchSource, Job


class JobModelTests(TestCase):
    def test_save_generates_slug(self):
        job = Job.objects.create(
            title="Backend Developer",
            company="Dear Career",
            location="Bangkok",
            description_mm="Test description",
        )

        self.assertTrue(job.slug.startswith("backend-developer-"))
        self.assertEqual(job.category, Job.CategoryChoices.WHITE_COLLAR)
        self.assertEqual(job.status, Job.WorkflowStatus.PUBLISHED)


class JobApiTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_job_list_hides_inactive_jobs_by_default(self):
        Job.objects.create(
            title="Live role",
            company="Dear Career",
            location="Bangkok",
            description_mm="Live description",
            is_active=True,
        )
        Job.objects.create(
            title="Hidden role",
            company="Dear Career",
            location="Bangkok",
            description_mm="Hidden description",
            is_active=False,
            status=Job.WorkflowStatus.PENDING_REVIEW,
        )

        response = self.client.get("/api/jobs/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)

    def test_job_list_can_include_inactive_jobs_for_admin(self):
        Job.objects.create(
            title="Pending role",
            company="Dear Career",
            location="Bangkok",
            description_mm="Pending description",
            is_active=False,
            status=Job.WorkflowStatus.PENDING_REVIEW,
        )

        response = self.client.get("/api/jobs/?include_inactive=1")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["status"], Job.WorkflowStatus.PENDING_REVIEW)


class FetchSourceApiTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_fetch_source_list_returns_configured_sources(self):
        FetchSource.objects.create(
            key="jobthai",
            label="JobThai",
            domain="jobthai.com",
            feed_url="https://www.jobthai.com/en/rss/job-search",
            mode=FetchSource.ModeChoices.RSS,
            enabled=True,
        )

        response = self.client.get("/api/jobs/admin/sources/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["key"], "jobthai")
