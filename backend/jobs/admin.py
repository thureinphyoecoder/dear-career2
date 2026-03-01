from django.contrib import admin

from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "company",
        "category",
        "location",
        "employment_type",
        "is_active",
    )
    list_filter = (
        "category",
        "employment_type",
        "source",
        "is_active",
        "is_fb_posted",
    )
    search_fields = ("title", "company", "location", "source_job_id")
    prepopulated_fields = {"slug": ("title",)}
