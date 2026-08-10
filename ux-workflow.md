# Result And More — User Workflow & UX Spec

Scope: v1, ~60 students / 4 admins, responsive web only. Built off the SRS
(roster/claim split, OAuth, component-based results) and the current schema
(`students`, `users`, `claim_requests`, `courses`, `exam`, `result_components`,
`grading_scale`, `questions`).

---

## 1. Student journey

### 1.1 First sign-in
1. Land on a public landing page — short description, "Sign in with Google" (or
   whichever OAuth provider is chosen).
2. OAuth completes → a `users` row is created (email, provider info, role=student).
3. Backend checks `users.student_id`. It's null → route to **claim request** screen
   instead of the dashboard. This is the fork point for everything below.

### 1.2 Claim request
- Student enters the reg number they believe is theirs.
- Submit creates a `claim_requests` row with `status=pending`.
- Screen switches to a **pending state**: "Your request is waiting on admin
  approval," with the reg number they claimed shown back to them, and a way to
  submit a *correction* if they realize they typo'd the reg number (submits a
  new claim rather than editing the old one — keep the old one visible so an
  admin isn't confused by silent edits).
- No access to results/CGPA/question bank from this state — nav should make
  the locked sections visibly disabled, not hidden, so students understand
  *why* they can't get in yet.

### 1.3 Claim resolved
- **Approved** → `users.student_id` gets set, next visit lands on the
  dashboard. Nothing extra to design here.
- **Rejected** → student sees a rejected state. *(Open question — see §6:
  does this include a reason from the admin, or just "rejected, please submit
  again"?)* Either way, give them a way to submit a new claim immediately —
  don't dead-end them.

### 1.4 Dashboard (claimed student, routine use)
- Landing view after sign-in: name, section, a CGPA summary card, and a link
  into mark history.
- Quick links to: current-term results, full mark history, question bank.

### 1.5 Result lookup
- Student picks a course + term (or it's auto-filtered to their own
  `academic_year`/`semester` courses).
- Shows a component breakdown (attendance / term test 1 / term test 2 / quiz
  / final) plus the summed total and letter grade — not just a final number.
  This matches how `result_components` is actually structured, and it's more
  useful to a student who wants to see where marks were lost.
- **Partial-entry state**: if not every `exam` row has a matching
  `result_components` entry yet, show "results not finalized" rather than a
  misleading partial total — this is a real state given results get entered
  incrementally through the term.

### 1.6 Mark history / CGPA
- Table: term, course, total, grade, credit hours — one row per completed
  course.
- CGPA shown as computed (matches the `student_cgpa` view), with a note that
  it only includes fully-graded courses.
- Empty state for a first-term student with no history yet.

### 1.7 Question bank
- Filter by course and/or instructor (matches FR19).
- Empty state: "No questions yet for this course" rather than a blank screen.
- Result cards: course, instructor, term, and either inline text or a file
  link depending on how that entry was uploaded.

---

## 2. Admin journey

*(Assumption: admin accounts are provisioned directly in the DB/by a super-admin
— there's no self-serve "become an admin" flow. Worth confirming with your team.)*

### 2.1 Admin dashboard
- Landing view: count of pending claims (the thing that needs action most
  often), quick links to student records, courses, results, question bank.

### 2.2 Student records management
- List of `students` rows — reg number, name, section.
- Add/edit a record. Deleting a student record that's already claimed needs a
  confirmation step (it orphans a user's link).

### 2.3 Claim review queue
- List of pending `claim_requests`, each showing the claiming user's email +
  the reg number they claimed.
- **Duplicate-claim state**: if two pending claims name the same reg number,
  surface them together rather than as two disconnected list rows — this is
  the exact "two students pre-registered the same reg number" scenario from
  the SRS, and the UI should make it obvious to the admin so they know to go
  talk to the actual students before approving either one.
- Approve → sets `users.student_id`, marks the row approved, logs to
  `audit_logs`. Reject → marks rejected, *(open question: reason field?)*.

### 2.4 Course & exam-weight setup
- Add a course (code, name, credit hours, year_level, semester, academic_year).
- Per course, define its `exam` rows (attendance/term test 1/term test 2/
  quiz/final + max marks). Since nothing in the DB enforces the four weights
  summing to 100, the form itself should show a running total and warn if it
  doesn't add up — this is the one place client-side validation is doing work
  the database intentionally isn't.

### 2.5 Result entry
- Pick a course + term → see student records for that course/section as rows,
  columns for each `exam` type.
- Enter marks per student per component — this is FR12, the structured
  entry form replacing PDF parsing.
- **Partial-entry state**: an admin should be able to save attendance marks
  early in the term and come back for the final exam later — don't force
  all five components to be filled before saving a row.
- PDF upload (FR10) sits alongside this as a way to *attach the source
  document* for reference, not as a way to populate the form automatically.

### 2.6 Question bank management
- Add an entry: course, instructor, term, then either paste text or attach a
  file. *(Open question — see §6: file uploads or text-only?)*

---

## 3. Screen-by-screen states

Every list/detail screen needs at minimum:
- **Loading** — skeleton or spinner, not a blank page.
- **Empty** — an explanation, not just nothing ("No results yet," "No pending
  claims").
- **Error** — plain language, with a retry action where it makes sense.
- **Success** — the populated view.

The screens with the least obvious extra states, worth designing explicitly
rather than discovering later:
- Claim request screen → pending / approved / rejected are three distinct
  visual states, not just one screen that "sometimes has an error."
- Result lookup → partial vs finalized is a real, expected state, not an
  edge case to patch in later.
- Claim review queue → duplicate-claim grouping, described above.

---

## 4. Navigation structure

**Student nav:** Dashboard · My Results · Mark History · Question Bank ·
(Profile / Sign out)
— all but Dashboard and Profile stay visibly disabled until a claim is
approved, rather than being hidden entirely.

**Admin nav:** Dashboard · Student Records · Claims (badge with pending count) ·
Courses · Results · Question Bank
— separate from the student nav entirely; an admin who's also a student
(if that's ever a real case) would need role-switching, which isn't in
scope for v1 unless you tell me it needs to be.

---

## 5. Open UX questions (carried over from the SRS, need a team decision)

1. Does a rejected claim show the student a reason, or just the fact of
   rejection?
2. Can a student see only their own result/CGPA, or the whole section's?
3. Is the question bank admin-only, or can students submit past questions
   too?
4. Do question entries support file/image uploads, or text only for v1?
5. Can an admin re-open or reassign a claim later (e.g. someone claimed the
   wrong reg number and it's already been rejected)?

These map directly to SRS §7 — worth resolving before result entry and
question bank screens get built, since the answer changes what's on the
form.
