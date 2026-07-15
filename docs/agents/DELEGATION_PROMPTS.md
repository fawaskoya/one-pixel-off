# Delegation prompts

Replace bracketed scope before dispatch. The repository is shared; assign non-overlapping files. Every agent reads `AGENTS.md`, relevant specs, implementation, tests, and git state. No prompt authorizes deployment or external account work.

## 1. Generator agent

```text
Own only [FILES] under the pixel generator/catalog/invariant/tests.

Preserve generation version 1 unless explicitly authorized. Current contract: NFC xmur3 → mulberry32; session label `${seed}|g1|session`; round label `${seed}|g1|r${roundIndex}`; square GridSize 4|5|6; difficulties beginner/steady/tricky/tricky/expert; exact catalog order and constants in source; one scalar target mutation; complete row-major cells.

Do not introduce rectangular grids, xoshiro, rejection sampling, retry/fallback generation, 128-bit-hex seed requirements, or undocumented catalog items. If a fix changes deterministic output, stop and report fixture/version impact before proceeding.

Add focused golden/invariant/corpus tests, run generator tests plus typecheck/lint/build as relevant, and report exact files/output/version impact.
```

## 2. Reducer and score agent

```text
Own only [FILES] for pixel types/reducer/scoring/selectors/tests.

Current phases are ready, playing, round_result, session_result. Actions are START_ROUND, TAP_CELL, CLOCK_TICK, NEXT_ROUND with session/round/phase-token guards. Event time is finite and monotonic; tap goes through clock advance; nowMs >= deadlineMs times out before index/target logic. Wrong indexes are unique.

Score is clamp(100 + floor(remainingMs/100) - 20*uniqueWrong, 25, 250) for found, 0 for timeout, session cap 1250. There is no separate rules version.

Test deadline-1/deadline/deadline+1, backward/nonfinite time, stale guards, invalid index, wrong/repeat/target, late actions, five-round progression, outcome invariants, and score fixtures. Report any state-version/compatibility impact.
```

## 3. Challenge agent

```text
Own only [FILES] for challenge codec/route/tests.

Canonical route is /challenge/[token]. Token is opo1.<unpadded canonical base64url JSON>.<16 lowercase hex checksum>. Payload is exactly {v:1,g:1,s:string}. Limits: token 256 chars; decoded bytes 192; normalized URL-safe seed 96 chars. Prefix mismatch is TOKEN_UNSUPPORTED; other malformed data is TOKEN_INVALID.

Preserve xmur3 checksum labels and constant-work comparison. Token contains no score, duration, mode, target, descriptor, identity, or secret. Checksum is not authentication.

Test boundaries, truncation/tamper, exact keys/types, unsupported prefix/version, invalid UTF-8/JSON/prototype shape/noncanonical base64url/seed, and fuzz non-throw behavior. Do not move tokens to query parameters.
```

## 4. Aggregate-storage agent

```text
Own only [FILES] for src/lib/client/pixel-storage.ts and tests/UI explicitly listed.

Current key is one-pixel-off:stats:v1. Current schema contains schemaVersion, sessionsCompleted, roundsFound, totalScore, bestScore 0..1250, and up to 400 unique YYYY-MM-DD-shaped dailyDatesCompleted. load errors/invalid shape return empty; record validates session ID 1..128, rounds 0..5, score 0..1250 and returns boolean.

Do not document or add preferences, detailed round history, canonical first Daily results, streak records, or active resume without an approved product/schema migration. Test corrupt JSON/shape/counts, blocked/quota storage, dedupe/cap, invalid records, and nonblocking play.
```

## 5. Gameplay UI agent

```text
Own only [COMPONENT/STYLE/TEST FILES]. Consume existing pixel domain APIs; do not duplicate generator/reducer/score logic.

Render setup, ready, playing, round_result, session_result exactly. Boards are square gridSize 4|5|6. Preserve no pre-reveal data-target attribute, native button labels, wrong persistence, 100ms tick dispatch, deadline authority, target reveal, and share fallback. No ad component belongs in GameShell.

Current keyboard baseline uses one roving Tab stop, Arrow/Home/End movement, and native Enter/Space activation. Cells are fluid to prevent board overflow; verify their actual target size at narrow and short viewports. Verify pointer, keyboard, all square sizes, wrong/repeat/found/timeout, narrow/landscape, reduced motion, forced colors, and focus/status behavior. Report current limitations honestly.
```

## 6. PWA agent

```text
Own only [PWA FILES]. Current service worker precaches /offline and /icon.svg, intercepts GET navigation network-first, and falls back to /offline. It calls skipWaiting and clients.claim. Production registration occurs after load and failure is swallowed.

Do not claim guaranteed offline Quick, cached app shell, update prompt, or phase-aware activation unless this task implements and verifies them. If expanding caching, define exact cache inventory/version/update/rollback behavior and avoid caching ad/analytics responses. Test first visit, prior visit, offline navigation, missing cached fallback, registration failure, cache migration, and active-game update behavior.
```

## 7. Accessibility QA agent

```text
Audit [BUILD/URL] read-only first. Current cells are native buttons with row/column plus resolved-state labels, one roving Tab stop, Arrow/Home/End movement, and native Enter/Space activation. Explicit phase focus movement, rich timer announcements, and manually verified forced-color wrong/target differentiation are not implemented claims.

Test setup through five rounds on pointer and keyboard; 4x4, 5x5, 6x6; ≤380px, short landscape, 200% zoom, reduced motion, forced colors, wrong/found/timeout, share error. Measure board containment and actual cell target size. Inspect target leaks in DOM/accessibility/style before result. Return severity, reproduction, evidence, expected behavior, smallest fix, and owned files. Do not claim equivalent nonvisual puzzle play.
```

## 8. Content/SEO agent

```text
Own only [ROUTES/CONTENT]. Current indexable routes are /, /play, /how-to-play, /categories, /about, /privacy, /terms, /contact. Challenge is /challenge/[token] and noindex; /offline is noindex. There is no /daily or /stats route.

Keep technical claims aligned: square 4/5/6 boards; xmur3/mulberry32 code generation; score max 1250; aggregate local stats only; limited offline fallback; no live analytics/ad network. Create one original useful page/update, not scaled seed/date pages. Avoid IQ, medical, legal-clearance, traffic, or revenue promises. Run links/metadata/build checks and do not publish externally.
```

## 9. AdSense readiness agent

```text
Audit read-only first and research current official policy at execution time. Current AdSlot appears on home only, returns null unless NEXT_PUBLIC_ADS_ENABLED=true, and then renders a labeled placeholder without an ad script. /ads.txt is gated by ADSENSE_PUBLISHER_ID. There is no consent or live AdSense integration.

Audit content, ownership/contact/legal completion, consent needs, placement separation, layout shift, performance, and active-game absence. Never submit, enable scripts, set publisher IDs, or alter accounts without exact authorization. Distinguish scaffold, engineering readiness, site approval, and revenue.
```

## 10. Complete-story verifier

```text
Verify: /play Quick → five rounds with wrong/found/timeout → session_result → share → /challenge/[token] in fresh context with identical rounds → /play?mode=daily same UTC seed → corrupt/blocked aggregate storage → failed navigation offline fallback.

Capture phases, score math, exact deadline, stale guards, square grid set, console/network, token limits, storage behavior, native keyboard baseline, responsive/reduced-motion/forced-colors, and current offline limits. Diagnose route → codec/generator → reducer → adapter → UI. Fix only [OWNED FILES], run focused/full gates, and report evidence.
```

## Handoff format

```text
Outcome:
Owned files:
Files changed:
Shipped behavior affected:
Version/token/storage impact:
Tests and exact results:
Browser/accessibility evidence:
Current roadmap limitations:
External actions not taken:
Next bounded task:
```
