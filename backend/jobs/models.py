import uuid

from django.db import models
from django.utils.text import slugify


class Job(models.Model):
    class SourceChoices(models.TextChoices):
        MANUAL = "manual", "Manual"
        SCRAPER = "scraper", "Scraper"

    class CategoryChoices(models.TextChoices):
        NGO = "ngo", "NGO"
        WHITE_COLLAR = "white-collar", "White Collar"
        BLUE_COLLAR = "blue-collar", "Blue Collar"

    class EmploymentType(models.TextChoices):
        FULL_TIME = "full-time", "Full-time"
        PART_TIME = "part-time", "Part-time"
        FREELANCE = "freelance", "Freelance"
        INTERNSHIP = "internship", "Internship"

    class WorkflowStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"
        PENDING_REVIEW = "pending-review", "Pending Review"

    title = models.CharField(max_length=255)
    slug = models.SlugField(
        unique=True, max_length=255, help_text="SEO အတွက် URL friendly name"
    )
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        choices=CategoryChoices.choices,
        default=CategoryChoices.WHITE_COLLAR,
    )

    description_mm = models.TextField()
    description_en = models.TextField(blank=True)

    source = models.CharField(
        max_length=50, choices=SourceChoices.choices, default=SourceChoices.MANUAL
    )
    source_url = models.URLField(blank=True, null=True)
    source_job_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Original website က job ID",
    )

    employment_type = models.CharField(
        max_length=50,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )
    salary = models.CharField(max_length=100, blank=True)

    status = models.CharField(
        max_length=32,
        choices=WorkflowStatus.choices,
        default=WorkflowStatus.PUBLISHED,
    )
    is_active = models.BooleanField(default=True)
    is_fb_posted = models.BooleanField(
        default=False, help_text="Facebook မှာ တင်ပြီး/မတင်ရသေး"
    )
    fb_post_id = models.CharField(
        max_length=100, blank=True, null=True, help_text="Facebook post ID"
    )
    requires_website_approval = models.BooleanField(default=False)
    requires_facebook_approval = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            unique_id = uuid.uuid4().hex[:6]
            self.slug = f"{base_slug}-{unique_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.company}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["source"]),
            models.Index(fields=["category"]),
            models.Index(fields=["source_job_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_active"]),
        ]


class FetchSource(models.Model):
    class ModeChoices(models.TextChoices):
        HTML = "html", "HTML"
        RSS = "rss", "RSS"
        MANUAL = "manual", "Manual"

    class CadenceUnit(models.TextChoices):
        MINUTES = "minutes", "Minutes"
        HOURS = "hours", "Hours"

    class HealthStatus(models.TextChoices):
        HEALTHY = "healthy", "Healthy"
        WARNING = "warning", "Warning"
        PAUSED = "paused", "Paused"

    key = models.SlugField(unique=True, max_length=100)
    label = models.CharField(max_length=120)
    domain = models.CharField(max_length=255)
    feed_url = models.URLField(blank=True)
    mode = models.CharField(
        max_length=20, choices=ModeChoices.choices, default=ModeChoices.HTML
    )
    enabled = models.BooleanField(default=True)
    requires_manual_url = models.BooleanField(default=False)
    auto_publish_website = models.BooleanField(default=True)
    auto_publish_facebook = models.BooleanField(default=False)
    approval_required_for_website = models.BooleanField(default=False)
    approval_required_for_facebook = models.BooleanField(default=True)
    default_category = models.CharField(
        max_length=50,
        choices=Job.CategoryChoices.choices,
        default=Job.CategoryChoices.WHITE_COLLAR,
    )
    cadence_value = models.PositiveIntegerField(default=30)
    cadence_unit = models.CharField(
        max_length=20, choices=CadenceUnit.choices, default=CadenceUnit.MINUTES
    )
    max_jobs_per_run = models.PositiveIntegerField(default=25)
    status = models.CharField(
        max_length=20,
        choices=HealthStatus.choices,
        default=HealthStatus.HEALTHY,
    )
    selectors = models.JSONField(default=dict, blank=True)
    headers = models.JSONField(default=dict, blank=True)
    last_run_at = models.DateTimeField(blank=True, null=True)
    last_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["label"]

    def __str__(self):
        return self.label


class FetchRun(models.Model):
    class RunStatus(models.TextChoices):
        SUCCESS = "success", "Success"
        ERROR = "error", "Error"

    source = models.ForeignKey(
        FetchSource, on_delete=models.CASCADE, related_name="runs"
    )
    status = models.CharField(
        max_length=20, choices=RunStatus.choices, default=RunStatus.SUCCESS
    )
    fetched_count = models.PositiveIntegerField(default=0)
    created_count = models.PositiveIntegerField(default=0)
    updated_count = models.PositiveIntegerField(default=0)
    published_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.source.label} · {self.status}"


class FeedbackMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=180)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} · {self.email}"


class ChannelCredential(models.Model):
    class PlatformChoices(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"

    platform = models.CharField(
        max_length=32,
        choices=PlatformChoices.choices,
        unique=True,
    )
    account_name = models.CharField(max_length=120, blank=True)
    page_id = models.CharField(max_length=120, blank=True)
    access_token = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["platform"]

    def __str__(self):
        return self.platform
