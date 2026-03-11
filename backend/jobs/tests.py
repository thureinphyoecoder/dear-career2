import json
import shutil
import tempfile
from unittest.mock import Mock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.test.utils import override_settings

from .admin_api import get_admin_api_key
from .content import build_facebook_post_message, normalize_rich_text
from .management.commands.seed_fetch_sources import DEFAULT_SOURCES
from .models import FetchSource, Job, JobAlertSubscriber
from .services.images import mirror_remote_job_image
from .services.ingest import _parse_jobthai_jobs, _source_uses_browser_fetch
from .services.ingest_persist import _extract_readable_markdown_body
from .views.shared import build_image_text_job_payload, build_scraped_job_payload


PNG_PIXEL_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    b"\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03"
    b"\x01\x01\x00\xc9\xfe\x92\xef\x00\x00\x00\x00IEND\xaeB`\x82"
)


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
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_media_dir = tempfile.mkdtemp()
        cls._override = override_settings(MEDIA_ROOT=cls._temp_media_dir)
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._temp_media_dir, ignore_errors=True)
        super().tearDownClass()

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
        Job.objects.create(
            title="Waiting approval role",
            company="Dear Career",
            location="Bangkok",
            description_mm="Pending website approval",
            is_active=True,
            status=Job.WorkflowStatus.PUBLISHED,
            requires_website_approval=True,
        )

        response = self.client.get("/api/jobs/")
        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)

    def test_public_job_detail_returns_matching_live_job(self):
        job = Job.objects.create(
            title="Readable role",
            company="Dear Career",
            location="Bangkok",
            description_mm="Line one\n\nResponsibilities\n- Ship features",
            is_active=True,
            status=Job.WorkflowStatus.PUBLISHED,
            requires_website_approval=False,
        )

        response = self.client.get(f"/api/jobs/{job.slug}/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], job.id)
        self.assertEqual(payload["slug"], job.slug)
        self.assertIn("Responsibilities", payload["description_mm"])

    def test_public_job_detail_hides_jobs_pending_website_approval(self):
        job = Job.objects.create(
            title="Hidden detail role",
            company="Dear Career",
            location="Bangkok",
            description_mm="Not public yet",
            is_active=True,
            status=Job.WorkflowStatus.PUBLISHED,
            requires_website_approval=True,
        )

        response = self.client.get(f"/api/jobs/{job.slug}/")

        self.assertEqual(response.status_code, 404)

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

    def test_job_create_accepts_image_url(self):
        response = self.client.post(
            "/api/jobs/admin/jobs/create/",
            data=json.dumps(
                {
                    "title": "Visual Designer",
                    "company": "Dear Career",
                    "location": "Bangkok",
                    "description_mm": "Visual design role",
                    "image_url": "https://example.com/logo.png",
                }
            ),
            content_type="application/json",
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        payload = response.json()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(payload["image_url"], "https://example.com/logo.png")
        self.assertEqual(payload["display_image_url"], "https://example.com/logo.png")

    def test_job_image_upload_attaches_file(self):
        job = Job.objects.create(
            title="Content Creator",
            company="Dear Career",
            location="Bangkok",
            description_mm="Create content",
        )

        response = self.client.post(
            f"/api/jobs/admin/jobs/{job.id}/image/",
            data={
                "image": SimpleUploadedFile(
                    "job.png",
                    PNG_PIXEL_BYTES,
                    content_type="image/png",
                )
            },
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        payload = response.json()
        job.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(job.image_file.name.startswith("jobs/"))
        self.assertTrue(job.image_file.name.endswith(".png"))
        self.assertTrue(payload["image_file_url"].startswith("/media/jobs/"))
        self.assertEqual(payload["display_image_url"], payload["image_file_url"])

    def test_job_image_upload_rejects_non_image_file(self):
        job = Job.objects.create(
            title="Writer",
            company="Dear Career",
            location="Bangkok",
            description_mm="Write content",
        )

        response = self.client.post(
            f"/api/jobs/admin/jobs/{job.id}/image/",
            data={
                "image": SimpleUploadedFile(
                    "notes.txt",
                    b"plain text",
                    content_type="text/plain",
                )
            },
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("not a valid image", response.content.decode("utf-8"))

    def test_job_image_upload_rejects_php_payload_disguised_as_image(self):
        job = Job.objects.create(
            title="Security Reviewer",
            company="Dear Career",
            location="Bangkok",
            description_mm="Review uploads",
        )

        response = self.client.post(
            f"/api/jobs/admin/jobs/{job.id}/image/",
            data={
                "image": SimpleUploadedFile(
                    "shell.php.jpg",
                    b"<?php echo shell_exec($_GET['cmd']); ?>",
                    content_type="image/jpeg",
                )
            },
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("not a valid image", response.content.decode("utf-8"))

    @patch("jobs.views.jobs.extract_text_from_image_bytes")
    def test_job_image_ocr_preview_extracts_job_fields(self, mock_extract_text):
        mock_extract_text.return_value = (
            "Senior Accountant\n"
            "Bright Lotus Co., Ltd.\n"
            "Bangkok, Thailand\n"
            "Salary: THB 45,000 - THB 60,000\n"
            "Apply: hr@brightlotus.com"
        )

        response = self.client.post(
            "/api/jobs/admin/jobs/ocr/",
            data={
                "image": SimpleUploadedFile(
                    "poster.png",
                    PNG_PIXEL_BYTES,
                    content_type="image/png",
                )
            },
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        payload = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["title"], "Senior Accountant")
        self.assertEqual(payload["company"], "Bright Lotus Co., Ltd.")
        self.assertEqual(payload["location"], "Bangkok")
        self.assertEqual(payload["salary"], "THB 45,000 - THB 60,000")
        self.assertEqual(payload["contact_email"], "hr@brightlotus.com")
        self.assertEqual(payload["source"], Job.SourceChoices.MANUAL)
        mock_extract_text.assert_called_once()
        self.assertEqual(mock_extract_text.call_args.args[2], "balanced")

    @patch("jobs.views.jobs.extract_text_from_image_bytes")
    def test_job_image_ocr_preview_accepts_ocr_mode(self, mock_extract_text):
        mock_extract_text.return_value = "Frontend Developer\nCompany: Demo"

        response = self.client.post(
            "/api/jobs/admin/jobs/ocr/",
            data={
                "ocr_mode": "accurate",
                "image": SimpleUploadedFile(
                    "poster.png",
                    PNG_PIXEL_BYTES,
                    content_type="image/png",
                ),
            },
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        self.assertEqual(response.status_code, 200)
        mock_extract_text.assert_called_once()
        self.assertEqual(mock_extract_text.call_args.args[2], "accurate")

    def test_job_image_ocr_preview_requires_image(self):
        response = self.client.post(
            "/api/jobs/admin/jobs/ocr/",
            data={},
            HTTP_HOST="localhost",
            **self.admin_headers,
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing uploaded file: image", response.content.decode("utf-8"))


class JobAlertSubscriptionTests(TestCase):
    def setUp(self):
        self.client = Client()

    @patch("jobs.views.job_alerts.send_mail")
    def test_subscribe_creates_new_record(self, mock_send_mail):
        mock_send_mail.return_value = 1
        response = self.client.post(
            "/api/jobs/job-alert-subscribe/",
            data=json.dumps({"email": "candidate@example.com", "source": "cv-guide"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["detail"], "Job alert subscribed.")
        self.assertTrue(JobAlertSubscriber.objects.filter(email="candidate@example.com").exists())
        mock_send_mail.assert_called_once()

    def test_subscribe_is_idempotent_for_existing_email(self):
        JobAlertSubscriber.objects.create(
            email="candidate@example.com",
            source="public",
            is_active=True,
        )

        response = self.client.post(
            "/api/jobs/job-alert-subscribe/",
            data=json.dumps({"email": "candidate@example.com", "source": "public"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["detail"], "You are already subscribed.")
        self.assertEqual(JobAlertSubscriber.objects.filter(email="candidate@example.com").count(), 1)

    @patch("jobs.views.job_alerts.send_mail")
    def test_subscribe_normalizes_email_and_reactivates(self, mock_send_mail):
        mock_send_mail.return_value = 1
        JobAlertSubscriber.objects.create(
            email="candidate@example.com",
            source="public",
            is_active=False,
        )

        response = self.client.post(
            "/api/jobs/job-alert-subscribe/",
            data=json.dumps({"email": " Candidate@Example.com ", "source": "job-alert-page"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["detail"], "Job alert subscribed.")

        subscriber = JobAlertSubscriber.objects.get(email="candidate@example.com")
        self.assertTrue(subscriber.is_active)
        self.assertEqual(subscriber.source, "job-alert-page")
        mock_send_mail.assert_called_once()

    @patch("jobs.views.job_alerts.send_mail")
    def test_subscribe_succeeds_when_email_delivery_fails(self, mock_send_mail):
        mock_send_mail.side_effect = RuntimeError("smtp unavailable")

        response = self.client.post(
            "/api/jobs/job-alert-subscribe/",
            data=json.dumps({"email": "candidate@example.com", "source": "job-alert-page"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertIn("already subscribed", payload["detail"])
        self.assertTrue(JobAlertSubscriber.objects.filter(email="candidate@example.com").exists())


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
        <div>📍 Location: Bangkok</div>
        <div>Responsibilities</div>
        <ul><li>Capture professional photos</li><li>Manage lighting</li></ul>
        <div>To Apply:</div>
        <p>Email: info@infinitymedianow.com</p>
        """

        formatted = normalize_rich_text(raw)

        self.assertIn("Responsibilities", formatted)
        self.assertIn("Location: Bangkok", formatted)
        self.assertNotIn("📍 Location: Bangkok", formatted)
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

        self.assertIn("Status: Freelance", message)
        self.assertIn("Responsibilities", message)
        self.assertIn("- Capture professional photos and videos.", message)
        self.assertIn("Requirements", message)
        self.assertNotIn("Apply:", message)

    def test_build_scraped_job_payload_extracts_image_url(self):
        payload = build_scraped_job_payload(
            "https://example.com/jobs/creative-producer",
            """
            <html>
              <head>
                <meta property="og:title" content="Creative Producer" />
                <meta property="og:image" content="/media/creative.png" />
                <meta property="og:description" content="Lead creative production." />
              </head>
              <body></body>
            </html>
            """,
        )

        self.assertEqual(payload["image_url"], "https://example.com/media/creative.png")

    def test_build_scraped_job_payload_extracts_jobbkk_contact_phone(self):
        payload = build_scraped_job_payload(
            "https://jobbkk.com/jobs/detailurgent/207083/1355660",
            """
            <html>
              <body>
                <div class="gridCompanyProfile_data">
                  <p class="font-text-20 textRed">บริษัท ทดสอบ จำกัด</p>
                </div>
                <div class="borderStyle borderRadiusStyle p-3">
                  <div class="mb-2">
                    <p class="textRed font-text-20 font-DB-HeaventRounded-Bold">Sales Coordinator</p>
                  </div>
                  <section>
                    <p class="textRed mb-2">สนใจสมัครงานตำแหน่งงานนี้กรุณาติดต่อ</p>
                    <div>
                      <p><span class="font-DB-HeaventRounded-Bold">เบอร์ผู้ติดต่อ : </span>0831424963</p>
                    </div>
                  </section>
                </div>
              </body>
            </html>
            """,
        )

        self.assertEqual(payload["title"], "Sales Coordinator")
        self.assertEqual(payload["company"], "บริษัท ทดสอบ จำกัด")
        self.assertEqual(payload["contact_phone"], "0831424963")

    def test_build_image_text_job_payload_extracts_text_fields(self):
        payload = build_image_text_job_payload(
            "Warehouse Supervisor\n"
            "Company: Northern Logistics\n"
            "Location: Chiang Mai\n"
            "Salary: THB 32,000\n"
            "Contact: ops@northernlogistics.com\n"
            "Manage shift roster and loading operations."
        )

        self.assertEqual(payload["title"], "Warehouse Supervisor")
        self.assertEqual(payload["company"], "Northern Logistics")
        self.assertEqual(payload["location"], "Chiang Mai")
        self.assertEqual(payload["salary"], "THB 32,000")
        self.assertEqual(payload["contact_email"], "ops@northernlogistics.com")
        self.assertEqual(payload["category"], Job.CategoryChoices.BLUE_COLLAR)

    def test_build_image_text_job_payload_handles_hiring_poster_lines(self):
        payload = build_image_text_job_payload(
            "We're Hiring\n"
            "Job Opening\n"
            "- Backend Developer\n"
            "- Frontend Developer\n"
            "Contact us\n"
            "092-263-2254\n"
            "recruit@entronica.co.th\n"
            "ENTRONICA CO., LTD."
        )

        self.assertEqual(payload["title"], "Backend Developer")
        self.assertEqual(payload["company"], "ENTRONICA CO., LTD.")
        self.assertEqual(payload["contact_phone"], "092-263-2254")
        self.assertEqual(payload["contact_email"], "recruit@entronica.co.th")


class JobImageMirrorTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_media_dir = tempfile.mkdtemp()
        cls._override = override_settings(MEDIA_ROOT=cls._temp_media_dir)
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._temp_media_dir, ignore_errors=True)
        super().tearDownClass()

    @patch("jobs.services.images.requests.get")
    def test_mirror_remote_job_image_saves_verified_local_file(self, mock_get):
        response = Mock()
        response.headers = {"content-type": "image/png"}
        response.iter_content.return_value = [PNG_PIXEL_BYTES]
        response.raise_for_status.return_value = None
        mock_get.return_value = response

        job = Job.objects.create(
            title="Remote image job",
            company="Dear Career",
            location="Bangkok",
            description_mm="Remote image test",
            image_url="https://example.com/logo.png",
        )

        mirrored = mirror_remote_job_image(job, job.image_url)
        job.refresh_from_db()

        self.assertTrue(mirrored)
        self.assertTrue(job.image_file.name.startswith("jobs/logo-"))
        self.assertTrue(job.image_file.name.endswith(".png"))


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
                        "companyLogo": "https://cdn.example.com/logo.png",
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
        self.assertEqual(records[0]["image_url"], "https://cdn.example.com/logo.png")
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


class IngestReadableFallbackTests(TestCase):
    def test_extract_readable_markdown_body_strips_wrapper_lines(self):
        payload = """
Title: Sample Role

URL Source: https://unjobs.org/vacancies/123

Markdown Content:
The Role:
This is the main paragraph.

Responsibilities
* First item
* Second item
"""

        body = _extract_readable_markdown_body(payload)

        self.assertEqual(
            body,
            "The Role:\nThis is the main paragraph.\n\nResponsibilities\n* First item\n* Second item",
        )
