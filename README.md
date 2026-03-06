# Dear Career 2

Dear Career 2 is a two-part jobs platform for curated Thailand roles.

- `frontend/`: Next.js admin + public site
- `backend/`: Django API, ingestion workflows, media handling, and admin endpoints
- `docker-compose.yml`: local full-stack development with PostgreSQL

The project supports:

- Public job browsing and search
- Admin job CRUD
- Manual job intake from a pasted URL
- Image upload plus OCR image-to-text intake
- Fetch source management for supported job websites
- Approval workflow for website and Facebook publishing
- One-click publish from Drafted jobs (`Publish + Post`)
- Facebook post drafting/publishing support
- Managed ad slots and visitor analytics
- SEO metadata + dynamic sitemap + JobPosting structured data

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Django 6, PostgreSQL, BeautifulSoup, Requests, Pillow
- OCR: RapidOCR + ONNX Runtime + OpenCV
- Browser-based fetch fallback: Chromium + Node script inside backend container

## Repository Layout

```text
.
├── backend/
│   ├── config/                  # Django settings and URL config
│   ├── jobs/
│   │   ├── management/commands/ # seed and ingestion commands
│   │   ├── services/            # ingestion, images, OCR, publishing
│   │   ├── views/               # API endpoints
│   │   └── tests.py
│   ├── .env
│   ├── .env.docker
│   └── Dockerfile
├── frontend/
│   ├── app/                     # public pages, admin pages, API proxy routes
│   ├── components/
│   ├── lib/
│   ├── .env.example
│   ├── .env.local
│   ├── .env.docker
│   └── Dockerfile
└── docker-compose.yml
```

## Main Product Areas

### Public site

- Homepage with featured jobs and inline ad placement
- `/jobs` listing page with search
- Job detail pages by slug
- Visitor tracking and feedback endpoints

### Admin site

- Dashboard with job/source/visitor summary
- Job create, edit, delete
- Manual intake from:
  - pasted job URL
  - uploaded job image via OCR
- Source registry and fetch controls
- Approval queue
- Facebook integration panel
- Ads manager
- Analytics view

### Backend ingestion

- Seed default fetch sources
- Run multi-source ingestion
- Parse site-specific HTML/metadata
- Optional browser fetch strategy for pages that need client-side rendering

## Environment Files

### Backend

Local backend settings are loaded from `backend/.env`.

Docker backend settings are loaded from `backend/.env.docker`.

Important backend variables:

```env
DJANGO_SECRET_KEY=replace-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_TIME_ZONE=Asia/Bangkok
DJANGO_CSRF_TRUSTED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
DJANGO_CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000

DB_ENGINE=django.db.backends.postgresql
DB_NAME=dear_career_db
DB_USER=dear_career_user
DB_PASSWORD=dear_career_password
DB_HOST=localhost
DB_PORT=55433

ADMIN_API_SHARED_SECRET=replace-me
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
```

Admin API authentication:

- Admin endpoints expect `x-admin-api-key`
- If `ADMIN_API_SHARED_SECRET` is not set and `DJANGO_DEBUG=True`, backend falls back to:
  - `dear-career-dev-admin-api`

### Frontend

Start from `frontend/.env.example` for local development.

Example:

```env
DJANGO_ADMIN_API_BASE_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

For admin session/login in Docker, `frontend/.env.docker` also includes:

```env
ADMIN_DASHBOARD_USERNAME=admin
ADMIN_DASHBOARD_PASSWORD=
ADMIN_DASHBOARD_PASSWORD_HASH=...
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_SESSION_DURATION_HOURS=12
```

## Local Development

## Option 1: Docker Compose

This is the fastest full-stack setup.

### Start services

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:55433`

### What Docker starts

- PostgreSQL 16
- Django backend with migrations on startup
- Next.js frontend dev server

### Backend container extras

The backend image installs:

- Chromium
- Node/NPM
- OCR dependencies from `requirements.txt`

This matters because browser-based fetch jobs and OCR both run from the backend environment.

## Option 2: Run Without Docker

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

You need a PostgreSQL instance matching the backend `.env` values.

The default settings expect:

- host: `localhost`
- port: `55433`
- database: `dear_career_db`

## Seed and Utility Commands

Run these from `backend/`.

### Seed fetch sources

```bash
python manage.py seed_fetch_sources
```

Default seeded sources include:

- Sabai Job
- JobsDB Thailand
- JobThai
- ThaiNGO Jobs
- UN Jobs Thailand
- LinkedIn

Some are fully fetchable, and some are intentionally manual-only.

### Seed sample jobs

```bash
python manage.py seed_job_categories
```

### Run all enabled fetches

```bash
python manage.py run_fetches
```

### Run JobThai workflow directly

```bash
python manage.py ingest_jobthai
```

## OCR Image Intake

The job editor supports two intake paths:

1. `Fetch from URL`
2. `Image to text`

The OCR flow works like this:

1. Admin uploads an image in the job editor
2. Frontend posts the file to Next.js admin proxy endpoint
   - `/api/admin/proxy/jobs/admin/jobs/ocr`
3. Backend validates the image bytes
4. RapidOCR extracts text from the image
5. Backend heuristically maps text into:
   - title
   - company
   - location
   - salary
   - contact email
   - contact phone
   - employment type
   - descriptions
6. Admin reviews and saves the final job

Notes:

- OCR dependencies are installed in `backend/requirements.txt`
- First OCR run may download OCR model assets depending on environment state
- Image intake is meant to accelerate manual review, not bypass it
- OCR supports 3 modes in the editor: `Fast`, `Balanced`, `Accurate`

## Browser Fetch Support

Some sources cannot be parsed correctly with a plain HTTP request.

The backend includes a browser fetch script under:

- `backend/jobs/browser/fetch.mjs`

This is used for sources that need:

- client-side rendering
- dynamic DOM content
- delayed element availability

The backend Docker image includes Chromium specifically for this workflow.

## API Overview

Core API namespace:

- `/api/jobs/`

Important admin endpoints:

- `POST /api/jobs/admin/jobs/create/`
- `GET|PATCH|DELETE /api/jobs/admin/jobs/<id>/`
- `POST|DELETE /api/jobs/admin/jobs/<id>/image/`
- `POST /api/jobs/admin/jobs/scrape/`
- `POST /api/jobs/admin/jobs/ocr/`
- `GET /api/jobs/admin/sources/`
- `POST /api/jobs/admin/channels/facebook/publish/`
- `GET /api/jobs/admin/dashboard/`

Public endpoints:

- `GET /api/jobs/` (active + published + website-approved jobs)
- `GET /api/jobs/ads/`
- `POST /api/jobs/report/`
- `POST /api/jobs/feedback/`

## Testing and Validation

### Frontend

Type-check:

```bash
cd frontend
npx tsc --noEmit
```

Lint script currently points to:

```bash
npm run lint
```

If your local Next.js version changes lint behavior, prefer `npx tsc --noEmit` first to validate the TypeScript surface.

### Backend

```bash
cd backend
python manage.py test jobs
```

If this fails immediately with `No module named 'django'`, your virtual environment is not active or dependencies are not installed yet.

## Deployment Notes

Before deploying:

- replace all dev secrets
- set a real `ADMIN_API_SHARED_SECRET`
- set secure cookie options
- update allowed hosts and trusted origins
- configure persistent media storage if needed
- verify OCR and browser-fetch runtime dependencies exist in the deployment image
- set `NEXT_PUBLIC_SITE_URL` to your production domain (used by metadata/robots/sitemap)

For Facebook publishing:

- backend needs page credentials
- frontend needs app credentials if using the connect flow

## Publishing Behavior

- New job editor defaults to `published` status.
- `Active listing` controls website visibility eligibility.
- `Publish to website now`:
  - checked = publish immediately
  - unchecked = hold for website approval
- `Post to Facebook now`:
  - checked = attempt Facebook publish on save/update
  - unchecked = keep in Facebook approval flow
- In `Drafted` list, use `Publish + Post` for one-click website + Facebook publish.

Note: Facebook posting still depends on valid page token + permissions (`pages_manage_posts`).

## SEO Notes

- Root/site metadata is configured in Next.js app layout.
- Jobs listing and job detail pages expose canonical URLs and OG/Twitter metadata.
- Job detail page outputs `JobPosting` JSON-LD.
- `sitemap.xml` includes dynamic job detail URLs.
- `robots.txt` blocks `/admin` and `/api`.

## Troubleshooting

### Admin API returns `403 Admin authentication required`

Check:

- frontend admin proxy/session config
- backend `ADMIN_API_SHARED_SECRET`
- request header `x-admin-api-key`

### Frontend loads but admin data is empty

Check:

- `DJANGO_ADMIN_API_BASE_URL`
- backend server availability on port `8000`
- CORS and CSRF origin settings

### OCR upload fails

Check:

- file is a real image
- file size is under 10 MB
- OCR dependencies installed
- backend process has network access if model download is needed

### Draft publishes to website but not Facebook

Check:

- `Post to Facebook now` is enabled
- Facebook page is connected in Admin > Facebook
- token has valid page permissions (`pages_manage_posts`)
- admin notification stream for exact publish failure reason

### Source fetch fails on dynamic sites

Check whether the source is marked for browser fetch and whether Chromium is available in the backend runtime.

## Suggested First Run

```bash
docker compose up --build
```

Then in a second shell:

```bash
docker compose exec backend python manage.py seed_fetch_sources
docker compose exec backend python manage.py seed_job_categories
```

Open:

- public site: `http://localhost:3000`
- admin dashboard: `http://localhost:3000/admin`

Create a job from:

- a pasted LinkedIn/job URL, or
- an uploaded hiring poster image using OCR

## Current Notes

- This repo already contains both manual and automated source ingestion patterns
- Some fetch sources are intentionally warning/manual because the target site is unstable or not machine-friendly
- OCR output is advisory and should still be reviewed before publishing
