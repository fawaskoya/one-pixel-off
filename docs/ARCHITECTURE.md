# Architecture

## 1. Current system shape

One Pixel Off is a backend-free Next.js App Router application. Public/content routes render as Server Components. `/play` and `/challenge/[token]` mount the client-side `GameShell`. Pure pixel domain modules generate sessions, validate invariants, decode challenges, transition game state, and score outcomes.

Current data flow:

`route → GameShell setup → generatePixelSession → createPixelGameState → guarded reducer actions → selectors → SVG renderer → aggregate local stats/share adapter`

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

src/components/game/game-shell.tsx
  setup, clock interval, reducer dispatch, SVG rendering, result/share UI

src/lib/client/pixel-storage.ts
  aggregate stats validate/load/record adapter

src/lib/client/share.ts
  native share → clipboard → manual-copy outcome

src/app/challenge/[token]/page.tsx
  server route-param decode and challenge GameShell construction

public/sw.js
  limited navigation fallback service worker
```

Legacy `src/domain/game/**` and similarly named helpers are not the current One Pixel Off domain contract. New work must import `@/domain/pixel` for this product.

## 3. Server/client boundaries

### Server routes

- `/` and content/legal pages are Server Components.
- `/play` reads async `searchParams`; only `mode=daily` changes initial mode.
- `/challenge/[token]` reads async route `params`, decodes the token, and passes the decoded seed/checksum ID or safe error message to `GameShell`.
- Challenge metadata is `noindex`; robots disallow `/challenge/`.
- `/ads.txt` is an App Router route handler and returns a disabled comment unless a valid publisher environment value exists.

### Client boundary

`GameShell` is the game’s Client Component. It owns:

- setup-mode selection and setup errors;
- current `PixelGameState | null`;
- 100 ms `CLOCK_TICK` interval while playing;
- phase-token sequence;
- per-mount completed-session write deduplication;
- native share/clipboard feedback;
- SVG rendering of the prepared immutable descriptors.

The domain modules do not access React, DOM, URL routing, local storage, or sharing APIs.

## 4. Generator architecture

### Versions

- Schema version: `1`.
- Generation version: `1`.
- State version: `1`.
- Five rounds; 15,000 ms each.

There is no separate rules-version field in prepared sessions or challenge payloads. Score/state changes still require an ADR and fixture review; if they need public compatibility, introduce an explicit version deliberately rather than pretending one already exists.

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

## 5. Current catalog

### Difficulty

| Round | Tier | Square-size choices | Delta choices |
|---:|---|---|---|
| 1 | beginner | 4 | 8, 10, 12 |
| 2 | steady | 4 or 5 | 5, 6, 7 |
| 3 | tricky | 5 | 3 or 4 |
| 4 | tricky | 5 | 3 or 4 |
| 5 | expert | 6 | 1 or 2 |

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

The domain state is exactly:

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

Only `src/lib/client/pixel-storage.ts` persists state.

Key: `one-pixel-off:stats:v1`.

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

`loadPixelStats` catches access/JSON errors and returns empty stats for invalid shape. It does not currently delete a corrupt key or expose a diagnostic. `recordPixelSession` validates session ID length (1–128), found count (0–5), and score (0–1250), merges aggregates, writes, and returns a boolean. `GameShell` ignores the boolean after recording once per session ID per mount.

No preference key, detailed history, canonical Daily result, cross-tab coordination, byte limit, migration, clear-data UI, or active-session snapshot exists.

## 9. Sharing adapter

Session results encode the prepared seed and form `${origin}/challenge/${token}`. `shareChallenge` sends title, score-bearing text, and URL through `navigator.share`; AbortError/NotAllowedError is treated as cancelled. Other failure falls through to clipboard. Clipboard failure returns `manual-copy-required`, and the UI exposes a read-only selectable URL.

The score is in share text, not in the challenge token.

## 10. PWA/offline architecture

The manifest is implemented and points `start_url` to `/play`. `ServiceWorkerRegistration` registers `/sw.js` in production after page load and swallows registration failure.

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

No consent platform or live AdSense request is implemented. GameShell contains no AdSlot.

## 12. Error model

Domain result codes are:

- `INVALID_SEED`
- `INVALID_DATE`
- `INVALID_SESSION`
- `TOKEN_INVALID`
- `TOKEN_UNSUPPORTED`

Expected setup/challenge errors are displayed in `GameShell`. Invalid/stale reducer actions return state unchanged. Storage/share/service-worker capability failures are caught at adapter boundaries. App Router error boundaries remain last-resort UI for unexpected failures.

## 13. Current route inventory

Indexable sitemap routes: `/`, `/play`, `/how-to-play`, `/categories`, `/about`, `/privacy`, `/terms`, `/contact`.

Support/dynamic: `/challenge/[token]`, `/offline`, `/ads.txt`, manifest, robots, sitemap, Open Graph image, favicon/icon, error and not-found boundaries.

There is no dedicated `/daily`, `/stats`, or `/daily/archive` route.

## 14. Performance and privacy

- Puzzle rendering is inline SVG; no gameplay image payload.
- Descriptors are generated once during session preparation and retained in state.
- Timer tick updates component/reducer state every 100 ms while playing.
- No gameplay API or remote media call.
- No application analytics are currently implemented.
- Local aggregates stay in browser storage through application code.
- Challenge paths contain the seed token and can reach hosting/request logs; privacy copy must continue to disclose chosen sharing and normal hosting behavior.

## 15. Roadmap boundaries

Not currently implemented:

- roving/arrow-key grid navigation;
- granular live-region timer strategy;
- stored preferences or detailed/canonical Daily results;
- active-session restoration;
- guaranteed offline game shell;
- phase-aware service-worker updates;
- analytics/consent/live ads;
- generator rejection/fallback system;
- server-authoritative scores.

Future docs may state these as acceptance criteria, but must not describe them as current behavior before code and tests land.

## 16. Verification story

1. Open `/play`; prepare Quick; confirm five valid rounds.
2. Exercise new wrong, repeat wrong, found before deadline, and timeout at deadline.
3. Confirm state phases and score fixtures.
4. Share result; inspect `/challenge/[token]`; confirm same round descriptors.
5. Open `/play?mode=daily`; confirm same UTC seed/session across contexts.
6. Corrupt/block `one-pixel-off:stats:v1`; confirm gameplay/results remain usable.
7. Test invalid/oversized/unsupported challenge path tokens.
8. Test production navigation failure reaches `/offline`, without claiming full offline gameplay.
9. Inspect console/network and run generator, challenge, reducer, lint, typecheck, full test, and build gates.
