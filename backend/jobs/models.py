import uuid

from django.db import models
from django.utils import timezone
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
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=60, blank=True)

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


class AdminNotification(models.Model):
    class ToneChoices(models.TextChoices):
        INFO = "info", "Info"
        SUCCESS = "success", "Success"
        WARNING = "warning", "Warning"

    title = models.CharField(max_length=160)
    detail = models.TextField()
    tone = models.CharField(
        max_length=20,
        choices=ToneChoices.choices,
        default=ToneChoices.INFO,
    )
    source = models.ForeignKey(
        FetchSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    fetch_run = models.ForeignKey(
        FetchRun,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    target_url = models.CharField(max_length=255, blank=True)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["tone"]),
            models.Index(fields=["read_at"]),
        ]

    def __str__(self):
        return self.title


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
    profile_name = models.CharField(max_length=120, blank=True)
    profile_image_url = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["platform"]

    def __str__(self):
        return self.platform


class VisitorEvent(models.Model):
    session_key = models.CharField(max_length=64)
    path = models.CharField(max_length=255)
    page_title = models.CharField(max_length=160, blank=True)
    visit_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_seen_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["session_key", "path", "visit_date"],
                name="jobs_visitor_event_unique_session_path_date",
            )
        ]
        indexes = [
            models.Index(fields=["visit_date"]),
            models.Index(fields=["path"]),
            models.Index(fields=["session_key"]),
        ]

    def __str__(self):
        return f"{self.path} · {self.session_key}"


class ManagedAd(models.Model):
    class PlacementChoices(models.TextChoices):
        JOBS_INLINE = "jobs-inline", "Jobs inline"
        JOBS_DETAIL = "jobs-detail", "Job detail"
        JOBS_SEARCH = "jobs-search", "Jobs search"

    class StatusChoices(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"

    title = models.CharField(max_length=160)
    eyebrow = models.CharField(max_length=60, blank=True, default="Sponsored")
    description = models.TextField()
    cta_label = models.CharField(max_length=60, default="Learn more")
    href = models.URLField()
    placement = models.CharField(
        max_length=40,
        choices=PlacementChoices.choices,
        default=PlacementChoices.JOBS_INLINE,
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.DRAFT,
    )
    sort_order = models.PositiveIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["placement", "sort_order", "title"]
        indexes = [
            models.Index(fields=["placement"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.title} · {self.placement}"
