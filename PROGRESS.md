# Optima — Work Status & Progress

Last updated: 2026-08-09

Use this file to resume work. It reflects the state after implementing the
`ux-workflow.md` student + admin journeys (API routes + frontend pages).

---

## Goal

Ship the Result And More portal (v1) against:

- `ux-workflow.md` — screen/state/nav UX
- `schema.sql` / `src/db/schema.ts` — data model
- Better Auth Google OAuth + Drizzle + PostgreSQL

---

## Done

### Auth & session
- Better Auth Google OAuth (`src/lib/auth.ts`, `/api/auth/[...all]`)
- Session helpers with `role` + `studentId` (`src/lib/session.ts`)
- `/api/auth/me` returns user + linked student + claim status
- Middleware protects app routes; `/claims` redirects to `/admin/claims`
- Unclaimed students hitting `/dashboard` redirect to `/claim`

### Data layer (`src/lib/data.ts`)
- Student Records CRUD + claimed-delete awareness
- Claim create / list / approve / reject + audit logs
- Auto-reject other pending claims for same reg on approve
- Courses + exam weight replace
- Result component upsert (partial entry allowed)
- Result detail with finalized vs not-finalized
- Mark history + CGPA (fully-graded courses only)
- Question bank list/create/delete
- Default grading scale auto-seed if table empty

### API routes
| Route | Methods | Notes |
|---|---|---|
| `/api/auth/me` | GET | Session + claim status |
| `/api/claims` | GET, POST | Admin list / student mine+submit |
| `/api/claims/[id]` | GET, PATCH | Approve/reject |
| `/api/students` | GET, POST | Admin student records |
| `/api/students/[id]` | GET, PATCH, DELETE | `?confirm=1` if claimed |
| `/api/courses` | GET, POST | |
| `/api/courses/[id]` | GET, PATCH, DELETE | Includes exams on GET |
| `/api/courses/[id]/exams` | GET, PUT | Weight sum warning |
| `/api/results` | GET, POST | Student scoped; `?grid=1` admin entry |
| `/api/history` | GET | History + CGPA |
| `/api/questions` | GET, POST | `?meta=1` instructors |
| `/api/questions/[id]` | DELETE | Admin |
| `/api/dashboard` | GET | Role-aware summary |

### Student pages
| Path | Status |
|---|---|
| `/` | Landing + sign-in CTA |
| `/auth/login` | Google sign-in |
| `/claim` | Submit / pending / rejected / correction |
| `/dashboard` | CGPA + quick links (redirects if unclaimed) |
| `/results` | Component breakdown + partial state |
| `/history` | Table + CGPA note + empty state |
| `/questions` | Filters + empty state |

### Admin pages
| Path | Status |
|---|---|
| `/dashboard` | Pending claims + shortcuts |
| `/admin/roster` | Add/edit/delete with claimed confirm |
| `/admin/claims` | Queue + duplicate-reg grouping |
| `/admin/courses` | Create course + exam weights UI |
| `/admin/results` | Student records×exam grid, partial save, PDF URL ref |
| `/admin/questions` | Text and/or file URL entries |

### Nav
- Student: Dashboard · My Results · Mark History · Question Bank · Claim  
  (Results / History / Questions **visibly disabled** until claimed)
- Admin: Dashboard · Student Records · Claims (badge) · Courses · Results · Question Bank
- Shared shell: `src/app/HeaderShell.tsx`

### Tooling
- `npm run build` succeeds (verified 2026-08-09)
- Shared UI helpers: `src/components/ui.tsx`
- Exam constants (client-safe): `src/lib/exams.ts`
- Page guards: `src/lib/guards.ts`
- API helpers: `src/lib/api.ts`

---

## v1 product decisions already applied

From open questions in `ux-workflow.md` §5 / SRS §7:

1. **Rejected claims** — show admin reason when present; otherwise generic retry copy
2. **Result visibility** — students see **only their own** results/CGPA
3. **Question bank write access** — admin-only; students read
4. **Question attachments** — text and/or **file URL** (no binary upload yet)
5. **Claim reopen** — not in v1; student submits a **new** claim after reject/correction

Admin accounts are **not** self-serve. Promote in DB:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'someone@example.com';
```

---

## Not done / next candidates

Priority order suggested for the next session:

1. **DB apply / migrate**
   - Ensure Postgres is up and schema is pushed (`npm run db:push` or apply `schema.sql`)
   - Confirm Better Auth tables + app tables + grading_scale exist
   - Identity columns were added in Drizzle schema (`generatedByDefaultAsIdentity`); verify against existing BIGSERIAL tables before push

2. **End-to-end smoke test**
   - OAuth login → claim → admin approve → results unlock
   - Duplicate claim grouping
   - Partial result entry → student sees “not finalized”
   - Full components → grade + CGPA

3. **Binary file uploads** (if decided)
   - Replace plain `fileUrl` text field with storage (S3/local) for questions + result source PDFs

4. **Polish**
   - Client redirect on locked student pages (not only disabled nav + API 403)
   - Stronger loading skeletons
   - Persist PDF source URL on results (currently UI-only reference field)
   - Role-switching if admin-also-student ever needed (explicitly out of v1)

5. **Cleanup**
   - `src/lib/mock-data.ts` is unused legacy mock data — safe to delete when convenient
   - Deprecated stubs still at bottom of `src/lib/data.ts` (`getDashboardData`, etc.)

6. **Tests / CI**
   - No automated tests yet
   - No GitHub Actions yet

---

## Key files map

```
ux-workflow.md                 ← UX source of truth
schema.sql                     ← SQL reference schema + views
src/db/schema.ts               ← Drizzle schema (Better Auth + app)
src/lib/data.ts                ← Domain queries / mutations
src/lib/auth.ts                ← Better Auth config
src/lib/session.ts / api.ts / guards.ts / exams.ts
src/app/HeaderShell.tsx        ← Role-aware nav
src/app/claim/page.tsx
src/app/dashboard/page.tsx
src/app/results|history|questions/page.tsx
src/app/admin/*/page.tsx
src/app/api/**/route.ts
src/middleware.ts
```

---

## How to run locally

```bash
# Postgres (example from README)
docker run --name optima-postgres \
  -e POSTGRES_DB=optima -e POSTGRES_USER=optima -e POSTGRES_PASSWORD=optima123 \
  -p 5432:5432 -d postgres:16-alpine

npm install
# ensure .env.local has DATABASE_URL, GOOGLE_CLIENT_*, BETTER_AUTH_URL/SECRET
npm run db:push
npm run dev
```

Open http://localhost:3000

---

## Resume prompt (copy/paste)

> Read `PROGRESS.md` and continue from “Not done / next candidates”. Prefer item #1–2 (DB apply + E2E smoke) unless I specify otherwise. Keep changes aligned with `ux-workflow.md`.
