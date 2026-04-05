# Current Frontend Behavior (Baseline Spec)

This document freezes what the frontend currently does, so backend parity work can be validated step-by-step.

## Graduate submission payload

Source: `frontend/src/lib/actions.ts`

Fields (required unless marked optional):

- `full_name`
- `student_number?`
- `email?`
- `phone?`
- `campus`
- `school` (school id, e.g. `sci`)
- `department` (department id, e.g. `cs`)
- `programme` (programme name string)
- `graduation_year` (string; parsed with `parseInt(_, 10)`)
- `employment_status`
- `employer_name?`
- `job_title?`
- `sector?`
- `employment_county?`
- `months_to_employ?` (stored as string or null)
- `linkedin_url?`

### Validation rules (current)

Validation happens in `resolveRow(payload)`:

- `school` must match an entry in `MUST_SCHOOLS` → error `"Invalid school"`.
- `department` must match within the selected school → error `"Invalid department"`.
- `programme` must be included in the selected department’s `programmes[]` list → error `"Invalid programme"`.
- Programme DB resolution:
  - looks up `programmes.id` by `department_id == payload.department` and `name == payload.programme`
  - if not found or any query error → `"Could not resolve programme"`.

Notes:

- There is **no** current rule enforcing “email or phone required”.
- There is **no** current rule enforcing valid `graduation_year` beyond `parseInt` (NaN is not explicitly handled here).

### Insert behavior (current)

- Single insert: inserts one row into `graduates` and returns `{ success: true, id }`.
- Bulk insert:
  - resolves rows sequentially
  - rows failing validation are returned in `failed[]` with 1-based `row` numbers
  - inserts valid rows in chunks of 100
  - if a chunk insert fails, every row in that chunk is recorded as failed with the same error message

## Dashboard aggregates

Source: `frontend/src/lib/dashboard-queries.ts`

- Fetch: selects `*` from `graduates` ordered by `created_at desc`.
- “Employed” statuses are exactly:
  - `Employed (Full-time)`
  - `Employed (Part-time)`
  - `Self-employed / Entrepreneur`
  - `Internship / Attachment`
- Aggregations:
  - `bySchool`: counts by `school_name`, then maps to shortened school label (text inside parentheses) and sorts by `count desc`.
  - `byStatus`: counts by `employment_status`, sorts by `count desc`.
  - `byYear`: counts by `graduation_year` and employed count per year, sorts by `year asc`.
  - `bySector`: counts by `sector` (only non-null), maps to shortened label (parentheses or first 25 chars), sorts by `count desc`.
  - `byCampus`: counts by `campus`, sorts by `count desc`.
  - `byDepartment`: counts by `department_name`, includes a `school` label derived from `school_name`, sorts by `count desc`.
  - `byMonthsToEmploy`: counts by `months_to_employ` (only non-null), sorts by `count desc`.
  - `employmentRate`: `round(employed.length / total * 100)` (0 when total is 0).

