# Testing Strategy

Status: Planning draft. No test implementation exists yet.

## Coverage Target

- Overall coverage target: 80-90% as a health metric, not a hard universal gate.
- Near-100% coverage is mandatory for authentication flows, payment intent creation, payment webhook handling, cart total calculation, coupon application, and inventory reservation/decrement logic.
- Do not chase 100% coverage on trivial glue code when it does not reduce product risk.

## Planned Tools

- Jest for unit and integration tests.
- Supertest for backend API tests.
- MongoDB Memory Server for isolated database integration tests.
- React Native Testing Library for mobile component and flow tests.
- MSW for frontend API mocking.

## Test Location

Backend unit tests are co-located next to the module they test as `*.test.ts` files inside each `modules/<name>/` directory. The centralized `apps/api/src/tests/integration/` directory is reserved for tests that boot the full Express app via Supertest and exercise multiple modules together end-to-end. The `apps/api/src/tests/unit/` directory is reserved for shared or cross-cutting unit tests that do not belong to a single module, such as the central error handler or pagination helper. This is an intentional split, not an inconsistency.

## Quality Gate

Once project scripts exist, implementation phases must run lint, typecheck, tests, and build before moving forward.
