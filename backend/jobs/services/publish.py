"""Publishing helpers for downstream channels."""


def publish_job(job):
    return {"job_id": job.id, "published": False}
