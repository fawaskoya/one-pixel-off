# Architecture decision record

## ADR-001 — Backend-free MVP

**Decision:** Classic Five, Focus Run, Daily, Weekly, Challenge, scoring, and aggregate progression run without accounts, a database, or a custom backend.

**Consequence:** Scores/tokens are not authoritative. Do not add prizes or global competitive claims without a separate server/security design.

## ADR-002 — Code-native vectors

**Decision:** Generation version 2 emits integer-only circle/rect/line/polygon descriptors in a fixed 100-unit SVG view box.

**Consequence:** No AI/image/puzzle API cost exists per round. Catalog recipes and invariants are the content engine.

## ADR-003 — Square grids only

**Decision:** `GridSize` is `4 | 5 | 6`; every board contains `gridSize²` cells.

**Consequence:** Rectangular 4×5 or 5×6 boards are not supported. Difficulty chooses 4×4, 5×5, or 6×6 only.

## ADR-004 — Implemented difficulty curve

**Decision:** Five rounds use beginner, steady, tricky, tricky, expert. Magnitudes
are mutation-aware: geometry uses 8|10|12, 6|7|8, 5|6, and 5|6; non-scaling
stroke uses 3|4, 2|3, 2|3, and 2; rotation uses 10|12, 8|9, 7|8, and 7|8
for beginner through expert respectively. Grid sizes remain 4; 4|5; 5; and 6.

**Consequence:** Generation 2 raises only the Expert visibility floor while retaining
its 6×6 density and the existing timers. Generation-1 links are not silently
reinterpreted. Changing these arrays again requires a generation-version or
compatibility-branch review.

## ADR-005 — Exactly one scalar mutation

**Decision:** One target cell differs from the source glyph in exactly one geometry coordinate, stroke width, or rotation value matching one mutation descriptor. All other cells equal the source glyph.

**Consequence:** Compound differences and palette mutations are outside generation version 2.

## ADR-006 — Pinned xmur3/mulberry32 generation

**Decision:** NFC-normalized xmur3 seeds mulberry32. Inclusive random integers use float scaling. Session and per-round label strings are pinned.

**Consequence:** Algorithm, catalog order, draw order, recipe, or label changes require a generation-version decision and golden fixtures. Generation version 2 does not use xoshiro or rejection sampling.

## ADR-007 — Classic four-phase reducer

**Decision:** Domain phases are `ready`, `playing`, `round_result`, and `session_result`. Setup/error/share feedback remain component state.

**Consequence:** Do not add Focus phases to `PixelGameState` or document nonexistent Classic `home`, `preparing`, `roundReveal`, `sessionResults`, or `recoverableError` phases. Focus has its own separately versioned five-phase state union.

## ADR-008 — Deadline reconciliation precedes taps

**Decision:** Classic `START_ROUND` sets `deadlineMs = nowMs + 15000`; Focus `START_BOARD` uses that board’s 15/14/13/12-second base plus an optional two-second recovery bonus. Both reducers clamp finite time monotonically, and `nowMs >= deadlineMs` resolves timeout before a tap.

**Consequence:** A target tap at the exact deadline is timeout. Browser interval cadence is not the authority.

## ADR-009 — Guarded idempotent actions

**Decision:** Classic actions include session ID, round index, and phase-token guards. Focus actions independently use run ID, board number, and phase token. Wrong indexes are unique; stale actions and repeated wrong taps do not duplicate outcomes/penalties.

**Consequence:** UI code must preserve guard construction and must not bypass reducer transitions.

## ADR-010 — Implemented score formula

**Decision:** Found score is `clamp(100 + floor(remainingMs / 100) - 20 × uniqueWrong, 25, 250)`. Timeout is `0`; Classic session cap is `1250`. Focus reuses the per-board function and safe-integer-saturates the run total without a streak multiplier.

**Consequence:** Classic has no separate rules-version field; Focus has rules version 1. A shared formula change requires an ADR plus compatibility/version review for both contracts.

## ADR-011 — Path-segment `opo1` challenge token

**Decision:** Challenges use `/challenge/[token]` with `opo1.<base64url {v:1,g:2,s}>.<16-hex-checksum>`.

**Consequence:** Maximum token is 256 chars, decoded payload 192 bytes, seed 96 chars. Token contains no score/target/duration/player data. The checksum is corruption detection, not authentication. Query-token documentation is incorrect.

## ADR-012 — Separate aggregate-only persistence contracts

**Decision:** Keep Classic aggregates in `one-pixel-off:stats:v1` and Focus aggregates in `one-pixel-off:focus-progress:v1`. Focus stores completed runs, total/per-family finds, best score, highest board, and best find/clean streaks. Daily activity and mastery achievements are derived; no unlock flags or activity cells are stored.

**Consequence:** Preferences, detailed board history, canonical first-attempt results, seeds, active-session/run resume, and cloud sync are not implemented. Normalization strips or bounds corrupt values, and storage failure returns empty/false without blocking play.

## ADR-013 — Limited offline fallback

**Decision:** The service worker precaches `/offline` and `/icon.svg` and uses network-first navigation with offline fallback.

**Consequence:** Do not promise guaranteed offline gameplay or phase-aware update behavior. Those require a later cache/update design.

## ADR-014 — Native-button keyboard baseline

**Decision:** Puzzle cells are native buttons with row/column labels, a single roving tab stop, arrow/Home/End navigation, native Enter/Space activation, and resolved wrong/target labels.

**Consequence:** Keyboard users can enter and leave a board with one Tab step instead of traversing up to 36 cells. Manual screen-reader, zoom, and forced-colors verification remains a launch gate.

## ADR-015 — Inspection-lab visual system

**Decision:** Use implemented CSS tokens: `#090c11` canvas, `#f2efe5` panel, `#c8ff38` signal, `#ff7166` coral, `#5572ff` cobalt, system sans/mono, and square boards.

**Consequence:** Design changes must retain target neutrality before reveal and verify reduced-motion/forced-colors behavior.

## ADR-016 — Home-only disabled ad scaffold

**Decision:** `AdSlot` appears only on home and renders nothing unless explicitly enabled; enabled output is a labeled placeholder. `/ads.txt` is environment-gated.

**Consequence:** No live AdSense or consent flow is implemented. Timed game states remain free of ad components.

## ADR-017 — Working name is provisional

**Decision:** “One Pixel Off” remains a working name until search/domain/store/trademark screening and an explicit brand decision.

**Consequence:** Do not publish availability or legal-clearance claims.

## ADR-018 — Focus Run is additive to Classic Five

**Decision:** Quick, Daily, and Challenge retain the exact five-round `PixelGameState`, `PuzzleTuple`, score cap, and public `opo1` replay contract. Focus uses `src/domain/focus-run/**` with schema/rules/state version 1 and generation version 2.

**Consequence:** Focus changes must not silently alter Classic deterministic fixtures or challenge links. Shared rendering and pixel puzzle generation may be reused, but lifecycle and progression types remain separate.

## ADR-019 — Bounded lazy numbered-board generation

**Decision:** Generate only the current Focus board using versioned seed/board labels. Retain aggregate counters and at most five recent outcomes. Normal Focus accepts board numbers 1…1,000,000; Weekly accepts at most 15.

**Consequence:** The experience can feel open-ended without unbounded arrays or unsafe counters. Same seed/version/board reproduces a descriptor; difficulty becomes expert from board 16 onward and the timer floors at 12 seconds rather than shrinking mutation visibility.

## ADR-020 — Three-charge ethical retention loop

**Decision:** Start with three free charges. Timeout removes one and resets active streaks; a unique wrong tap breaks only the clean streak. Every fifth consecutive find restores one missing charge. A timeout gives the next board a visible two-second recovery bonus. Every five boards pauses at an explicit continue/finish checkpoint.

**Consequence:** There are no paid lives, ad-watched revives, loot boxes, automatic checkpoint starts, or loss threats. A player may stop at a checkpoint without discarding earned aggregates. Wrong taps still affect score but never directly consume a charge or time.

## ADR-021 — Deterministic Weekly Focus

**Decision:** Derive a UTC ISO-week seed `opo|focus-weekly|g2|YYYY-Www` and run the same Focus rules with `maxBoards = 15`.

**Consequence:** Weekly board generation is reproducible locally, but completion and score are not server-authoritative. Weekly may end early through charge exhaustion or an explicit board-5/10 checkpoint finish; no global leaderboard claim is valid.

## ADR-022 — Derived mastery and Daily activity

**Decision:** Compute Clean Five, Every Angle, Deep Focus, and 5/25/100 family milestones from normalized aggregates. Compute current/longest Daily streak and a seven-day UTC activity strip from Classic completion dates.

**Consequence:** UI labels cannot drift from stored unlock flags because there are none. A streak through yesterday remains current while today is open; invalid, duplicate, and future completion values do not count.

## ADR-023 — Focus shares a normalized seed query

**Decision:** Keep Classic `opo1` as the checksummed fixed-five token. Share Focus numbered-board sequences through `/focus?g=2&r=1&seed=<normalized opaque seed>` with optional `mode=weekly`; reject unsupported generation/rules versions, while score and boards-cleared remain share text only.

**Consequence:** The Focus seed query reproduces puzzles but does not authenticate the sender or result, and it can appear in normal hosting logs. A future hardened format requires a new prefix/payload/checksum and compatibility fixtures. Local scores must not be presented as authenticated or globally ranked.
