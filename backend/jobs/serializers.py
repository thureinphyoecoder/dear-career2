"""Serialization helpers for the jobs app."""


def serialize_job(job):
    return {
        "id": job.id,
        "title": job.title,
        "slug": job.slug,
        "company": job.company,
        "location": job.location,
        "category": job.category,
        "employment_type": job.employment_type,
        "salary": job.salary,
        "source": job.source,
        "source_url": job.source_url,
        "is_active": job.is_active,
        "description_mm": job.description_mm,
        "description_en": job.description_en,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }
