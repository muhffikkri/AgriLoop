# AgriLoop AI web build checklist

Status of every item in [PRD §14](../PRD.md) and
[web architecture §14](web-architecture.md §14-checklist-implementasi-untuk-ai-agent).
One commit per item, Conventional Commits, no co-author trailer.

Legend: `[x]` done in this repository · `[ ]` not started.

## Public and walkthrough (PRD §14)

- [x] P1 Landing page has hero, problem, five-step workflow, value per party, limits, CTA.
- [ ] P2 `/demo` opens without login and has a Farmer/Buyer/Aggregator/Admin persona switcher.
- [ ] P3 `/demo` shows simulated Punjab grids, period/layer picker, image source, metadata, dummy badge.
- [ ] P4 Each persona completes one real step in the walkthrough; reset restores all state.

## Account, router and role access (PRD §14)

- [x] A1 `/login`, `/signup` and `/app` work, with redirect per role.
- [ ] A2 Every role gets its own layout/sidebar and dashboard.
- [ ] A3 A wrong role cannot open a page or take a forbidden action.
- [ ] A4 Server Actions and Route Handlers verify session, role and ownership.
- [x] A5 Admin accounts cannot be created through public signup.
- [x] A6 Logout clears the session and returns to a public page.

## Farmer (PRD §14)

- [x] F1 Create, save as draft, publish, update and withdraw a listing within its status.
- [x] F2 Review offers and accept/reject them with a reason.
- [x] F3 See the pickup schedule and declare readiness.
- [x] F4 See own history without another user's sensitive data.

## Buyer (PRD §14)

- [x] B1 Create, update and cancel a requirement.
- [x] B2 Browse marketplace filters and read match reasons.
- [x] B3 Send an offer, settle the order and confirm receipt.
- [x] B4 Open a dispute with a reason category.

## Aggregator (PRD §14)

- [ ] G1 See lots/orders that can be worked on.
- [ ] G2 Create and change a pickup plan.
- [ ] G3 Record status, actual quantity, unit, time and hand-over evidence.
- [ ] G4 Cannot exceed the configured vehicle capacity.

## Admin (PRD §14)

- [ ] D1 Manage users/roles with an audit log.
- [ ] D2 Manage simulated grids and image metadata without altering source rasters.
- [ ] D3 See transactions/disputes and data status without needless access to private information.

## Quality, accessibility and security (PRD §14)

- [ ] Q1 Flat design, mobile-first, readable labels/forms, keyboard usable.
- [ ] Q2 Motion animations respect `prefers-reduced-motion`.
- [ ] Q3 Loading, no-data, error, validation, forbidden, not-found and empty states are designed.
- [ ] Q4 Imagery lists source, period, CRS/resolution, cloud mask and simulation status.
- [ ] Q5 No Earth Engine credentials in the browser, repository or logs.
- [ ] Q6 Mutations record actor, time and change; quantities are validated.
- [ ] Q7 Per-role authorization tests for pages, Server Actions and API before calling the app ready.

## Architecture checklist — foundation and navigation

- [x] S1 Existing app/auth patterns inspected and reused where present.
- [ ] S2 Auth strategy recorded (local signed-cookie session; Supabase swap path documented).
- [ ] S3 Landing `/`, public `/demo`, auth pages, workspace `/app` and per-role dashboards exist.
- [x] S4 Consistent layout/sidebar with a role-specific menu.
- [ ] S5 `/demo` stays open without an account and never reads or writes transaction data.

## Architecture checklist — business flow

- [x] S6 Farmer creates a draft, publishes, edits, answers an offer and sees pickups.
- [x] S7 Buyer creates a requirement, sees matches with reasons, sends an offer and manages orders.
- [ ] S8 Aggregator accepts an assignment, schedules a pickup and records actual quantity.
- [ ] S9 Buyer confirms receipt or opens a dispute.
- [ ] S10 Admin reviews users, grids, transactions, data quality and audit within permissions.
- [ ] S11 State machine rejects illegal status transitions.

## Architecture checklist — authorization

- [ ] S12 Every workspace page checks session and role on the server.
- [ ] S13 Every Server Action/API checks session, role, ownership/organization, input and source status.
- [ ] S14 Anonymous users go to login; other roles get a denied page.
- [ ] S15 Admin cannot be created through public signup.
- [ ] S16 Cross-role and cross-organization access tests.

## Architecture checklist — grids and Earth Engine

- [ ] S17 At least four simulated Punjab grid polygons (GeoJSON) load.
- [ ] S18 Grid selectable; month/layer choice updates raster and metadata.
- [ ] S19 Date, source, bands, resolution, cloud mask, CRS and no-data status visible.
- [ ] S20 No straw tonnage or grade derived from the imagery.
- [ ] S21 No Earth Engine credentials in the client.

## Architecture checklist — quality and experience

- [ ] S22 `DATA DUMMY / SIMULASI` badge visible on every walkthrough data surface.
- [ ] S23 Loading, empty, error, forbidden and not-found states built.
- [ ] S24 Flat, responsive, keyboard navigation, labels, contrast, reduced motion.
- [ ] S25 Walkthrough reset that leaves workspace data untouched.
- [ ] S26 Lint/build and per-role route/permission tests run during implementation.
