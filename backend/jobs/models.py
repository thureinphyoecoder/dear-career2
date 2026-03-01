from django.db import models
from django.utils.text import slugify
import uuid


class Job(models.Model):
    # Choices for cleaner data
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

    # --- Basic Info ---
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

    # --- Content ---
    description_mm = models.TextField()
    description_en = models.TextField(blank=True)

    # --- Aggregator Metadata (Crucial for Automation) ---
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

    # --- Job Specs ---
    employment_type = models.CharField(
        max_length=50, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME
    )
    salary = models.CharField(max_length=100, blank=True)

    # --- Automation Status ---
    is_active = models.BooleanField(default=True)
    is_fb_posted = models.BooleanField(
        default=False, help_text="Facebook မှာ တင်ပြီး/မတင်ရသေး"
    )
    fb_post_id = models.CharField(
        max_length=100, blank=True, null=True, help_text="Facebook post ID"
    )

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Slug တူမှာစိုးလို့ Unique ဖြစ်အောင် UUID အမြီးလေးတွဲလိုက်တာပါ
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
            models.Index(fields=["source_job_id"]),  # Search လုပ်ရင် မြန်အောင် Index ထည့်ထားတယ်
        ]
