from django.test import TestCase

from .models import Job


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
