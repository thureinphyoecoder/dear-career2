from django.test import Client, TestCase

from .admin_api import get_admin_api_key
from .content import build_facebook_post_message, normalize_rich_text
from .management.commands.seed_fetch_sources import DEFAULT_SOURCES
from .models import FetchSource, Job
from .services.ingest import _parse_jobthai_jobs, _source_uses_browser_fetch


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


class FetchParserTests(TestCase):
    def test_jobthai_parser_reads_next_data_jobs(self):
        source = FetchSource(
            key="jobthai",
            label="JobThai",
            domain="jobthai.com",
            feed_url="https://www.jobthai.com/th/jobs?orderBy=UPDATED_AT_DESC",
            mode=FetchSource.ModeChoices.HTML,
            default_category=Job.CategoryChoices.WHITE_COLLAR,
        )
        payload = """
        <script id="__NEXT_DATA__" type="application/json">
        {
          "props": {
            "apolloState": {
              "ROOT_QUERY": {
                "searchJobs({\\"filter\\":{\\"l\\":\\"th\\",\\"page\\":1},\\"orderBy\\":\\"UPDATED_AT_DESC\\",\\"staticDataVersion\\":{}})": {
                  "data": {
                    "data": [
                      {
                        "id": 12345,
                        "jobTitle": "Project Coordinator",
                        "companyName": "Acme Foundation",
                        "province": {"name": "Bangkok"},
                        "district": {"name": "Pathum Wan"},
                        "workLocation": "BTS Siam",
                        "salary": "THB 40,000",
                        "jobType": {"name": "Operations"}
                      }
                    ]
                  }
                }
              }
            }
          }
        }
        </script>
        """

        records = _parse_jobthai_jobs(source, payload)

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["title"], "Project Coordinator")
        self.assertEqual(records[0]["company"], "Acme Foundation")
        self.assertEqual(records[0]["source_url"], "https://www.jobthai.com/th/company/job/12345")
        self.assertIn("Bangkok", records[0]["location"])


class SeedSourceConfigTests(TestCase):
    def test_jobthai_and_unjobs_default_sources_are_auto_fetchable(self):
        keyed = {source["key"]: source for source in DEFAULT_SOURCES}

        self.assertEqual(keyed["jobthai"]["mode"], FetchSource.ModeChoices.HTML)
        self.assertFalse(keyed["jobthai"]["requires_manual_url"])
        self.assertEqual(keyed["unjobs-thailand"]["selectors"]["entry"], "a[href*='vacancies/']")

    def test_jobsdb_and_thaingo_default_sources_use_browser_fetch(self):
        keyed = {source["key"]: source for source in DEFAULT_SOURCES}

        self.assertEqual(keyed["jobsdb-th"]["mode"], FetchSource.ModeChoices.HTML)
        self.assertFalse(keyed["jobsdb-th"]["requires_manual_url"])
        self.assertEqual(keyed["jobsdb-th"]["selectors"]["__fetch_strategy"], "browser")
        self.assertEqual(keyed["thaingo"]["mode"], FetchSource.ModeChoices.HTML)
        self.assertFalse(keyed["thaingo"]["requires_manual_url"])
        self.assertEqual(keyed["thaingo"]["selectors"]["__fetch_strategy"], "browser")


class BrowserFetchStrategyTests(TestCase):
    def test_source_uses_browser_fetch_when_configured(self):
        source = FetchSource(selectors={"__fetch_strategy": "browser"})
        self.assertTrue(_source_uses_browser_fetch(source))

    def test_source_does_not_use_browser_fetch_by_default(self):
        source = FetchSource(selectors={})
        self.assertFalse(_source_uses_browser_fetch(source))
