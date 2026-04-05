# Parity Testing (“No Missing Shots”)

The only reliable way to ensure you did not miss anything is to prove it with tests and fixtures.

## What parity means here

- Same inputs produce the same outputs (or same “meaning” where exact text differs).
- Same invalid inputs fail for the same reasons.
- Same dataset produces the same dashboard aggregates:
  - counts and groupings
  - sorting order
  - rounding

## Recommended approach

1. Create a fixture folder with:
   - `graduate-payloads.valid.json`
   - `graduate-payloads.invalid.json`
   - `dashboard.dataset.json`
2. Golden files:
   - expected result for each fixture input
3. Implement backend tests that:
   - call backend endpoints with fixtures
   - compare responses to goldens

## Practical notes

- Use a dedicated test database/schema to avoid touching production data.
- Keep fixtures small but representative.
- Include edge cases:
  - programme not found in DB
  - missing contact info (email and phone empty)
  - unusual sectors
  - months_to_employ empty vs set
  - graduation_year parse issues

