# Architecture decision record

## ADR-001 — Backend-free MVP

**Decision:** Gameplay, generation, Daily, Challenge, scoring, and aggregate stats run without accounts, a database, or a custom backend.

**Consequence:** Scores/tokens are not authoritative. Do not add prizes or global competitive claims without a separate server/security design.

## ADR-002 — Code-native vectors

**Decision:** Generation version 1 emits integer-only circle/rect/line/polygon descriptors in a fixed 100-unit SVG view box.

**Consequence:** No AI/image/puzzle API cost exists per round. Catalog recipes and invariants are the content engine.

## ADR-003 — Square grids only

**Decision:** `GridSize` is `4 | 5 | 6`; every board contains `gridSize²` cells.

**Consequence:** Rectangular 4×5 or 5×6 boards are not supported. Difficulty chooses 4×4, 5×5, or 6×6 only.

## ADR-004 — Implemented difficulty curve

**Decision:** Five rounds use beginner, steady, tricky, tricky, expert. Magnitudes
are mutation-aware: geometry uses 8|10|12, 6|7|8, 5|6, and 4|5; non-scaling
stroke uses 3|4, 2|3, 2|3, and 1|2; rotation uses 10|12, 8|9, 7|8, and 6|7
for beginner through expert respectively. Grid sizes remain 4; 4|5; 5; and 6.

**Consequence:** The unreleased generation-1 policy was recalibrated in place to
remove sub-pixel geometry and near-invisible rotation cases before public launch.
Changing these arrays after links ship changes deterministic output and requires
a generation-version or compatibility-branch review.

## ADR-005 — Exactly one scalar mutation

**Decision:** One target cell differs from the source glyph in exactly one geometry coordinate, stroke width, or rotation value matching one mutation descriptor. All other cells equal the source glyph.

**Consequence:** Compound differences and palette mutations are outside generation version 1.

## ADR-006 — Pinned xmur3/mulberry32 generation

**Decision:** NFC-normalized xmur3 seeds mulberry32. Inclusive random integers use float scaling. Session and per-round label strings are pinned.

**Consequence:** Algorithm, catalog order, draw order, recipe, or label changes require a generation-version decision and golden fixtures. Generation version 1 does not use xoshiro or rejection sampling.

## ADR-007 — Four reducer phases

**Decision:** Domain phases are `ready`, `playing`, `round_result`, and `session_result`. Setup/error/share feedback remain component state.

**Consequence:** Do not document or dispatch nonexistent `home`, `preparing`, `roundReveal`, `sessionResults`, or `recoverableError` domain phases.

## ADR-008 — Deadline reconciliation precedes taps

**Decision:** `START_ROUND` sets `deadlineMs = nowMs + 15000`. `CLOCK_TICK` and `TAP_CELL` first clamp finite time monotonically; `nowMs >= deadlineMs` resolves timeout.

**Consequence:** A target tap at the exact deadline is timeout. Browser interval cadence is not the authority.

## ADR-009 — Guarded idempotent actions

**Decision:** Actions include session ID, round index, and phase-token guards. Wrong indexes are unique; stale actions and repeated wrong taps do not duplicate outcomes/penalties.

**Consequence:** UI code must preserve guard construction and must not bypass reducer transitions.

## ADR-010 — Implemented score formula

**Decision:** Found score is `clamp(100 + floor(remainingMs / 100) - 20 × uniqueWrong, 25, 250)`. Timeout is `0`; session cap is `1250`.

**Consequence:** There is no separate rules-version field today. A formula change requires an ADR and compatibility/version decision.

## ADR-011 — Path-segment `opo1` challenge token

**Decision:** Challenges use `/challenge/[token]` with `opo1.<base64url {v:1,g:1,s}>.<16-hex-checksum>`.

**Consequence:** Maximum token is 256 chars, decoded payload 192 bytes, seed 96 chars. Token contains no score/target/duration/player data. The checksum is corruption detection, not authentication. Query-token documentation is incorrect.

## ADR-012 — Aggregate stats only

**Decision:** Persist only `one-pixel-off:stats:v1`: completed sessions, rounds found, total/best score, and up to 400 unique Daily date strings.

**Consequence:** Preferences, detailed history, first Daily results, streak records, and active-session resume are not implemented. Storage failure returns empty/false and never blocks play.

## ADR-013 — Limited offline fallback

**Decision:** The service worker precaches `/offline` and `/icon.svg` and uses network-first navigation with offline fallback.

**Consequence:** Do not promise guaranteed offline gameplay or phase-aware update behavior. Those require a later cache/update design.

## ADR-014 — Native-button keyboard baseline

**Decision:** Puzzle cells are native buttons with row/column labels and normal tab/Enter/Space behavior.

**Consequence:** Roving focus and arrow-key grid navigation remain roadmap work. Documentation must not claim they are shipped.

## ADR-015 — Inspection-lab visual system

**Decision:** Use implemented CSS tokens: `#090c11` canvas, `#f2efe5` panel, `#c8ff38` signal, `#ff7166` coral, `#5572ff` cobalt, system sans/mono, and square boards.

**Consequence:** Design changes must retain target neutrality before reveal and verify reduced-motion/forced-colors behavior.

## ADR-016 — Home-only disabled ad scaffold

**Decision:** `AdSlot` appears only on home and renders nothing unless explicitly enabled; enabled output is a labeled placeholder. `/ads.txt` is environment-gated.

**Consequence:** No live AdSense or consent flow is implemented. Timed game states remain free of ad components.

## ADR-017 — Working name is provisional

**Decision:** “One Pixel Off” remains a working name until search/domain/store/trademark screening and an explicit brand decision.

**Consequence:** Do not publish availability or legal-clearance claims.
