# One Pixel Off — product and execution plan

Status: implemented MVP baseline plus explicitly labeled roadmap
Name: working title; public clearance is still required
Stack: backend-free Next.js App Router PWA

## 1. Product thesis

One Pixel Off is a visual inspection game with a short comparable format and a deeper retention format. Every board shows locally generated SVG glyphs and exactly one cell changes one scalar geometry, stroke, or rotation value. **Classic Five** preserves the original five-round Quick, Daily, and Challenge contract. **Focus Run** adds a checkpointed, escalating run with streaks and three recoverable focus charges without weakening the perceptual visibility floor.

The generation path is arithmetic and deterministic. It does not call AI, image, stock-media, puzzle, account, or scoring APIs. Quick produces a fresh local seed, Daily derives a UTC-dated seed, the existing Challenge path transports a versioned Classic seed, and Focus/Weekly derive numbered boards lazily from their own versioned seed labels.

## 2. Shipped MVP baseline

### Classic Five gameplay

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

### Focus Run gameplay

- Focus Run is additive; it does not change the five-board Daily or Challenge contracts.
- A run starts with three focus charges and ends when all three are exhausted, the player finishes at a checkpoint, or the bounded board limit is reached.
- Correct finds increment the find streak. A find without any wrong tap also increments the clean streak.
- The first unique wrong tap breaks the active clean streak but does not consume a charge. Repeat wrong taps remain no-ops apart from clock reconciliation.
- Timeout consumes one charge, resets both active streaks, scores zero, reveals the target, and gives only the next board a visible `+2,000 ms` recovery bonus.
- Each consecutive-find multiple of five restores one missing charge, capped at three.
- Checkpoints occur after every five resolved boards while charges and boards remain. The player explicitly continues or finishes; a board never starts on the checkpoint screen.
- Base timers are 15 seconds for boards 1–5, 14 for 6–10, 13 for 11–15, and 12 thereafter.
- Difficulty schedules are beginner→expert for 1–5, steady→expert for 6–10, tricky→expert for 11–15, and expert from board 16 onward. Grids remain capped at 6×6 and calibrated mutation floors do not shrink further.
- The normal Focus variant is bounded at board 1,000,000 for safe arithmetic. Only the current board and five recent outcomes are retained in reducer state.
- Weekly is a deterministic UTC ISO-week variant with exactly 15 possible boards. It can end earlier through charge exhaustion and completes automatically after board 15.

### Score

Found round:

`clamp(100 + floor(remainingMs / 100) - 20 × uniqueWrongCellCount, 25, 250)`

Timeout is `0`; maximum Classic session score is `1,250`. Focus reuses the same per-board function and adds found scores with safe-integer saturation rather than a five-board cap. There is no streak multiplier. Scores are local entertainment values, not server-verified competition.

### Modes

- **Classic Five / Quick:** generated on `/play` from a fresh seed containing wall time and locally generated entropy.
- **Daily:** selected on `/play` or `/play?mode=daily`; seed is `opo|daily|g1|YYYY-MM-DD` in UTC.
- **Challenge:** token is decoded by `/challenge/[token]`; accepted session uses the decoded seed in challenge mode.
- **Focus:** `/focus` creates a fresh run seed and produces numbered boards on demand; `?g=1&r=1&seed=<normalized seed>` pins the engine contracts and replays the same sequence.
- **Weekly Focus:** `/focus?mode=weekly` derives `opo|focus-weekly|g1|<ISO week key>` for the deterministic 15-board weekly set. Shared URLs include mode, generation/rules versions, and seed.

### Local persistence

Classic aggregate stats remain at `one-pixel-off:stats:v1`:

- `sessionsCompleted`
- `roundsFound`
- `totalScore`
- `bestScore`
- unique `dailyDatesCompleted` capped at 400

Focus progression is stored separately at `one-pixel-off:focus-progress:v1`:

- completed Focus runs;
- total finds;
- best score and highest board;
- best find and clean streaks;
- cumulative finds for each of the eight glyph families.

The Focus adapter strips unknown fields/families, normalizes corrupt counters, saturates additions at `Number.MAX_SAFE_INTEGER`, and catches unavailable storage. It stores no board history, seeds, recent outcomes, Daily cells, or badge-unlock flags. Clean Five, Every Angle, Deep Focus, and 5/25/100 per-family milestones are derived from aggregates. Current/longest Daily streak and the last-seven-day cells are derived from validated Classic Daily completion dates; duplicate, impossible, and future date values are ignored.

There are no accounts, preferences, detailed round history, canonical first-attempt Daily result, cloud sync, or active-run resume. Storage failure returns an empty in-memory view or a failed write and never blocks play.

### PWA/offline

The manifest starts at `/focus` in standalone portrait-primary mode. The production service worker precaches only `/offline` and `/icon.svg`; failed navigation falls back to `/offline`. Browser HTTP cache may make previously loaded application assets available, but guaranteed offline play is not implemented.

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

Magnitude bands are mutation-aware because geometry coordinates, non-scaling strokes, and degrees do not have equal visual weight.

| Tier | Allowed square size | Geometry | Stroke | Rotation |
|---|---|---|---|---|
| beginner | 4 | 8, 10, 12 | 3, 4 | 10°, 12° |
| steady | 4, 5 | 6, 7, 8 | 2, 3 | 8°, 9° |
| tricky | 5 | 5, 6 | 2, 3 | 7°, 8° |
| expert | 6 | 4, 5 | 1, 2 | 6°, 7° |

Family recipes define allowed scalar candidates with bounds. The selected mutation kind is one of `offset`, `size`, `spacing`, `stroke`, or `rotation`. Every descriptor uses integer geometry in a `0 0 100 100` view box and allowlisted circle/rect/line/polygon primitives.

## 4. Current information architecture

### Indexable routes

- `/` — home, demonstration, product explanation, FAQ, disabled-by-default ad boundary.
- `/focus` — Focus/Weekly selection, play phases, checkpoints, local records, and canonical landing for shared seed queries.
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

Focus uses a separate versioned reducer:

`ready → playing → round_result → ready`

Every fifth resolved board transitions from `round_result` to `checkpoint`; `CONTINUE_RUN` returns to `ready` and `FINISH_RUN` creates `run_result`. Charge exhaustion, Weekly board 15, and the defensive board limit also create `run_result`. Focus actions carry run ID, board number, and phase-token guards. Numbered boards are generated only when their `ready` state is entered, and only the five newest outcomes remain in state.

## 6. Goals and non-goals

### Goals for the implemented baseline

- Immediate locally generated visual play.
- Exact Classic-session and Focus numbered-board reproduction within their generation-version-1 contracts.
- Robust invariant checks and deterministic tests.
- Quick, Daily, and Challenge paths without a backend.
- A checkpointed Focus loop and deterministic 15-board Weekly rules without a backend.
- Versioned local aggregate stats, derived Daily activity, and derived mastery progress.
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
- Paid lives, ad-watched revives, loot boxes, streak-loss threats, or global leaderboard claims.
- Live advertising before approval, consent, and explicit enablement.

## 7. Roadmap — not yet implemented

The following are desired follow-ups, not descriptions of current behavior:

### Accessibility hardening

- Bounded live-region timer announcements and manual assistive-technology calibration. Current cells use roving focus with arrow/Home/End navigation and resolved wrong/target labels.
- Calibrate fluid 6×6 target sizes at the shortest supported viewports; cells now scale with the square board instead of forcing overflow.
- Manual screen-reader, 200% zoom, forced-colors, and color-vision verification.

### Persistence and Daily

- A clear-data control and explicit save-status UX.
- Schema-size limits and stronger calendar validation for stored Daily date entries.
- Optional first-attempt Daily result semantics only after a product decision and schema migration.
- No active Classic session or Focus Run resume unless a separate clock/version contract is designed.

### PWA

- Explicit cache inventory for the play shell and required chunks.
- Offline Quick guarantee after installation/first visit.
- Controlled service-worker update UX and versioned cache migration.
- Browser/install testing across iOS Safari and Chromium.

### Product quality

- Automated component/browser tests for all Classic and Focus reducer phases.
- Perceptual calibration across small screens for the current expert geometry/stroke/rotation floors.
- Better post-result mutation explanations than the current mutation-kind label.
- Sanitized error observability without seeds/tokens.
- A checksummed/versioned Focus token only if the current normalized raw-seed query needs stronger copy-error detection or compatibility signaling; the Classic `opo1` token must not be silently repurposed.

### Growth and monetization

- Original content expansion only where it answers a real user question.
- Name/domain/trademark screening before public commitment.
- Privacy/terms/operator/contact completion for the actual deployment.
- Consent architecture and analytics event review.
- AdSense site review and real integration only after approval and authorization.

## 8. Delivery plan from current baseline

### Phase A — implementation/document consistency

- Keep all maintained docs aligned with `src/domain/pixel/**`, `src/domain/focus-run/**`, game orchestration, both aggregate stores, routes, and service worker.
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
- Verify Focus charge loss/restoration, clean/find streaks, one-board recovery, checkpoints, player finish, charge exhaustion, deterministic lazy boards, and Weekly completion at board 15.
- Verify corrupt/blocked Focus storage, derived badges, and UTC Daily activity around duplicates, impossible dates, future dates, gaps, month boundaries, and leap day.

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
- Share exact Focus sequences through canonicalized `/focus?g=1&r=1&seed=…` links without implying that the seed authenticates the sender or score.
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
- Mode (`quick`, `daily`, `challenge`, `focus`, `weekly`).
- Round outcome, difficulty, family, grid size, score bucket, wrong-count bucket.
- Session completion and share outcome.
- Focus run start, checkpoint reached/continued/finished, recovery-board outcome, finish reason, and coarse board-number bucket.
- Weekly start/completion and locally derived Daily return activity.
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
| Focus seed query exposure | 96-char safe opaque value, canonical `/focus`, no score/identity in seed | Hardened token/privacy review if required |
| Storage corruption | Separate normalized aggregate stores, safe saturation, and try/catch | Byte limit and visible save/clear status |
| Focus runaway memory/number growth | Lazy one-board generation, last-five outcomes, safe score saturation, board 1…1,000,000 | Long-run property and browser soak tests |
| Retention dark patterns | Three free charges, earned recovery, deliberate checkpoints, no ad/paid revives | UX and advertising placement audit |
| Offline overclaim | Honest fallback page | Explicit shell cache implementation |
| Name conflict | Working-title warning | Clearance decision before launch |
| Ad policy/accidental click | No live network ad; home-only placeholder | Consent, policy, placement audit |

## 11. Release gates

### Functional

- All five Classic rounds complete through the exact four Classic phases.
- Grid sizes stay in `{4,5,6}` and are square.
- Each generated puzzle passes invariant validation.
- Score fixtures stay in `25…250` for found and `0` for timeout.
- Same seed/generation version reproduces the same rounds.
- Challenge round-trip and malformed-token tests pass.
- Aggregate stats failure does not block results.
- Focus state remains valid across find, wrong, timeout, recovery, checkpoint, finish, exhaustion, and Weekly board-15 completion.
- Same Focus seed/version/board number reproduces the same board, without changing Classic challenge fixtures.
- Shared `/focus?g=1&r=1&seed=…` links reproduce the sequence while carrying no score or identity claim.
- Progress normalization and Daily activity derivation tolerate corrupt input without blocking play.

### Experience

- Native touch and keyboard activation work.
- Wrong and target reveal are visibly distinct.
- Narrow/landscape/reduced-motion/forced-colors styles remain usable.
- Current limitations are not marketed as completed features.
- No live ad appears in timed play.
- Checkpoints require an explicit continue and do not threaten loss of already earned local progress.
- Charges and continues are never sold, gated behind ads, or represented as globally authoritative competition.

### Engineering

- Pixel and Focus generators, weekly seed, challenge, reducers, scoring, persistence, Daily activity, and invariant tests pass.
- Lint, typecheck, full tests, and production build pass.
- Browser console/network show no unexpected gameplay dependency.
- Routes and documentation match the implementation.

### Launch

- Name, operator, contact, privacy, terms, domain, and external-service configuration are resolved.
- Deployment, analytics, and advertising have explicit authorization.
- Marketing claims describe the shipped baseline exactly.
