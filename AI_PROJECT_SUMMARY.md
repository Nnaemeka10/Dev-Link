# Dev-Link — AI Project Summary

Purpose
-------
This document summarizes the Dev-Link repository so an AI model (or a human reviewer) can understand the full project structure, key components, packages, environment variables, runtime commands, APIs, authentication, and where migrations and important logic live — without needing to upload every single source file.

High-level overview
-------------------
- Type: Full-stack job board example (frontend + backend)
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript (ts-node, ESM loader)
- Database: PostgreSQL (Supabase used in .env)
- Querying: @tanstack/react-query on frontend
- Auth: Simple client-side auth on frontend (context + localStorage), server has auth routes and related controllers
- Migrations: SQL migration file executed on server startup

Top-level folders (what matters)
--------------------------------
- `src/` (frontend React app)
  - `App.tsx` — router and route registration
  - `pages/` — page components (Home, Jobs, JobDetails, Login, Dashboard, PostJob)
  - `context/AuthContext.tsx` — Auth provider (persists user to localStorage)
  - `hooks/authContext.ts` — useAuth hook wrapper
  - `components/ProtectedRoutes.tsx` — route guard for server-protected pages
  - `api/jobsApi.ts` — frontend API helpers (talk to backend/json-server)

- `backend/` (server)
  - `src/server.ts` — Express server entry (calls connectDB() on start)
  - `src/lib/db.ts` — database connection + migration runner (reads `backend/migrations/001_initial_schema.sql` and executes it)
  - `migrations/001_initial_schema.sql` — SQL used to create roles, users, and related tables
  - `src/routes/` — Express routes (e.g., `auth.route.ts`)
  - `src/controllers/` — auth controllers (signup, login, logout) (if present)
  - `.env` — environment variables (contains POSTGRES_URI, JWT_SECRET, etc.)

Important files and what they do
--------------------------------
- `src/context/AuthContext.tsx` (frontend): Implements `AuthProvider`:
  - Keeps `user` state in React context
  - Persists to `localStorage` under key `user`
  - Exposes `login(username)` and `logout()` functions

- `src/hooks/authContext.ts` (frontend): Provides `useAuth()` hook that reads `AuthContext` and throws if used outside provider.

- `src/components/ProtectedRoutes.tsx` (frontend): Uses `useAuth()` to redirect unauthenticated users to `/login` and renders `<Outlet />` when authenticated.

- `backend/src/lib/db.ts`: Connects to Postgres using `pg.Pool` and runs migrations on startup via `runMigrations()`.
  - The migration file executed is `backend/migrations/001_initial_schema.sql`.
  - If migrations file is missing, it logs and continues.
  - If a connection error occurs (e.g., ENOTFOUND), the server logs error and exits.

- `backend/src/server.ts`: Starts Express and calls `connectDB()` after listening; attaches routes like `/api/auth`.

- `src/api/jobsApi.ts` (frontend): Fetches jobs from `http://localhost:3001/jobs` (uses API_URL constant pointing to backend server or json-server)

Packages / Dependencies (frontend)
----------------------------------
Extracted from top-level `package.json`:
- react, react-dom, react-router-dom
- @tanstack/react-query
- react-hook-form, zod, @hookform/resolvers
- tailwindcss, @tailwindcss/vite
- framer-motion (for mouse effect)

Packages / Dependencies (backend)
---------------------------------
- `pg` (Postgres client)
- `express`, `cookie-parser`, `cors`
- `ts-node`, `nodemon` (dev), TypeScript
- (Check `backend/package.json` for exact list — include in manifest if you want)

Environment variables (from `backend/.env`)
------------------------------------------
Do NOT share secrets publicly. Replace values with placeholders before sending to external AI if privacy is a concern.

- `PORT` (backend port, default 3000)
- `POSTGRES_URI` (Postgres connection string; currently set to a Supabase host) — If DNS errors occur (ENOTFOUND), verify this value and project status.
- `NODE_ENV` (development | production)
- `CLIENT_URL` (frontend origin for CORS, e.g., http://localhost:5173)
- `JWT_SECRET` (used for token signing)
- `CLOUDINARY_*` (optional for file uploads)
- `ARCJET_*` (optional keys)

Runtime / Start commands
------------------------
- Frontend (root project):
  - Install: `npm install`
  - Dev: `npm run dev` (runs Vite, default port 5173)

- Backend (from `backend/`):
  - Install: `npm install` (in `backend` folder)
  - Dev: `npm run dev` (runs `nodemon` that starts `node --loader ts-node/esm src/server.ts`)

Key endpoints (backend)
-----------------------
- `POST /api/auth/signup` — create new user (controller in backend)
- `POST /api/auth/login` — login (returns cookie or token depending on implementation)
- `POST /api/auth/logout` — logout
- Jobs API endpoints are implemented in `src/api/jobsApi.ts` on the frontend and expect a jobs backend (either json-server or your own API on port 3001)

Where migrations run from
------------------------
- `backend/src/lib/db.ts` contains `runMigrations()` which resolves the absolute path and executes `backend/migrations/001_initial_schema.sql` on startup.

Common issues & debug notes
---------------------------
- DNS ENOTFOUND for Supabase host: ensure the POSTGRES_URI host is correct and reachable. Use `ping <host>` or `nslookup` from your environment.
- If migration file cannot be found, check the resolved path printed by `path.resolve()` and ensure the `migrations` folder exists at repository root or adjust path logic.
- If using special characters in the DB password, ensure the `POSTGRES_URI` is URL-encoded (e.g., `@` -> `%40`, `$` -> `%24`).

What to provide to external AI for best results
---------------------------------------------
1. `AI_PROJECT_SUMMARY.md` (this file)
2. `ai_project_manifest.json` (machine-readable manifest) — created alongside this file
3. A redacted `.env` (replace secrets with placeholders; keep hostnames and port values)
4. `package.json` files (root and backend) — they list exact dependencies and scripts
5. Optionally, a short sample of `backend/src/lib/db.ts` and `backend/src/server.ts` if you want the AI to analyze connection logic

Privacy reminder
----------------
Do not upload `.env` or any secrets to public AI endpoints without redacting sensitive values (passwords, API keys, private tokens). Replace them with placeholders like `POSTGRES_URI=postgresql://postgres:<REDACTED>@...`.

How to use these files with an AI
---------------------------------
- Upload `ai_project_manifest.json` and `AI_PROJECT_SUMMARY.md` to the AI tool first. The manifest provides structured data, and the summary gives context and human-readable explanations.
- If the AI tool allows follow-up file uploads, upload only the minimal sets requested (controllers, routes, or configs) instead of the whole repo.

If you want, I can also:
- Produce a redacted `.env` suitable for AI upload
- Add a script that prints the exact migration path and resolved POSTGRES_URI at server startup (for debugging)
- Create a small `backend/README.md` with run/debug steps

-- End of summary
