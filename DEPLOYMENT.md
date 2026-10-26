# ÑØVÃ ACE JAMB - Deployment Guide

This guide provides end-to-end instructions for deploying the **ÑØVÃ ACE JAMB** frontend application to any hosting provider.

---

## 1. Quick Start (Local Run)

```bash
# 1. Unzip the project
unzip nova-ace-jamb-frontend-complete.zip
cd nova-ace-jamb-frontend-complete

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL="https://your-project.supabase.co"
# VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-or-publishable-key"

# 4. Run tests
npm test

# 5. Start development server
npm run dev
# The app opens at http://localhost:3000
```

---

## 2. Deploy to Vercel (Recommended)

### Method A: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
# When prompted:
# - Build Command: npm run build
# - Output Directory: dist
# - Set Environment Variables:
#     VITE_SUPABASE_URL
#     VITE_SUPABASE_PUBLISHABLE_KEY
```

### Method B: Vercel Web Dashboard (Git)
1. Push this unzipped folder to a new GitHub / GitLab repository.
2. In Vercel, click **"Add New Project"** and select your repository.
3. The included `vercel.json` automatically configures Vite SPA rewrites (`/* -> /index.html`).
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon/Publishable Key
5. Click **Deploy**.

---

## 3. Deploy to Netlify

### Method A: Netlify CLI
```bash
npm i -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

### Method B: Netlify Web UI
1. Connect your repository to Netlify.
2. Build Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Environment variables:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. SPA Routing:
   - The file `public/_redirects` is already included and copied to `dist/_redirects` during `npm run build`, ensuring all routes resolve properly.

---

## 4. Deploy to Cloudflare Pages

1. In the Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages**.
2. Connect your Git repository.
3. Configure build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
5. Cloudflare Pages automatically respects `_redirects` in `dist/`.

---

## 5. Deploy with Docker (Self-Hosted / VPS / Coolify / Render / Fly.io)

A multi-stage `Dockerfile` and `nginx.conf` are included in the root directory.

### Build & Run locally or on VPS:
```bash
# Build the Docker image
docker build -t nova-ace-jamb:latest .

# Run container on port 80 (or map to 3000)
docker run -d -p 80:80 --name nova-ace nova-ace-jamb:latest
```

### Run with Docker Compose (`docker-compose.yml`):
```yaml
services:
  web:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```
Run `docker compose up -d`.

---

## 6. Supabase Backend Setup

ÑØVÃ ACE JAMB integrates seamlessly with Supabase Postgres, Auth, and Storage.

1. **Create a Supabase Project:**
   - Sign up or log into [supabase.com](https://supabase.com).
   - Create a new project.

2. **Run Migrations:**
   - Navigate to **SQL Editor** in the Supabase Dashboard.
   - Execute the SQL migration scripts located in `./supabase/migrations/` and `./docs/catalog/`.
   - The migrations establish the `ace` schema:
     - `ace.profiles`: Student profiles, target scores, streak counts, daily minutes.
     - `ace.subjects`: UTME subject catalog (Use of English, Mathematics, Physics, etc.).
     - `ace.syllabuses`: Authoritative IBASS 2026/2027 syllabus breakdown.
     - `ace.cbt_sessions`: Complete JAMB CBT simulator exam runs, answer logs, and timing.
     - `ace.diagnostics`: Baseline assessments and topic mastery scores.

3. **Configure Authentication:**
   - In Supabase Dashboard > **Authentication** > **Providers**, enable **Email / Password** and optionally **Google OAuth**.
   - Under **URL Configuration**, set the Site URL to your production domain (e.g., `https://your-domain.com`).

4. **Environment Variables:**
   - In Supabase Dashboard > **Settings** > **API**:
     - Copy **Project URL** -> `VITE_SUPABASE_URL`
     - Copy **Project API Key (anon/public)** -> `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 7. Build & Verification Checklist

Before shipping to production, verify:
- [x] Run `npm test` -> 21/21 contract & PWA tests passing.
- [x] Run `npm run lint` -> TypeScript checks pass without errors.
- [x] Run `npm run build` -> Clean bundle output in `dist/`.
- [x] Service worker caching active in production mode (`sw.js`).
- [x] Responsive layout tested across mobile, tablet, and desktop viewports.
