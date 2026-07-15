# One Pixel Off — product and execution plan

Status: implemented MVP baseline plus explicitly labeled roadmap
Name: working title; public clearance is still required
Stack: backend-free Next.js App Router PWA

## 1. Product thesis

One Pixel Off is a five-round visual inspection game. Each round shows a square grid of locally generated SVG glyphs. Exactly one cell changes one scalar geometry/stroke/rotation value. The player has 15 seconds to find it. Wrong unique taps cost points but do not end the search; timeout reveals the target.

The generation path is arithmetic and deterministic. It does not call AI, image, stock-media, puzzle, account, or scoring APIs. Quick produces a fresh local seed, Daily derives a UTC-dated seed, and a Challenge path transports a versioned seed so another browser reconstructs the same five boards.

## 2. Shipped MVP baseline

### Gameplay

- Exactly five rounds.
- Square grids only: `4×4`, `5×5`, or `6×6`.
- Difficulty sequence: beginner, steady, tricky, tricky, expert.
- Beginner always uses 4×4; steady chooses 4×4 or 5×5; tricky uses 5×5; expert uses 6×6.
- Exactly one target cell and one scalar mutation per puzzle.
- 15,000 ms deadline.
- Correct target before the deadline resolves `found`.
- New wrong cell is recorded once; repeat is a no-op; clock continues.
- At or beyond the deadline, timeout resolves before the tap is evaluated.
- Timeout reveals the target in the round-result board.

### Score

Found round:

`clamp(100 + floor(remainingMs / 100) - 20 × uniqueWrongCellCount, 25, 250)`

Timeout is `0`; maximum session score is `1,250`. Scores are local entertainment values, not server-verified competition.

### Modes

- **Quick:** generated on `/play` from a fresh seed containing wall time and locally generated entropy.
- **Daily:** selected on `/play` or `/play?mode=daily`; seed is `opo|daily|g1|YYYY-MM-DD` in UTC.
- **Challenge:** token is decoded by `/challenge/[token]`; accepted session uses the decoded seed in challenge mode.

### Local persistence

The only persistent record is aggregate stats at `one-pixel-off:stats:v1`:

- `sessionsCompleted`
- `roundsFound`
- `totalScore`
- `bestScore`
- unique `dailyDatesCompleted` capped at 400

There are no accounts, preferences, detailed round history, first-attempt Daily result, cloud sync, or active-session resume. Storage failure returns an empty in-memory view or a failed write and never blocks results.

### PWA/offline

The manifest starts at `/play` in standalone portrait-primary mode. The production service worker precaches only `/offline` and `/icon.svg`; failed navigation falls back to `/offline`. Browser HTTP cache may make previously loaded application assets available, but guaranteed offline play is not implemented.

### Ads

`AdSlot` is used on the home page only. It renders nothing unless `NEXT_PUBLIC_ADS_ENABLED=true`; when enabled it renders a labeled reserved placeholder, not an ad network request. `/ads.txt` emits a Google record only when `ADSENSE_PUBLISHER_ID` matches the allowed publisher format. Live AdSense, consent, approval, and placements are roadmap/external work.

## 3. Exact generator catalog

### Families

`rings`, `stripes`, `arrows`, `corners`, `dots`, `diamonds`, `chevrons`, `orbit`.

Five distinct families are selected per session by shuffling the ordered catalog with the session PRNG and taking the first five.

### Palettes

| ID | Background | Primary | Accent |
|---|---|---|---|
| `ink-coral` | `#FFF6ED` | `#18212F` | `#F05D5E` |
| `navy-mint` | `#EEFDF7` | `#132A3A` | `#36B88A` |
| `plum-lemon` | `#FFFBEA` | `#43213F` | `#E9B949` |
| `forest-sky` | `#EFF9FF` | `#163B2D` | `#4B9FD8` |
| `cocoa-peach` | `#FFF3EC` | `#422C27` | `#EE8D6A` |
| `slate-lilac` | `#F7F4FF` | `#283044` | `#9A7FD1` |

Five distinct palettes are selected by a separate shuffle of this catalog using the same session ordering stream.

### Difficulty constants

| Tier | Allowed square size | Mutation magnitudes |
|---|---|---|
| beginner | 4 | 8, 10, 12 |
| steady | 4, 5 | 5, 6, 7 |
| tricky | 5 | 3, 4 |
| expert | 6 | 1, 2 |

Family recipes define allowed scalar candidates with bounds. The selected mutation kind is one of `offset`, `size`, `spacing`, `stroke`, or `rotation`. Every descriptor uses integer geometry in a `0 0 100 100` view box and allowlisted circle/rect/line/polygon primitives.

## 4. Current information architecture

### Indexable routes

- `/` — home, demonstration, product explanation, FAQ, disabled-by-default ad boundary.
- `/play` — Quick/Daily setup and all game phases.
- `/how-to-play` — rules and scoring explanation.
- `/categories` — implemented vector-family catalog (“Pattern Lab”).
- `/about` — technical/product background.
- `/privacy` — launch-stage privacy template.
- `/terms` — launch-stage terms template.
- `/contact` — contact route/template.

### Non-indexed/support routes

- `/challenge/[token]` — dynamic challenge, `noindex`, disallowed in robots.
- `/offline` — navigation fallback, `noindex`.
- `/ads.txt` — environment-gated publisher record.
- Generated metadata routes: manifest, sitemap, robots, Open Graph image, icon.

There is no `/daily`, `/stats`, `/daily/archive`, or query-token challenge route in the current app.

## 5. Current state flow

The setup screen lives in React component state outside the domain reducer. Preparing a session is synchronous. A valid prepared session creates a reducer in `ready`.

Reducer flow:

`ready → playing → round_result → ready` for rounds 1–4, then `round_result → session_result` after round 5.

The domain actions are `START_ROUND`, `TAP_CELL`, `CLOCK_TICK`, and `NEXT_ROUND`. Session/round/phase-token guards make stale events no-ops. The UI drives a 100 ms interval during `playing`; each tick and tap supplies `Date.now()`. Domain time is clamped monotonically to `lastNowMs`.

## 6. Goals and non-goals

### Goals for the implemented baseline

- Immediate locally generated visual play.
- Exact seed reproduction within generation version 1.
- Robust invariant checks and deterministic tests.
- Quick, Daily, and Challenge paths without a backend.
- Basic local aggregate stats.
- Native-button touch and keyboard activation.
- Responsive dark inspection-lab presentation.
- Reduced-motion and forced-colors CSS baselines.
- Honest offline, privacy, and advertising scaffolding.

### Current non-goals

- Accounts, cloud sync, database, API, real-time multiplayer, or leaderboards.
- AI or remote puzzle generation.
- User-authored puzzles/uploads.
- Native app packaging.
- Prizes, payments, subscriptions, or gambling framing.
- Server-authoritative/tamper-proof scores.
- Live advertising before approval, consent, and explicit enablement.

## 7. Roadmap — not yet implemented

The following are desired follow-ups, not descriptions of current behavior:

### Accessibility hardening

- Roving grid focus and arrow-key navigation. Current cells are native buttons and keyboard-activatable through normal Tab/Enter/Space, but arrow navigation is not implemented.
- Richer resolved-cell accessible labels and bounded timer announcements.
- Calibrate fluid 6×6 target sizes at the shortest supported viewports; cells now scale with the square board instead of forcing overflow.
- Manual screen-reader, 200% zoom, forced-colors, and color-vision verification.

### Persistence and Daily

- A visible local stats surface and clear-data control.
- Schema-size limits and stronger calendar validation for stored Daily date entries.
- Optional first-attempt Daily result semantics only after a product decision and schema migration.
- No active-session resume unless a separate clock/version contract is designed.

### PWA

- Explicit cache inventory for the play shell and required chunks.
- Offline Quick guarantee after installation/first visit.
- Controlled service-worker update UX and versioned cache migration.
- Browser/install testing across iOS Safari and Chromium.

### Product quality

- Automated component/browser tests for all four reducer phases.
- Perceptual calibration across small screens for expert deltas 1–2.
- Better post-result mutation explanations than the current mutation-kind label.
- Sanitized error observability without seeds/tokens.

### Growth and monetization

- Original content expansion only where it answers a real user question.
- Name/domain/trademark screening before public commitment.
- Privacy/terms/operator/contact completion for the actual deployment.
- Consent architecture and analytics event review.
- AdSense site review and real integration only after approval and authorization.

## 8. Delivery plan from current baseline

### Phase A — implementation/document consistency

- Keep all maintained docs aligned with `src/domain/pixel/**`, `GameShell`, storage, routes, and service worker.
- Preserve generator fixtures and public `opo1` token behavior.
- Add an automated stale-contract grep/check if documentation drift recurs.

Exit: no maintained document claims rectangular grids, old score math, query challenge tokens, stored preferences/first Daily results, or guaranteed offline play.

### Phase B — complete-story verification

- Verify Quick: five rounds with found, wrong-then-found, and timeout.
- Verify Daily same-day reproduction and UTC-boundary unit fixtures.
- Verify challenge create/share/open/reproduce via `/challenge/[token]`.
- Verify malformed/oversized/unsupported tokens.
- Verify corrupt/blocked local storage and native share/copy/manual fallback.
- Verify exact deadline, stale guards, repeated wrong taps, and terminal idempotency.

Exit: domain tests, lint, typecheck, build, and browser story pass.

### Phase C — accessibility and mobile hardening

- Implement and test the roadmap accessibility items.
- Preserve uniform target/non-target markup before reveal.
- Calibrate all eight families and four difficulty tiers at 320–380 px.

Exit: keyboard, touch, zoom, reduced motion, forced colors, and screen-reader status journeys have recorded evidence.

### Phase D — public-launch readiness

- Clear or replace the working name.
- Finish operator/contact/legal text.
- Verify metadata, canonical URLs, sitemap, robots, icons, 404, and error states.
- Decide what offline promise is actually supported.
- Keep ads/analytics disabled until approved.

### Phase E — traffic experiments

- Share deterministic challenge demonstrations.
- Publish useful original procedural-puzzle and visual-inspection content.
- Measure coarse landing/start/completion/share/error events only after privacy/consent review.
- Avoid thin seed/date pages, IQ/medical claims, and guaranteed-traffic language.

### Phase F — AdSense readiness

- Research current publisher requirements at execution time.
- Obtain explicit authorization for account/domain/submission work.
- Add real scripts only behind reviewed configuration and consent.
- Keep game setup, `ready`, `playing`, and `round_result` free of ad placement.
- Place any approved unit away from puzzle-like controls and primary actions.

AdSense approval and revenue are external outcomes and are never guaranteed.

## 9. Measurement plan

Potential future coarse events:

- Home/view and play/start.
- Mode (`quick`, `daily`, `challenge`).
- Round outcome, difficulty, family, grid size, score bucket, wrong-count bucket.
- Session completion and share outcome.
- Token/storage capability error code.

Never transmit raw seeds, challenge tokens, token path, target indexes, vector descriptors, local storage values, full URLs, or personal text.

Current local stats are not analytics and do not leave the browser through application code.

## 10. Risk register

| Risk | Current control | Next control |
|---|---|---|
| Zero/multiple mutation | Structural invariant tests | Browser/perceptual fixture screenshots |
| Expert delta too subtle | Bounded integer recipe | Small-device calibration |
| Deterministic drift | Pinned xmur3/mulberry32 tests | Release fixture manifest/version gate |
| Late correct tap | Tap passes through clock advance; `>=` times out | Browser background test |
| Duplicate/stale event | Guard tokens and unique wrong indexes | Component rapid-input test |
| Token abuse | 256-char/192-byte/strict shape/checksum validation | Route-level fuzz regression |
| Storage corruption | Validate-or-empty and try/catch | Byte limit and visible save status |
| Offline overclaim | Honest fallback page | Explicit shell cache implementation |
| Name conflict | Working-title warning | Clearance decision before launch |
| Ad policy/accidental click | No live network ad; home-only placeholder | Consent, policy, placement audit |

## 11. Release gates

### Functional

- All five rounds complete through the exact four phases.
- Grid sizes stay in `{4,5,6}` and are square.
- Each generated puzzle passes invariant validation.
- Score fixtures stay in `25…250` for found and `0` for timeout.
- Same seed/generation version reproduces the same rounds.
- Challenge round-trip and malformed-token tests pass.
- Aggregate stats failure does not block results.

### Experience

- Native touch and keyboard activation work.
- Wrong and target reveal are visibly distinct.
- Narrow/landscape/reduced-motion/forced-colors styles remain usable.
- Current limitations are not marketed as completed features.
- No live ad appears in timed play.

### Engineering

- Pixel generator, challenge, reducer, scoring, Daily, and invariant tests pass.
- Lint, typecheck, full tests, and production build pass.
- Browser console/network show no unexpected gameplay dependency.
- Routes and documentation match the implementation.

### Launch

- Name, operator, contact, privacy, terms, domain, and external-service configuration are resolved.
- Deployment, analytics, and advertising have explicit authorization.
- Marketing claims describe the shipped baseline exactly.
