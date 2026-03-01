from django.urls import path

from .views import (
    fetch_run_list,
    fetch_source_create,
    fetch_source_list,
    fetch_source_run,
    fetch_source_update,
    job_list,
)

urlpatterns = [
    path("", job_list, name="job-list"),
    path("admin/sources/", fetch_source_list, name="fetch-source-list"),
    path("admin/sources/create/", fetch_source_create, name="fetch-source-create"),
    path("admin/sources/<int:source_id>/", fetch_source_update, name="fetch-source-update"),
    path("admin/sources/<int:source_id>/run/", fetch_source_run, name="fetch-source-run"),
    path("admin/runs/", fetch_run_list, name="fetch-run-list"),
]
