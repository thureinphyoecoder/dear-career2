FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    chromium \
    nodejs \
    npm \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY jobs/browser/package.json /opt/dear-career-browser/package.json
COPY jobs/browser/package-lock.json /opt/dear-career-browser/package-lock.json
COPY jobs/browser/fetch.mjs /opt/dear-career-browser/fetch.mjs
RUN cd /opt/dear-career-browser && npm install --omit=dev

COPY . .
