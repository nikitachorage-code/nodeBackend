# Doctor Certification Platform: Requirements (Draft v0.3)

> Saved from the spec pasted in the project conversation. Source of truth for the backend.

## 1. Purpose
A platform where doctors (candidates) work toward becoming **Diplomates** by completing certifications over repeating 3-year cycles. Two portals share one backend:

- **Admin portal**: view and manage candidates/diplomates, and configure which forms/fields candidates see.
- **User (candidate) portal**: register, view cycle progress, fill the admin-configured forms, add certifications.

**Terminology**
- **Candidate**: registered user with no active certification on record (includes lapsed users).
- **Diplomate**: user with at least 1 certification on record (certifications are auto-accepted, so this is immediate on upload).
- **Cycle**: a block of 3 consecutive years. Cycles repeat for as long as the user's account exists.
- **Lapse**: losing all certifications because nothing was uploaded for the first 2 years of a cycle (section 5). A lapsed user becomes a Candidate again.
- **Step**: a form section (e.g. Personal Information, Education) containing configurable fields.

## 2. Roles
| Role | Access |
|------|--------|
| Admin | Admin portal: view all users, configure steps/fields, edit and delete users |
| Candidate / Diplomate | User portal: own data only |

Admins **cannot** add or upload certifications for a user. Only the user adds their own certifications.

## 3. Admin Portal

### 3.1 Authentication
- FR-A1: Email + password login. Admin accounts are seeded or created by another admin (no public admin registration).
- FR-A2: Logout, session expiry, password reset.

### 3.2 Users list (main screen)
Layout: **left sidebar + main table**.

- FR-A3: Table lists all candidates and diplomates. Default columns: name, email, passport no., status (Candidate/Diplomate), certifications progress (e.g. `5/6`, see open question 1), registered date.
- FR-A4: Columns shown follow the configured steps/fields (see 3.3).
- FR-A5: Filters: Candidate / Diplomate / All, plus search by name/passport/cert no., sort, pagination.
- FR-A6: Row actions: **View**, **Edit** (profile/step data only), **Delete** (with confirmation, soft delete).
- FR-A7: Export to CSV/Excel (suggested).
- FR-A8: View a user's certification history and how their completion was calculated (read-only).

### 3.3 Step configuration (sidebar)
- FR-A9: Admin can create, rename, reorder, enable/disable **steps**.
- FR-A10: Within a step, admin can add/edit/remove/reorder **fields** and set: label, type, required, help text, visibility.
- FR-A11: Field types: text, long text, number, date, dropdown, checkbox, file upload.
- FR-A12: Changes apply to **all users**. Data is preserved when a field is hidden. Data for removed fields is archived, not lost.
- FR-A13: Config changes are audited (who, what, when).
- FR-A14: The certification form (section 4.3) is configured the same way as other steps. The certificate file is a fixed system field and cannot be removed. The cycle year is not entered by the user: it is derived from the upload date.

**Default steps and fields (proposed, all editable by admin)**

| Step | Fields |
|------|--------|
| Personal Information | Full name, date of birth, gender, nationality, passport number, passport expiry, phone, address, country |
| Education | Medical school, degree (MBBS/MD/etc.), graduation year, specialty, sub-specialty |
| Professional | Medical license number, issuing authority/country, license expiry, current employer/hospital, years of experience |
| Certification (repeatable, one entry per upload) | Upload date (system, read-only), certification number, certification name/board, issuing body, issue date, expiry date (optional), certificate file (system) |

## 4. User (Candidate) Portal

### 4.1 Registration and login
- FR-U1: **Open registration**: anyone can register with email + password (name required). Email verification required before access.
- FR-U2: Login, logout, forgot/reset password.

### 4.2 Dashboard (cycle screen)
- FR-U3: Shows the current cycle as 3 year tiles (Year 1, 2, 3 with the actual years), each marked has-certification / missing / current / upcoming, plus past cycles.
- FR-U4: Shows progress (e.g. `5/6`), status (Candidate/Diplomate), and a clear warning when the user is at risk of lapsing (see section 5).

### 4.3 Forms
- FR-U5: Step-by-step forms rendered from the admin configuration (personal, education, professional).
- FR-U6: **Add certification** form: fill configured fields (the year is set automatically from the upload date), upload certificate (PDF/image). Certifications are **accepted automatically**, with no admin review.
- FR-U7: Save draft, edit before submit, validation per admin-defined required fields.
- FR-U8: Users can see only their own data. Users can view, edit and delete their own certifications. All changes are audit-logged and cycle/lapse status is recalculated.

## 5. Cycle and Lapse Rules (interpretation, please confirm)

1. **Cycle start**: a user's first cycle starts when they register **and complete the onboarding forms**. Registering alone does not start it.
2. **Cycle** = 3 years from that start, as three 12-month periods. Example: started in 2016, so Year 1 = 2016, Year 2 = 2017, Year 3 = 2018, and the cycle ends when 2019 begins. The next cycle follows immediately, and cycles continue as long as the account exists.
3. **Year of a certification** = the year-period its **upload date** falls in. The upload date is set by the system and cannot be edited, so editing a certification never moves it to another year. (Deleting it does remove it.)
4. **Lapse rule**: when the user reaches Year 3 of a cycle, if they have **no certification uploaded in Year 1 and none in Year 2** (e.g. nothing for 2016 and 2017), they **lose all their certifications** and become a **Candidate** again. One upload in either Year 1 or Year 2 is enough to avoid lapsing in that cycle. Because the year comes from the upload date, a missed year cannot be back-filled.
5. **After a lapse**, the user stays a Candidate with their profile intact. A new cycle starts on their **next certification upload**, and the rules repeat.
6. **Progress** (`5/6`) = certifications completed out of the **required number per cycle**. The required number is **6 by default** and is an admin-configurable setting (assumption, see open question 1).
7. **Expiry**: the expiry date is an optional informational field. It does not affect progress or lapse in v1 (see open question 2).
8. Status and progress are **computed from certification records**. Users can edit and delete their own certifications, so everything recalculates on each change. A daily job updates statuses and sends warning emails before the Year 3 cut-off.
9. Lost certifications are **archived** (marked lapsed, hidden from the active list), not hard-deleted, so there is an audit trail.

## 6. Data Model (high level)
- `User` (id, email, password_hash, role, status, email_verified, cycle_start_date, created_at, deleted_at)
- `Step` (id, title, order, enabled) and `Field` (id, step_id, label, type, required, order, options, system_flag)
- `StepResponse` (user_id, field_id, value, updated_at)
- `Certification` (id, user_id, cycle_no, data JSONB, file_url, status: active/lapsed, uploaded_at (immutable))
- `Setting` (key, value), e.g. `required_certifications_per_cycle = 6`
- `AuditLog` (actor, action, entity, before/after, timestamp)

Dynamic form values use a flexible store (JSONB or EAV) because fields are admin-configurable. Cycle completion is derived and may be cached on `User` for table performance.

## 7. Non-Functional
- Security: password hashing (bcrypt/argon2), JWT or session cookies, role-based access control, rate limiting on auth.
- Privacy: demo app with no compliance requirements, but keep uploaded files private (not publicly listable).
- File uploads: type/size limits; files stored locally in the demo.
- Responsive and accessible UI (WCAG AA).
- Email: verification, password reset, lapse warnings.

## 8. Suggested Tech Stack (open to change; demo-sized, so keep it simple)
- Frontend: React + TypeScript, Tailwind, TanStack Table, React Hook Form with a schema-driven form renderer. Two route groups (`/admin`, `/app`) in one app.
- Backend: Node.js (NestJS/Express), REST API, scheduled job for lapse checks.
- DB: PostgreSQL (JSONB). File storage: S3-compatible.

## 9. Out of Scope (v1)
Payments, exam scheduling, admin approval workflow, admin-added certifications, multi-language, mobile app.

## 10. Open Questions
Decided:
- `5/6` = certifications completed out of 6 required **per cycle**.
- The next cycle starts on the next upload after a lapse.
- Certifications belong to the year of their upload date.
- A user with no certifications is a Candidate (this also applies if they delete their last one).
- There is a single admin role.
- This is a **demo app**, so compliance and hosting requirements are out of scope.
- The ADA field is removed.

Still open (defaults assumed, only change if wrong):
1. **Expiry**: informational only. Expired certifications still count toward the 6.
2. **Admin-configurable required count**: assumed yes (default 6, a setting). Say if it should be hard-coded instead.

---

# Backlog: Recommendations to Review Later
Not part of v1 scope yet. Review after the first build.

## A. Rule gaps to decide
- Per-cycle count: certifications count only toward the cycle they were uploaded in (assumed).
- Time zone: store upload date in UTC, show the user's local date.
- Cycle start: once started, a cycle is never un-started, even if admin later adds required fields.
- Lapse check: idempotent daily job plus on-demand computation. Certification records are the source of truth.
- Archived (lapsed) certifications count toward nothing.
- Step config changes: new required fields prompt existing users but do not undo their cycle. Block field type changes once data exists. Soft-delete fields so old data stays readable.
- Admin editing a user: define which fields are editable. Changes to email/passport are audit-logged.

## B. Possible features
- Admin dashboard counts (total candidates, diplomates, at-risk users).
- "At risk" filter: users in Year 3 with no uploads in Years 1 and 2.
- User profile page: change password, view archived certification history.
- Notifications: in-app banner (demo), email later, before Year 3 and after a lapse.
- Admin account management: one seeded admin plus a password-reset script.
- Empty and error states: no users, upload failed, session expired, validation messages.
- Account deletion: decide whether to delete or keep the user's files with the soft delete.
- Diplomate perks: badge or certificate view (decide what a Diplomate sees).
- Per-user cycle drill-down in the admin view.
- CSV export of users.

## C. Stability and robustness
- Cycle, lapse and progress logic in one tested module. The frontend only displays API results.
- Unit tests for date edges: year boundaries, leap years, lapse on day 1 of Year 3, upload at the boundary, deleting the last certification, lapse then new upload.
- Injectable "current date" so lapse scenarios can be tested without waiting years.
- Database migrations (Prisma or Knex), not manual table creation.
- Server-side validation (e.g. Zod) for requests and for admin-defined dynamic forms. Check values against the configured field definitions.
- Authorization: user endpoints filter by the logged-in user's ID, admin endpoints require the admin role. Tests that a user cannot read another user's data or files.
- File uploads: server-side type/size checks, random file names, served through an authenticated endpoint.
- Audit log for admin edits, deletes, config changes, lapses, and certification edits/deletes.
- Soft delete (`deleted_at`) on users and certifications.
- Consistent API error format and status codes.
- Seed script: one admin plus demo users in each state (new candidate, active diplomate, about to lapse, lapsed).
- Basics: password hashing, login rate limiting, CORS, secrets in environment variables, README with setup steps.

## D. Product decisions pending
1. What does a Diplomate see that a Candidate does not?
2. How detailed should the admin per-user progress view be?
3. Confirm a single global form configuration for all users.
4. Is a CSV export wanted in the demo?
