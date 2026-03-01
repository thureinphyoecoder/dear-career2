"""Job ingestion service entrypoints."""


def ingest_jobs(source_name: str) -> dict:
    return {"source": source_name, "status": "pending"}
