from django.urls import path

from .views import (
    facebook_channel_credential,
    feedback_create,
    fetch_run_list,
    fetch_source_create,
    fetch_source_list,
    fetch_source_run,
    fetch_source_update,
    job_create,
    job_detail,
    job_list,
    job_scrape_preview,
)

urlpatterns = [
    path("", job_list, name="job-list"),
    path("admin/jobs/create/", job_create, name="job-create"),
    path("admin/jobs/scrape/", job_scrape_preview, name="job-scrape-preview"),
    path("admin/jobs/<int:job_id>/", job_detail, name="job-detail"),
    path("admin/channels/facebook/", facebook_channel_credential, name="facebook-channel-credential"),
    path("feedback/", feedback_create, name="feedback-create"),
    path("admin/sources/", fetch_source_list, name="fetch-source-list"),
    path("admin/sources/create/", fetch_source_create, name="fetch-source-create"),
    path("admin/sources/<int:source_id>/", fetch_source_update, name="fetch-source-update"),
    path("admin/sources/<int:source_id>/run/", fetch_source_run, name="fetch-source-run"),
    path("admin/runs/", fetch_run_list, name="fetch-run-list"),
]
