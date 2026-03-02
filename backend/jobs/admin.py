from django.contrib import admin

from .models import (
    AdminNotification,
    ChannelCredential,
    FeedbackMessage,
    FetchRun,
    FetchSource,
    Job,
    ManagedAd,
    VisitorEvent,
)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "company",
        "category",
        "location",
        "employment_type",
        "status",
        "is_active",
        "is_fb_posted",
    )
    list_filter = (
        "category",
        "employment_type",
        "source",
        "status",
        "is_active",
        "is_fb_posted",
    )
    search_fields = ("title", "company", "location", "source_job_id")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(FetchSource)
class FetchSourceAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "key",
        "mode",
        "enabled",
        "status",
        "cadence_value",
        "cadence_unit",
        "last_run_at",
    )
    list_filter = (
        "mode",
        "enabled",
        "status",
        "requires_manual_url",
        "auto_publish_website",
        "auto_publish_facebook",
    )
    search_fields = ("label", "key", "domain", "feed_url")


@admin.register(FetchRun)
class FetchRunAdmin(admin.ModelAdmin):
    list_display = (
        "source",
        "status",
        "fetched_count",
        "created_count",
        "updated_count",
        "published_count",
        "started_at",
        "finished_at",
    )
    list_filter = ("status", "source")
    search_fields = ("source__label", "source__key", "error_message")


@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "tone", "source", "fetch_run", "created_at")
    list_filter = ("tone", "source")
    search_fields = ("title", "detail", "source__label")


@admin.register(FeedbackMessage)
class FeedbackMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "created_at")
    search_fields = ("subject", "name", "email", "message")


@admin.register(ChannelCredential)
class ChannelCredentialAdmin(admin.ModelAdmin):
    list_display = ("platform", "account_name", "page_id", "updated_at")
    search_fields = ("platform", "account_name", "page_id")


@admin.register(VisitorEvent)
class VisitorEventAdmin(admin.ModelAdmin):
    list_display = ("path", "page_title", "session_key", "visit_date", "last_seen_at")
    list_filter = ("visit_date", "path")
    search_fields = ("path", "page_title", "session_key")


@admin.register(ManagedAd)
class ManagedAdAdmin(admin.ModelAdmin):
    list_display = ("title", "placement", "status", "sort_order", "updated_at")
    list_filter = ("placement", "status")
    search_fields = ("title", "description", "href")
