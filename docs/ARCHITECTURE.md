# Architecture

## 1. Current system shape

One Pixel Off is a backend-free Next.js App Router application. Public/content routes render as Server Components. `/play` and `/challenge/[token]` mount Classic `GameShell`; `/focus` mounts `FocusRunShell`. Pure pixel modules continue to own fixed-five Classic generation and challenge compatibility; a separate Focus Run domain owns the checkpointed, escalating, bounded run and deterministic Weekly rules.

Classic Five data flow:

`route → GameShell setup → generatePixelSession → createPixelGameState → guarded reducer actions → selectors → SVG renderer → aggregate local stats/share adapter`

Focus data flow:

`mode setup → createFocusRunState → lazy generateFocusRunBoard → guarded focus reducer → selectors → shared SVG board → checkpoint/run result → aggregate local progression/share adapter`

No gameplay fetch is required. The generated data is an in-memory descriptor graph rendered as inline SVG.

## 2. Source ownership

```text
src/domain/pixel/
  catalog.ts       palette and family order
  constants.ts     versions, duration, difficulties, score/token/seed limits
  difficulty.ts    mutation-aware grid and perceptual magnitude policy
  prng.ts          pinned xmur3 + mulberry32
  daily.ts         UTC date validation and Daily seed
  generator.ts     family recipes, mutation choice, puzzle/session generation
  invariants.ts    puzzle, session, outcome, and state validation
  types.ts         descriptors, modes, four state variants, actions, errors
  scoring.ts       found/session scoring
  reducer.ts       clock reconciliation and guarded transitions
  selectors.ts     current puzzle, time, score, found/wrong/result summaries
  challenge.ts     opo1 token codec/checksum
  *.test.ts        deterministic and boundary fixtures

src/domain/focus-run/
  constants.ts     independent schema/generation/rules/state versions and limits
  generator.ts     numbered-board difficulty, timer, family deck, and lazy generation
  reducer.ts       charges, streaks, recovery, checkpoints, and terminal reasons
  invariants.ts    prepared/board/outcome/aggregate/state validation
  selectors.ts     board, remaining time, HUD, recent outcome, recovery selectors
  weekly.ts        UTC ISO-week key and deterministic 15-board seed
  types.ts         variants, board/outcome/aggregate/state/action contracts
  *.test.ts        deterministic, reducer, invariant, and Weekly fixtures

src/components/game/game-shell.tsx
  Classic setup, clock ownership, reducer dispatch, and result/share integration

src/components/game/puzzle-board.tsx
  shared inline-SVG puzzle board renderer

src/components/focus/
  FocusRunShell orchestration, HUD, checkpoint, summary, local progression UI

src/lib/client/pixel-storage.ts
  Classic aggregate stats and Daily completion dates

src/lib/client/focus-progress.ts
  versioned Focus aggregate normalization/load/record and derived mastery

src/lib/client/daily-activity.ts
  pure UTC streak and seven-day activity derivation

src/lib/client/share.ts
  native share → clipboard → manual-copy outcome

src/app/challenge/[token]/page.tsx
  server route-param decode and challenge GameShell construction

public/sw.js
  limited navigation fallback service worker
```

Legacy `src/domain/game/**` and similarly named helpers are not the current One Pixel Off domain contract. Classic work imports `@/domain/pixel`; Focus work imports `@/domain/focus-run` and reuses pixel puzzle descriptors without modifying the Classic session contract.

## 3. Server/client boundaries

### Server routes

- `/` and content/legal pages are Server Components.
- `/play` reads async `searchParams`; only `mode=daily` changes initial mode.
- `/challenge/[token]` reads async route `params`, decodes the token, and passes the decoded seed/checksum ID or safe error message to `GameShell`.
- `/focus` reads optional `mode`, `g`, `r`, and `seed` query values. Only `mode=weekly` selects Weekly; a supplied seed must pass normal pixel-seed normalization and supported generation/rules versions before it reaches `FocusRunShell`.
- Challenge metadata is `noindex`; robots disallow `/challenge/`.
- `/focus` has a canonical `/focus` alternate, so shared query variants do not intentionally become distinct indexable pages.
- `/ads.txt` is an App Router route handler and returns a disabled comment unless a valid publisher environment value exists.

### Client boundary

`GameShell` and `FocusRunShell` separately own:

- setup-mode selection and setup errors;
- their active Classic `PixelGameState` or Focus `FocusRunState`;
- 100 ms `CLOCK_TICK` interval while playing;
- phase-token sequence;
- per-mount completed-session/run write deduplication;
- native share/clipboard feedback;
- SVG rendering of the prepared immutable descriptors.

Both domain modules remain independent of React, DOM, URL routing, local storage, and sharing APIs.

## 4. Generator architecture

### Versions

- Classic schema/generation/state versions are each `1`; Classic remains five rounds of 15,000 ms each.
- Focus schema/generation/rules/state versions are each independently `1`.
- Focus begins with three charges, checkpoints every five boards, retains at most five recent outcomes, and accepts board numbers `1…1,000,000`.
- Weekly is the Focus rules variant with `maxBoards = 15`.

There is no separate rules-version field in Classic prepared sessions or `opo1` challenge payloads. Focus does carry `rulesVersion`. Classic score/state changes still require an ADR and fixture review; a Focus change must review the relevant schema/generation/rules/state version independently.

### Seed contract

`normalizePixelSeed` NFC-normalizes and accepts 1–96 characters matching:

`^[A-Za-z0-9._~:|-]+$`

Although `SEED_MAX_LENGTH = 128` exists in constants, the current generator calls the challenge-normalization path and therefore enforces `CHALLENGE_SEED_MAX_LENGTH = 96`. Documentation and callers must describe the effective 96-character limit.

Quick seed generation uses two `Uint32` values from `crypto.getRandomValues` where available plus `Date.now()`. Its fallback uses `Date.now()` and `Math.random()`; it is uniqueness-oriented, not cryptographic.

Daily seed is exactly `opo|daily|g1|YYYY-MM-DD`, where the date is validated as a real UTC calendar date.

### PRNG and ordering

- `xmur3` NFC-normalizes its input and emits a pinned 32-bit seed.
- `mulberry32` emits a float in `[0,1)`.
- `randomInteger(random,min,max)` is inclusive and uses `min + floor(random() × range)`.
- `chooseOne` indexes ordered arrays through `randomInteger`.
- Session ordering random is seeded with `${seed}|g1|session`.
- Family and palette arrays are independently shuffled in sequence with that stream; the first five of each are used.
- Puzzle random is seeded with `${seed}|g1|r${roundIndex}`.

Any algorithm, string label, catalog order, draw order, recipe, or constant change can alter generation-version-1 output.

### Descriptor and invariant shape

Each `PixelPuzzleDescriptor` contains:

- schema/generation version and stable ID;
- round index, difficulty, `gridSize`, palette, and family;
- source glyph;
- one target index and one mutation descriptor;
- a complete row-major `cells` array of `gridSize²` cells.

The target cell contains the mutated glyph and mutation. All other cells contain the source glyph and `mutation:null`. Invariants validate square size `{4,5,6}`, row/column/index consistency, allowlisted catalog references, integer bounded geometry, one scalar glyph difference, and exactly one mutation-bearing target.

Generation does not currently use retry/rejection/fallback loops. Recipes and candidate bounds are authored so `createMutation` can choose a safe sign; invariant tests detect violations. A production fallback must not be claimed unless implemented.

### Focus lazy generation

Focus does not construct an unbounded puzzle array. `createFocusRunState` prepares only the run envelope and board 1. Entering a later `ready` state calls `generateFocusRunBoard` for that numbered board. Reducer memory contains aggregate counters and only the five newest outcomes.

The numbered-board labels are versioned and deterministic:

- family deck: `${seed}|focus-g1|family-block:<zero-based block>`;
- board schedule/palette: `${seed}|focus-g1|b<board>|schedule`;
- derived pixel seed: `${seed}|focus-g1|b<board>`.

Each block of eight boards shuffles all eight families once, preventing family starvation within a complete block. The board delegates its actual one-scalar puzzle construction to `generatePixelPuzzle`, with `roundIndex = (boardNumber - 1) % 5`, while selecting difficulty from the Focus schedule. The same Focus seed, version, and board number therefore reproduce the same descriptor without changing Classic session labels.

Timer/difficulty policy:

| Boards | Difficulty sequence | Base duration |
|---|---|---:|
| 1–5 | beginner, steady, tricky, tricky, expert | 15s |
| 6–10 | steady, tricky, tricky, expert, expert | 14s |
| 11–15 | tricky, tricky, expert, expert, expert | 13s |
| 16+ | expert | 12s |

A timeout marks only the following board with a `2,000 ms` recovery bonus. Difficulty, grid-size ceilings, and mutation magnitudes do not loosen or become less perceptible during recovery.

## 5. Current catalog

### Difficulty

Classic uses beginner, steady, tricky, tricky, expert. Focus selects from the same calibrated tiers through the numbered-board schedule above.

| Tier | Square-size choices | Geometry | Stroke | Rotation |
|---|---|---|---|---|
| beginner | 4 | 8, 10, 12 | 3, 4 | 10°, 12° |
| steady | 4 or 5 | 6, 7, 8 | 2, 3 | 8°, 9° |
| tricky | 5 | 5, 6 | 2, 3 | 7°, 8° |
| expert | 6 | 4, 5 | 1, 2 | 6°, 7° |

### Families and palettes

Family order: rings, stripes, arrows, corners, dots, diamonds, chevrons, orbit.

Palette order:

1. ink-coral (`#FFF6ED`, `#18212F`, `#F05D5E`)
2. navy-mint (`#EEFDF7`, `#132A3A`, `#36B88A`)
3. plum-lemon (`#FFFBEA`, `#43213F`, `#E9B949`)
4. forest-sky (`#EFF9FF`, `#163B2D`, `#4B9FD8`)
5. cocoa-peach (`#FFF3EC`, `#422C27`, `#EE8D6A`)
6. slate-lilac (`#F7F4FF`, `#283044`, `#9A7FD1`)

## 6. State and clock ownership

Classic domain state is exactly:

```ts
type PixelGameState =
  | ReadyState            // phase: "ready"
  | PlayingState          // phase: "playing"
  | RoundResultState      // phase: "round_result"
  | SessionResultState;   // phase: "session_result"
```

Setup/preparation/error/share feedback are component state, not reducer phases.

Each nonterminal reducer state carries a `phaseToken`; guards include session ID, round index, and phase token. Stale/duplicate actions return the current state.

The UI currently supplies `Date.now()`. `finiteNow` rejects nonfinite time and clamps valid time to at least `lastNowMs`. Starting a round records `deadlineMs = nowMs + 15000`. `CLOCK_TICK` and `TAP_CELL` both pass through `advancePixelClock`; `nowMs >= deadlineMs` creates a timeout before cell validation/target evaluation.

Focus has a separate state union:

```ts
type FocusRunState =
  | FocusRunReadyState       // phase: "ready", one generated board
  | FocusRunPlayingState     // phase: "playing", absolute board deadline
  | FocusRunRoundResultState // phase: "round_result", one outcome
  | FocusRunCheckpointState  // phase: "checkpoint", continue or finish
  | FocusRunResultState;     // phase: "run_result", terminal reason
```

Focus guards use run ID, board number, and phase token. Its clock uses the same monotonic reconciliation and deadline-before-tap rule, but the deadline is the board’s 15/14/13/12-second base plus an optional one-board recovery bonus. A timeout removes one charge and resets active find/clean streaks. A unique wrong tap breaks the active clean streak without consuming a charge; repeats remain no-ops. Finds advance the find streak, clean finds advance the clean streak, and each find-streak multiple of five restores one missing charge up to three.

After a resolved board, the reducer first honors terminal conditions. Weekly completes at board 15, Focus ends at charge zero or the defensive board limit, and otherwise each multiple of five enters a checkpoint. Only a checkpoint accepts `CONTINUE_RUN` or `FINISH_RUN`; this prevents surprise timer starts and gives the player a safe stopping point.

## 7. Challenge architecture

Canonical route:

`/challenge/<token>`

Canonical token:

`opo1.<base64url(JSON.stringify({v:1,g:1,s:seed}))>.<16 lowercase hex checksum>`

Limits and validation:

- Entire token: 1–256 characters and overall `[A-Za-z0-9._-]+`.
- Exactly three nonempty dot-separated segments.
- Prefix must be `opo1`; another prefix returns `TOKEN_UNSUPPORTED`.
- Checksum is two padded xmur3 outputs over labeled payload strings, compared with constant-work string logic. It detects corruption; it is not authentication.
- Payload segment must be canonical unpadded base64url.
- Decoded payload: maximum 192 bytes and fatal UTF-8 decoding.
- JSON must be a plain record with exactly keys `g`, `s`, `v` and values `g:1`, `v:1`.
- Seed must already equal its NFC-normalized, safe, maximum-96-character form.

Successful decode returns seed, generation version `1`, and the checksum as `tokenId`. Token payload contains no score, mode, duration, round count, target, descriptor, name, account, or secret.

## 8. Persistence architecture

Persistence is split by rules contract. `src/lib/client/pixel-storage.ts` retains the existing Classic key `one-pixel-off:stats:v1`:

```ts
type PixelStats = {
  schemaVersion: 1;
  sessionsCompleted: number;
  roundsFound: number;
  totalScore: number;
  bestScore: number;              // 0…1250
  dailyDatesCompleted: string[];  // unique, last 400
};
```

`loadPixelStats` catches access/JSON errors and returns empty stats for invalid shape. It does not currently delete a corrupt key or expose a diagnostic. `recordPixelSession` validates session ID length (1–128), found count (0–5), and score (0–1250), merges aggregates, writes, and returns a boolean.

`src/lib/client/focus-progress.ts` uses a separate key, `one-pixel-off:focus-progress:v1`:

```ts
type FocusProgress = {
  schemaVersion: 1;
  focusRunsCompleted: number;
  totalFinds: number;
  bestScore: number;
  highestBoard: number;
  bestFindStreak: number;
  bestCleanStreak: number;
  findsByFamily: Record<GlyphFamilyId, number>;
};
```

Normalization requires version 1, emits exactly the allowlisted aggregate shape, strips unknown fields and families, recomputes total finds from the eight family counters, clamps inconsistent best streaks, and saturates additions at `Number.MAX_SAFE_INTEGER`. A run write is rejected if its clean streak exceeds its find streak, its find streak exceeds its family-find total, its finds exceed its highest board, or it contains unsafe/unknown values. Storage/JSON failures return empty/false and do not block gameplay.

Mastery state is not persisted. `deriveFocusAchievements` computes Clean Five (`bestCleanStreak ≥ 5`), Every Angle (all eight families seen), Deep Focus (`highestBoard ≥ 20`), and per-family milestones at 5, 25, and 100 finds.

`src/lib/client/daily-activity.ts` receives the Classic `dailyDatesCompleted` array and derives current streak, longest streak, completed days in the inclusive seven-day window, and seven oldest-to-newest cells. It validates real UTC dates, deduplicates, ignores future values, and treats a streak through yesterday as current while today remains open. No Daily cells or streak flags are stored.

No preference key, detailed board history, canonical first-attempt Daily result, cross-tab coordination, clear-data UI, active-session snapshot, or active Focus Run snapshot exists.

## 9. Sharing adapter

Classic session results encode the prepared seed and form `${origin}/challenge/${token}`. `shareChallenge` sends title, score-bearing text, and URL through `navigator.share`; AbortError/NotAllowedError is treated as cancelled. Other failure falls through to clipboard. Clipboard failure returns `manual-copy-required`, and the UI exposes a read-only selectable URL.

The score is in share text, not in the challenge token.

`FocusRunShell` creates a replay URL with `g=1`, `r=1`, and the URL-encoded normalized seed, and includes `mode=weekly` for a Weekly run. The route rejects unsupported contract versions. `shareFocusRun` adds score/boards-cleared text and applies the same native-share/clipboard outcome handling. Opening the link reconstructs the deterministic numbered-board sequence locally; it does not reproduce or authenticate the sender’s taps, time, score, or finish point.

The Focus URL is intentionally simpler than `opo1`: its opaque seed is normalized to the existing safe 96-character alphabet/limit, but has no dedicated prefix, payload version, or checksum. Query presence is not proof of authorship. A future hardened Focus token requires a new prefix/payload, copy-error limits, privacy review, and compatibility fixtures; it must not overload Classic `opo1`.

## 10. PWA/offline architecture

The manifest is implemented and points `start_url` to `/focus`. `ServiceWorkerRegistration` registers `/sw.js` in production after page load and swallows registration failure.

`public/sw.js`:

- cache name `opo-offline-v1`;
- precache only `/offline` and `/icon.svg`;
- calls `skipWaiting()` after install and `clients.claim()` after activate;
- deletes older `opo-offline-*` caches;
- intercepts GET navigation requests only;
- uses network first and falls back to cached `/offline`.

It does not explicitly precache `/play`, JavaScript chunks, CSS, fonts, generated sessions, content pages, ads, or analytics. It has no app-level waiting-update prompt or phase-aware activation deferral. Those are roadmap ideas.

## 11. Advertising boundary

Current home page contains `AdSlot`. With `NEXT_PUBLIC_ADS_ENABLED !== "true"`, it returns `null`. When true, it renders only a labeled reserved placeholder with `data-ad-slot-pending-review`; no Google script is loaded by that component.

`/ads.txt` reads server environment `ADSENSE_PUBLISHER_ID`. A value matching `pub-` plus 10–20 digits produces the Google DIRECT line; otherwise it emits a disabled comment.

No consent platform or live AdSense request is implemented. GameShell and Focus components contain no AdSlot. Focus charges, recovery, checkpoints, and continues are rules—not monetization surfaces—and cannot be restored or unlocked through advertising.

## 12. Error model

Domain result codes are:

- `INVALID_SEED`
- `INVALID_DATE`
- `INVALID_SESSION`
- `TOKEN_INVALID`
- `TOKEN_UNSUPPORTED`

Expected Classic setup/challenge errors are displayed in `GameShell`; Focus seed/setup errors are displayed in `FocusRunShell`. Invalid/stale reducer actions return state unchanged. Storage/share/service-worker capability failures are caught at adapter boundaries. App Router error boundaries remain last-resort UI for unexpected failures.

## 13. Current route inventory

Indexable sitemap routes: `/`, `/focus`, `/play`, `/how-to-play`, `/categories`, `/about`, `/privacy`, `/terms`, `/contact`. Focus and Weekly selection live on `/focus`; shared seed queries canonicalize to that base route rather than creating generated sitemap pages.

Support/dynamic: `/challenge/[token]`, `/offline`, `/ads.txt`, manifest, robots, sitemap, Open Graph image, favicon/icon, error and not-found boundaries.

There is no dedicated `/daily`, `/stats`, or `/daily/archive` route.

## 14. Performance and privacy

- Puzzle rendering is inline SVG; no gameplay image payload.
- Classic prepares five descriptors once. Focus generates one numbered descriptor when its ready state is entered and retains only that board plus five recent outcomes.
- Timer tick updates component/reducer state every 100 ms while playing.
- No gameplay API or remote media call.
- No application analytics are currently implemented.
- Classic and Focus aggregates stay in separate browser-storage keys through application code; seeds, current boards, and badge flags are not persisted there.
- Challenge paths contain the seed token and can reach hosting/request logs; privacy copy must continue to disclose chosen sharing and normal hosting behavior.
- Shared Focus URLs contain the normalized opaque seed as a query value and can likewise reach hosting/request logs. Application analytics must not collect the query or full URL.
- Local Focus and Classic scores are not authenticated and must not be presented as a verified global leaderboard.

## 15. Roadmap boundaries

Not currently implemented:

- granular live-region timer strategy;
- stored preferences or detailed/canonical first-attempt Daily results;
- active Classic-session or Focus-run restoration;
- guaranteed offline game shell;
- phase-aware service-worker updates;
- analytics/consent/live ads;
- generator rejection/fallback system;
- server-authoritative scores;
- an optional checksummed Focus token to replace or complement the implemented versioned normalized raw-seed query.

Future docs may state these as acceptance criteria, but must not describe them as current behavior before code and tests land.

## 16. Verification story

1. Open `/play`; prepare Quick; confirm five valid rounds.
2. Exercise new wrong, repeat wrong, found before deadline, and timeout at deadline.
3. Confirm state phases and score fixtures.
4. Share result; inspect `/challenge/[token]`; confirm same round descriptors.
5. Open `/play?mode=daily`; confirm same UTC seed/session across contexts.
6. Corrupt/block `one-pixel-off:stats:v1`; confirm gameplay/results remain usable.
7. Start Focus; verify three charges, find/clean streak semantics, timeout recovery, five-find restoration, and checkpoints at boards 5/10/15.
8. Verify charge exhaustion, explicit checkpoint finish, deterministic same-seed numbered boards, Weekly automatic completion after board 15, and `/focus?g=1&r=1&seed=…` replay/unsupported-version rejection without score/authentication claims.
9. Corrupt/block `one-pixel-off:focus-progress:v1`; verify empty/failure fallback, badge derivation, and UTC Daily activity around gaps/future/invalid dates.
10. Test invalid/oversized/unsupported Classic challenge path tokens.
11. Test production navigation failure reaches `/offline`, without claiming full offline gameplay.
12. Inspect console/network and run both generators, Weekly, challenge, reducers, persistence, lint, typecheck, full test, and build gates.
