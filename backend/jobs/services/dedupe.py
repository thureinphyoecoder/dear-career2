"""Job deduplication helpers."""


def dedupe_jobs(job_records):
    seen = set()
    deduped = []

    for record in job_records:
        key = (
            record.get("source_job_id")
            or record.get("source_url")
            or (record.get("title"), record.get("company"))
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(record)

    return deduped
