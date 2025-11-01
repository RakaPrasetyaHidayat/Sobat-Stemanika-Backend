# Sobat Stemanika — Backend

This repository contains the backend for the Sobat Stemanika election app (ketua OSIS / MPK). The backend uses Supabase for auth and data storage and exposes a small REST API.

Important notes
- This repo is backend-only (no frontend files present). If you previously had a `frontend/` folder it was removed; current project contains only `server/` code.
- Authentication: Supabase Auth (email/password). The API expects a Bearer token (access token) in `Authorization` header for protected endpoints.
 - Server JWTs: the server can also issue its own JWTs on login which are signed with `JWT_SECRET` and include the user's `id` and `role`. If you set `JWT_SECRET` in your `.env` the `/api/auth/login` endpoint will return a server token in the `token` field. Protected endpoints accept either the server JWT or a Supabase access token.
- NISN / NIP: optional during registration — you may pass `nisn`, `nip`, or `nisn_nip`. If omitted, it will be stored as `null`.
- Voting rules: a student (`siswa`) can only vote once per `pemilihan` (e.g. `ketua_osis`, `wakil_osis`, `ketua_mpk`, `wakil_mpk`). The server enforces this by checking `Votes` table for existing rows with the same `user_id` and `pemilihan`.

Quick start (local)

1. Copy `.env.example` to `.env` and set these variables:

```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-service-role-or-anon-key
PORT=3000
JWT_SECRET=some-long-random-secret
```

2. Install and run locally:

```powershell
npm install
npm run dev   # or npm start
```

When the server starts it prints the URL including `http://localhost:PORT` so you can open it in the browser.

API Reference (summary)

Base path: `/api`

Authentication

- POST /api/auth/register
  - Body (JSON): { email, password, nama, nisn_nip?, nisn?, nip? }
  - Notes: `nisn_nip` is optional. If `nisn` or `nip` are provided they're used to populate `nisn_nip`.
  - Behavior: role is set server-side to `siswa` and cannot be provided by the client.
  - Response: 201 created + user object

- POST /api/auth/login
  - Body (JSON): { email, password }
  - Response: { token?, access_token?, user }
    - `token`: server-signed JWT (present when `JWT_SECRET` is set). Use it in `Authorization: Bearer <token>` for subsequent requests.
    - `access_token`: Supabase access token (also accepted by the server).

- GET /api/auth/me
  - Headers: Authorization: Bearer <access_token>
  - Response: { user }

Eskul (extracurricular)

- GET /api/eskul
  - Public: returns list of eskul

(See `server/routes/eskul.js` for the full set of eskul endpoints)

Kandidat (candidates) — admin actions

- GET /api/kandidat
  - Public
- POST /api/kandidat
  - Admin only (requires Authorization Bearer token where user's metadata role = 'admin')
  - Body: candidate fields
- DELETE /api/kandidat/:id
  - Admin only

Voting

- POST /api/vote
  - Role: siswa only
  - Headers: Authorization: Bearer <access_token>
  - Body: { pemilihan, kandidat_id }
    - `pemilihan` must be one of the election types your app uses (for example `ketua_osis`)
    - `kandidat_id` is the chosen candidate id
  - Behavior: The server checks the `Votes` table for any existing row matching (user_id, pemilihan). If present, server responds 409 (already voted). If not, it inserts a Vote row.
  - Response: 201 created + vote row

- GET /api/vote/me
  - Role: siswa only
  - Returns all votes by the authenticated user

- GET /api/vote/results?pemilihan=ketua_osis
  - Public
  - Returns aggregated counts keyed by `kandidat_id`

Database

This backend expects the following Supabase tables (example names):
- Users (managed by Supabase Auth + profile table `Users` for extra fields)
- Eskul
- Kandidat
- Votes (columns: id, user_id, pemilihan, kandidat_id, created_at)

Voting rule enforcement: the backend checks the `Votes` table before inserting, to prevent multiple votes per `pemilihan` for the same user.

Deploying to Vercel

Vercel prefers serverless functions instead of long-running Express servers. You have three options:

1. Use Vercel Serverless Functions — rewrite the Express app into `api/*` functions (recommended for small apps).
2. Deploy with Docker on Vercel (Enterprise) — run a container with your Express app.
3. Use a VM / container-friendly host (Render, Railway, Fly, Heroku) for a simple Node server.

If you still want to use Vercel:
- Either refactor to serverless functions under `/api` and keep the same logic, or
- Use a separate host for the Node server and serve the frontend from Vercel.

Notes for Vercel:
- Add environment variables (SUPABASE_URL and SUPABASE_KEY) in the Vercel project settings.
- Set the build and start commands according to your deployment method.

Examples (curl)

Register (optional nisn):

```bash
curl -X POST https://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"siswa@example.com","password":"secret","nama":"Siswa A","nisn":"123456"}'
```

Login:

```bash
curl -X POST https://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"siswa@example.com","password":"secret"}'
```

Vote (example):

```bash
curl -X POST http://localhost:3000/api/vote \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{"pemilihan":"ketua_osis","kandidat_id":123}'
```

If you want, I can:
- Convert the Express app to Vercel serverless handlers (one-by-one), or
- Add a minimal `vercel.json` and example serverless wrapper.

Contact / next steps

Tell me if you want me to:
- Convert endpoints to Vercel serverless functions now (I can start with the `api/vote` and `api/auth` functions), or
- Keep the Express app and add a Dockerfile so you can deploy as a container.

Manual admin creation

If you need to create an `admin` account from the backend, you can use the protected endpoint:

- POST /api/auth/create-admin
  - Headers: `x-admin-secret: <ADMIN_SECRET>` (or include `admin_secret` in the POST body)
  - Body (JSON): { email, password, nama, nisn_nip?, nisn?, nip? }
  - Env: set `ADMIN_SECRET` in your `.env` file to a shared secret known only to you.
  - Behavior: When the correct secret is provided the endpoint will create a Supabase user and set `role = 'admin'` in user metadata and the `Users` profile table.

Security note: keep `ADMIN_SECRET` private and do not expose this endpoint to untrusted clients. Alternatively, create admin users directly in Supabase dashboard for the safest approach.

---
Generated README with API docs and deployment notes.
