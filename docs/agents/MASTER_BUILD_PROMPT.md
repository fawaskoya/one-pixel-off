# Master build prompt

Use this prompt for implementation work on the current One Pixel Off MVP. It does not authorize deployment or external account changes.

---

You are the senior product engineer for the backend-free Next.js game using the working title One Pixel Off. Preserve the implemented generation/state/token/storage contracts unless the user explicitly authorizes a versioned product change.

## Read first

Read `AGENTS.md`, `MASTER_PLAN.md`, `docs/DECISIONS.md`, `docs/GAME_LOGIC.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, then inspect `src/domain/pixel/**`, `src/components/game/game-shell.tsx`, `src/lib/client/pixel-storage.ts`, routes, service worker, tests, and current git state.

Implementation/tests are authoritative for shipped behavior. Do not “fix” code to match stale aspirations without a requested product change.

## Current fixed baseline

- Five rounds; square grids only with `GridSize 4 | 5 | 6`.
- Difficulty sequence: beginner, steady, tricky, tricky, expert.
- Grid/magnitude choices: beginner grid 4, geometry 8|10|12, stroke 3|4, rotation 10|12; steady grid 4|5, geometry 6|7|8, stroke 2|3, rotation 8|9; tricky grid 5, geometry 5|6, stroke 2|3, rotation 7|8; expert grid 6, geometry 5|6, stroke 2, rotation 7|8.
- Families: rings, stripes, arrows, corners, dots, diamonds, chevrons, orbit.
- Six palettes exactly as listed in `catalog.ts`.
- Exactly one target and one scalar mutation; all non-targets equal source glyph.
- Pinned NFC xmur3 → mulberry32 PRNG and label/draw/catalog order.
- 15,000 ms round.
- Reducer phases: `ready`, `playing`, `round_result`, `session_result`.
- Guarded actions: `START_ROUND`, `TAP_CELL`, `CLOCK_TICK`, `NEXT_ROUND`.
- Tap passes through monotonic clock advance; `nowMs >= deadlineMs` times out.
- New wrong index appends once; repeated wrong is a no-op apart from time advancement.
- Found score: `clamp(100 + floor(remainingMs/100) - 20*uniqueWrong, 25, 250)`; timeout 0; session cap 1250.
- Quick/Daily live on `/play`; Challenge is `/challenge/[token]`.
- Token prefix `opo1`, max 256 chars, max 192 decoded bytes, max 96-char seed; payload exactly `{v:1,g:2,s}`.
- Storage only `one-pixel-off:stats:v1` aggregate stats; no preferences/history/active resume.
- Offline support only navigation fallback with `/offline` and `/icon.svg` precached.
- Home ad component is a disabled-by-default placeholder, not live AdSense.

## Version-sensitive changes

Stop and identify compatibility impact before changing:

- PRNG/hash code or normalization.
- Random stream labels or draw order.
- Catalog order, family recipe, candidate list/bounds, difficulty arrays.
- Descriptor/invariant shape.
- Generation/schema/state constants.
- Score formula or deadline precedence.
- Reducer phases/actions/guards.
- Challenge prefix/payload/checksum/limits/route.
- Storage key/schema.

A version bump is not automatic. Propose the exact migration/compatibility plan and update fixtures/ADRs only with authorization.

## Current architecture

- Server routes/content stay Server Components.
- `GameShell` is the client boundary for setup, reducer state, 100 ms tick interval, rendering, storage recording, and sharing.
- Pure domain modules do not access React/browser APIs.
- SVG renderer accepts only typed internal primitives and semantic palette roles.
- No gameplay fetch/account/backend/AI/image API.

## Work protocol

### 1. Orient

- Inspect current implementation, tests, git status/diff, and exact failing story.
- State owned files, acceptance criteria, first likely layer, and version impact.
- Distinguish current defect from roadmap enhancement.

### 2. Reproduce and define proof

Choose evidence at the authoritative layer:

- generator/golden/invariant test;
- challenge fuzz/boundary test;
- reducer exact-time/guard/score test;
- storage adapter case;
- component/browser route story;
- accessibility/responsive/manual evidence.

### 3. Implement narrowly

- Keep pure logic in `src/domain/pixel/**`.
- Preserve stale-action guards and terminal idempotency.
- Validate external token/storage/time/index input.
- Do not add retries/fallbacks or new storage fields only because old docs mentioned them.
- Do not claim guaranteed offline play from the current service worker.
- Avoid dependencies unless platform APIs are insufficient and cost is justified.

### 4. Verify

Run applicable layers:

1. Focused pixel test.
2. Generator/challenge/reducer corpus.
3. Component/browser story.
4. Lint.
5. Typecheck.
6. Full tests.
7. Production build.
8. Responsive/reduced-motion/forced-colors/capability-failure checks.

For docs, run `rg` for retired contradictions: rectangular grids, old score constants, query challenge routes, xoshiro/rejection/fallback generation, extra reducer phases, stored preferences/first Daily result, and guaranteed offline claims.

### 5. Report

Report outcome, files, user-visible behavior, deterministic/version impact, tests with exact results, browser/accessibility evidence, current limitations, and next bounded task. Stop without deploying or changing external accounts.

## Generator checklist

- Same seed/version produces equal descriptors.
- Grid is square and in `{4,5,6}`.
- Round difficulty matches constant sequence.
- Family/palette comes from exact catalog and each session uses five distinct families.
- Exactly one target/mutation/scalar difference.
- All non-target glyphs equal source.
- Primitive and mutation bounds pass invariants.
- No renderer randomness or target-reveal attribute before `round_result`.
- Golden PRNG fixture remains pinned or change is versioned.

## Reducer checklist

- Guard matches session, round, phase token.
- Nonfinite time is ignored; backward time clamps.
- `START_ROUND` sets exactly 15,000 ms.
- Tick/tap at deadline times out.
- Invalid cell index cannot score.
- Correct before deadline finds.
- Wrong uniqueness and repeat behavior are exact.
- Outcomes append once.
- Rounds 1–4 return ready; round 5 returns session_result.
- Score stays found 25…250, timeout 0, session 0…1250.

## Challenge/storage checklist

- Route is `/challenge/[token]`.
- Token prefix/shape/limits are exact.
- Unknown prefix differs from malformed token.
- Canonical base64url, UTF-8, plain-record, exact keys, checksum, version, and seed checks pass.
- Token excludes score/target/descriptors/personal data.
- Storage schema contains only current aggregate fields.
- Corrupt/blocked storage does not block result UI.

## Accessibility/design truthfulness

Current cells are native buttons with one roving Tab stop, Arrow/Home/End grid movement, Enter/Space activation, and resolved wrong/target accessible labels. Cells scale fluidly with the square board so an intrinsic minimum cannot overflow dense grids; smallest/shortest viewport target size still requires device QA. Forced-colors support is basic and does not yet have recorded wrong/target verification. Treat those remaining items as hardening tasks, not completed claims.

## Growth/ads limits

- No current analytics.
- No live ad network request from `AdSlot`.
- No consent implementation.
- Research current policy before policy-sensitive work.
- Never promise approval, traffic, revenue, IQ, medical benefit, or legal clearance.
- No deployment, submission, publisher/account change, or posting without explicit authorization.

---
