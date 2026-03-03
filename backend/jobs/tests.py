from django.test import Client, TestCase

from .admin_api import get_admin_api_key
from .content import build_facebook_post_message, normalize_rich_text
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
        self.admin_headers = {"HTTP_X_ADMIN_API_KEY": get_admin_api_key()}

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

        response = self.client.get("/api/jobs/?include_inactive=1", **self.admin_headers)
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["status"], Job.WorkflowStatus.PENDING_REVIEW)


class FetchSourceApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_headers = {"HTTP_X_ADMIN_API_KEY": get_admin_api_key()}

    def test_fetch_source_list_returns_configured_sources(self):
        FetchSource.objects.create(
            key="jobthai",
            label="JobThai",
            domain="jobthai.com",
            feed_url="https://www.jobthai.com/en/rss/job-search",
            mode=FetchSource.ModeChoices.RSS,
            enabled=True,
        )

        response = self.client.get("/api/jobs/admin/sources/", **self.admin_headers)
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["key"], "jobthai")


class JobContentFormattingTests(TestCase):
    def test_normalize_rich_text_preserves_sections_and_bullets(self):
        raw = """
        <div>Professional Photographers & Videographers</div>
        <div>Responsibilities</div>
        <ul><li>Capture professional photos</li><li>Manage lighting</li></ul>
        <div>To Apply:</div>
        <p>Email: info@infinitymedianow.com</p>
        """

        formatted = normalize_rich_text(raw)

        self.assertIn("Responsibilities", formatted)
        self.assertIn("- Capture professional photos", formatted)
        self.assertIn("To Apply:", formatted)
        self.assertIn("Email: info@infinitymedianow.com", formatted)

    def test_build_facebook_post_message_uses_structured_sections(self):
        job = Job(
            title="Professional Photographers & Videographers",
            company="Infinity Media",
            location="Bangkok",
            employment_type=Job.EmploymentType.FREELANCE,
            description_mm=(
                "Responsibilities\n"
                "- Capture professional photos and videos.\n"
                "- Manage lighting, framing, and color consistency.\n\n"
                "Requirements\n"
                "- Strong professional portfolio required.\n"
                "- Must specify owned equipment.\n"
            ),
            source_url="https://example.com/jobs/photo-video",
        )

        message = build_facebook_post_message(job)

        self.assertIn("🕓 Status: Freelance", message)
        self.assertIn("Responsibilities", message)
        self.assertIn("- Capture professional photos and videos.", message)
        self.assertIn("Requirements", message)
        self.assertIn("Apply: https://example.com/jobs/photo-video", message)
