# API Contract (Endpoints + Payloads)

This defines the backend endpoints that replace the current Next.js server actions.

## Conventions

- Content type: JSON.
- Use consistent error shape for non-2xx responses.
- Keep the *meaning* of current error messages, even if the exact wording evolves.

### Standard error shape

```json
{ "error": "Human-readable message", "code": "optional_machine_code" }
```

## Public endpoints

### Submit graduate

- `POST /api/graduates`

Request body (mirrors current `GraduatePayload`):
- `full_name` (required)
- `student_number` (optional)
- `email` (optional; require at least one of email or phone)
- `phone` (optional; E.164-ish)
- `campus` (required)
- `school` (required; school id)
- `department` (required; department id)
- `programme` (required; programme name string)
- `graduation_year` (required; string in UI, validate + parse to int)
- `employment_status` (required; allowed set)
- `employer_name`, `job_title`, `sector`, `employment_county`, `months_to_employ`, `linkedin_url` (optional)

Response:
- `201 { "id": number }`

Errors:
- `400` for validation errors (invalid school/department/programme, missing contact info, invalid year, etc.)
- `500` for unexpected failures

### Bulk insert

- `POST /api/graduates/bulk`

Request body:
- `payloads: GraduatePayload[]`

Response (mirrors current bulk result):
- `{ "inserted": number, "failed": [{ "row": number, "error": string }] }`

## Committee endpoints

### Login (verify PIN)

- `POST /api/committee/login`
  - sets an HTTP-only cookie if PIN is valid

Request:
- `{ "pin": "string" }`

Response:
- `200 { "success": true }` (or `401` for incorrect PIN)

Cookie requirements (parity with current behavior):
- HTTP-only
- `SameSite=Lax`
- `Secure` only in production
- max age: 8 hours
- path restricted (recommended): `/` or `/dashboard` depending on routing needs

### Logout

- `POST /api/committee/logout`

Response:
- `200 { "success": true }` and cookie cleared

### Session check

- `GET /api/committee/session`

Response:
- `200 { "authenticated": boolean }`

### Change PIN (committee)

Today this exists as a server action and is not durable across restarts. The backend version should be durable.

- `POST /api/committee/pin`

Request:
- `{ "currentPin": "string", "newPin": "string" }`

Response:
- `200 { "success": true }` (or `400/401` with standard error shape)

## Protected endpoints

### Dashboard data

- `GET /api/dashboard`
  - requires committee cookie

Response:
- structure mirrors the current `DashboardData`:
  - `graduates` (list)
  - `totalCount`
  - `bySchool`, `byStatus`, `byYear`, `bySector`, `byCampus`, `byDepartment`, `byMonthsToEmploy`
  - `employmentRate` (rounded percent)

Performance note:
- If `graduates` grows large, add pagination for the raw list and compute aggregates via SQL.
- For parity, start by matching current behavior, then optimize after.

### System stats

- `GET /api/admin/stats`
  - requires committee cookie

Response (mirrors current `DbStats`):
- `totalGraduates`
- `oldestRecord`
- `newestRecord`
- `schoolCount`
- `programmeCount`

### Purge all graduates (destructive)

- `DELETE /api/admin/graduates`
  - requires committee cookie
  - add an explicit confirmation mechanism (header or body) to prevent accidents

Response:
- `{ "success": boolean, "deleted": number, "error"?: string }`

