# Mobile API and Read-only Rollout

## Scope lock

- Guest uses the complete public catalogue, reader, vote, ranking, and authentication surface in `FE-Mobile-RN-Guide.md`.
- Mangaka and Assistant use `GET` routes only.
- The only internal-role POST exceptions are the guide-approved signed download URL routes:
  - `POST /tasks/:id/download-url`
  - `POST /uploads/sign-download`
- `POST /auth/logout` and `POST /auth/change-password` are retained as session/security actions required by the guide; they are not role workflow mutations.

## Completed

- Public vote now discovers an open period before fetching context, uses Socket.IO namespace `/vote` for `joinPeriod`/`voteTally`, falls back to five-second polling, and uses the required ranking scope fields.
- Public vote renders every open period (including `IRREGULAR`), retains a reader-provided series selection, and ranking renders yearly/monthly aggregate items.
- Public catalogue pagination honours the backend maximum of 50; reflected-period history honours the backend maximum of 24. Ranking automatically discovers a valid magazine scope and renders issue, reliability, normalized score, coverage and provisional state.
- Auth uses the backend role object (`user.role.code`), refreshes `/me`, sends refresh token on logout, sends the protected `change-password` bearer request with its complete schema, uses a Google ID token, and routes unsupported web-only roles to a blocker screen.
- Root navigation enforces role boundaries on every route, including direct/deep links between Mangaka and Assistant route groups.
- `src/api/client.ts` blocks non-GET requests for Mangaka and Assistant at transport level, except the explicit signed-read and session/security exceptions above.
- `src/api/mangaka.ts` exports only GET functions and approved signed-read helpers. Legacy workflow mutations were removed.
- `src/api/assistant.ts` exports the Assistant read surface only.
- Mangaka Proposal, Deadline, Contract, Studio, Assistant directory, chapter pages, task review, manuscript and profile flows are read-only on mobile. Contract PDF and task/page assets use signed URLs.
- Assistant Studio, Inbox, Profile, Tasks and task annotations are read-only on mobile.
- Assistant task detail includes nullable deadline handling, display/original page files, submitted versions, signed assets, chapter pages, revision requests, studio detail, and notification polling/deep links.
- Mangaka covers scoped payment history, contract status/versions/amendments/payment conditions, chapter production data, series names/publication versions, assistant detail/reviews, studio detail, deadline-by-chapter, archive/reprint/transfer/directory/board-ranking exploration. Production stages consume `{stages,currentStage,bottleneckStage}` and stage pages consume `pageId`.
- Paginated task, annotation, revision, notification, series, assistant, collaboration, assignment and directory lists now load every page. Offset-only Name/review lists continue until a short page.
- Reader, chapter pages, Name pages and task/review images renew signed URLs after an image-expiry error with a retry rate limit.
- Mangaka and Assistant inboxes poll every 20 seconds, show server unread counts, and route by `referenceType` prefixes.
- Each former workflow area now directs the user to web in clear static copy rather than presenting an actionable-looking control.

## UX conventions

- List/detail routes remain navigable, but never change state for internal roles.
- Show status, empty, refresh and error states in the mobile companion.
- Signed URLs are generated only when a user opens a permitted asset.
- Dates are formatted with Vietnamese locale.

## Verification checklist

- `npx tsc --noEmit` passes.
- `npm run lint` passes with no warnings or errors.
- Android Metro production export passes (3,730 modules, 79 assets, Hermes bundle generated).
- Runtime smoke test (2026-07-29): `GET /api-json`, `GET /public/series?limit=50&offset=0`, `GET /vote/periods/open`, `GET /vote/context`, `GET /vote/live`, `GET /vote/results/latest`, and `GET /rankings/aggregate` returned HTTP 200 from `https://api-mangaka.novaproj.site`.
- Production Socket.IO smoke test connected to `/vote`, emitted `joinPeriod`, and received a valid `voteTally` payload.
- Protected production E2E with dedicated Mangaka and Assistant test accounts returned HTTP 200 for all populated list/detail chains: profiles, dashboards, series/chapters/Names, production stages/pages, regions, annotations, tasks, assistant directory/reviews, collaboration, contracts/status/PDF/payment conditions/payments, rankings, revisions and notifications.
- Both signed-read POST exceptions returned HTTP 200 with a real task file: `POST /tasks/:id/download-url` and `POST /uploads/sign-download`.
- Expo Web mobile-viewport render smoke verified the Guest catalogue error/retry state and Login layout. Web development uses memory-only auth because `expo-secure-store` is native-only; Android/iOS continue to use Keychain/Keystore.
- Static audit: no `apiClient.post/put/patch/delete` occurs from an internal-role screen.
- Static audit: M/A API clients contain only GET calls plus the two signed-read POSTs.

## Confirmed backend discoverability gaps

- `GET /transfers/contracts/:id/signatures` needs a `TransferContract.id`. Current `GET /transfers/requests/:id` production/source response exposes `originalContractId` but not `transferContractId`, and there is no GET route that discovers a transfer contract by request. Mobile avoids calling the endpoint with the wrong publishing-contract ID and will use `transferContractId` when BE exposes it. This is a BE API discoverability blocker, not a remaining Mobile mapping bug.
- Assistant task payloads expose `pageId`, but no `chapterId`/embedded chapter and no Assistant-scoped page-detail route exists. `GET /chapters/:id/pages` itself returned HTTP 200 when tested with a correctly derived chapter ID, but Mobile cannot derive that ID from the Assistant GET surface. The chapter-pages route remains future/deep-link compatible and is shown only when a valid chapter ID exists.
- Destructive Guest vote OTP/submission was not invoked during the final smoke test; perform the manual Guest catalogue → reader → OTP → vote → results/history/live flow with an approved test email.
