# Game logic specification

This document describes the implemented generation-version-1/state-version-1 behavior under `src/domain/pixel/**`. Roadmap items are isolated at the end.

## 1. Fixed constants

```ts
PIXEL_SCHEMA_VERSION = 1
PIXEL_GENERATION_VERSION = 1
PIXEL_STATE_VERSION = 1
PIXEL_SESSION_ROUNDS = 5
PIXEL_ROUND_DURATION_MS = 15_000
PIXEL_MAX_ROUND_SCORE = 250
PIXEL_MAX_SESSION_SCORE = 1_250
ROUND_DIFFICULTIES = ["beginner", "steady", "tricky", "tricky", "expert"]
CHALLENGE_SEED_MAX_LENGTH = 96
CHALLENGE_TOKEN_MAX_LENGTH = 256
```

`SEED_MAX_LENGTH = 128` also exists, but `normalizePixelSeed` currently enforces `CHALLENGE_SEED_MAX_LENGTH`, so the effective session-seed maximum is 96.

## 2. Core types

```ts
type PixelSessionMode = "quick" | "daily" | "challenge";
type DifficultyTier = "beginner" | "steady" | "tricky" | "expert";
type RoundIndex = 0 | 1 | 2 | 3 | 4;
type GridSize = 4 | 5 | 6;
type MutationKind = "offset" | "size" | "spacing" | "stroke" | "rotation";
type PixelRoundResultKind = "found" | "timeout";
```

All grids are square. A `gridSize` of 4, 5, or 6 means 16, 25, or 36 cells. There are no rectangular 20- or 30-cell boards.

## 3. Seed and PRNG contract

### Accepted seed

`normalizePixelSeed`:

1. Requires a string.
2. Normalizes it to Unicode NFC.
3. Requires length `1…96`.
4. Requires `^[A-Za-z0-9._~:|-]+$`.

The normalized seed must equal the payload seed when a challenge is decoded; noncanonical decomposed input is rejected there.

### Pinned PRNG

Generation uses:

```text
createSeededRandom(seed) = mulberry32(xmur3(seed)())
```

`xmur3` NFC-normalizes, iterates JavaScript string code units with pinned 32-bit `Math.imul`/rotation operations, and returns an unsigned 32-bit value. `mulberry32` advances by `0x6d2b79f5` and returns a float in `[0,1)`.

Pinned fixture:

```text
xmur3("pixel-fixture")() = 1501323770
first mulberry32 values:
0.1887956983409822
0.19260986987501383
0.3917407102417201
0.5764393378049135
0.03159756935201585
```

`randomInteger(random, minimum, maximum)` accepts an inclusive integer range and returns:

`minimum + floor(random() × (maximum - minimum + 1))`

There is no rejection sampling in generation version 1.

### Random stream labels

- Session catalog order: `${seed}|g1|session`.
- Per-puzzle generation: `${seed}|g1|r${roundIndex}`.

The session stream shuffles the eight-family catalog, then shuffles the six-palette catalog using the continued stream, and takes five from each. Per-round generation selects grid size, base recipe details, mutation candidate/magnitude/sign, and target index in its pinned call order.

## 4. Daily and Quick seeds

Daily date keys must be real UTC dates in `YYYY-MM-DD`. Daily seed is exactly:

`opo|daily|g1|YYYY-MM-DD`

A Daily session rejects a seed that does not exactly match its supplied UTC date. Non-Daily modes reject a non-null Daily date.

The UI’s Quick seed format is:

`quick-<Date.now base36>-<uint32 base36>-<uint32 base36>`

The two integers use `crypto.getRandomValues` when available. Fallback uses `Date.now()` and `Math.random()`. The seed is an opaque reproducibility key, not a security credential.

## 5. Catalog

### Palette catalog and order

| ID | Background | Primary | Accent |
|---|---|---|---|
| `ink-coral` | `#FFF6ED` | `#18212F` | `#F05D5E` |
| `navy-mint` | `#EEFDF7` | `#132A3A` | `#36B88A` |
| `plum-lemon` | `#FFFBEA` | `#43213F` | `#E9B949` |
| `forest-sky` | `#EFF9FF` | `#163B2D` | `#4B9FD8` |
| `cocoa-peach` | `#FFF3EC` | `#422C27` | `#EE8D6A` |
| `slate-lilac` | `#F7F4FF` | `#283044` | `#9A7FD1` |

### Family catalog and order

1. `rings`
2. `stripes`
3. `arrows`
4. `corners`
5. `dots`
6. `diamonds`
7. `chevrons`
8. `orbit`

Each session uses five distinct shuffled families and five distinct shuffled palettes.

### Vector primitives

Allowed kinds: `circle`, `rect`, `line`, `polygon`. View box is always 100. Geometry, stroke width, and rotation are integer-only. Color fields refer to roles `background`, `primary`, `accent`, or `none`; raw token/user colors are never parsed.

### Family mutation candidates

Each family builds an authored source glyph and exposes exactly these scalar candidates:

| Family | Candidate kind / field | Primitive / coordinate | Bounds |
|---|---|---|---|
| rings | size / geometry | 0 / radius (2) | 18…44 |
| rings | offset / geometry | 1 / cx (0) | 36…64 |
| rings | offset / geometry | 1 / cy (1) | 36…64 |
| rings | stroke / strokeWidth | 0 / — | 1…20 |
| stripes | spacing / geometry | 1 / x (0) | 23…47 |
| stripes | offset / geometry | 2 / y (1) | 8…32 |
| stripes | size / geometry | 3 / width (2) | 6…21 |
| stripes | rotation / rotationDeg | 0 / — | -20…20 |
| arrows | size / geometry | 0 / point x (6) | 68…96 |
| arrows | offset / geometry | 0 / point y (7) | 36…64 |
| arrows | spacing / geometry | 1 / x2 (2) | 41…69 |
| arrows | stroke / strokeWidth | 1 / — | 1…20 |
| corners | size / geometry | 0 / y1 (1) | 30…54 |
| corners | spacing / geometry | 1 / x2 (2) | 30…54 |
| corners | offset / geometry | 2 / x1 (0) | 70…94 |
| corners | stroke / strokeWidth | 3 / — | 1…20 |
| dots | offset / geometry | 4 / cx (0) | 36…64 |
| dots | offset / geometry | 4 / cy (1) | 36…64 |
| dots | size / geometry | 0 / radius (2) | 1…18 |
| dots | spacing / geometry | 8 / cx (0) | 58…82 |
| diamonds | size / geometry | 0 / y (1) | 0…24 |
| diamonds | offset / geometry | 0 / x (2) | 76…100 |
| diamonds | spacing / geometry | 1 / y (3) | 36…64 |
| diamonds | stroke / strokeWidth | 1 / — | 1…20 |
| chevrons | offset / geometry | 0 / y1 (1) | 16…40 |
| chevrons | spacing / geometry | 1 / x2 (2) | 6…30 |
| chevrons | size / geometry | 2 / x2 (2) | 70…94 |
| chevrons | stroke / strokeWidth | 3 / — | 1…20 |
| orbit | size / geometry | 0 / radius (2) | 18…42 |
| orbit | offset / geometry | 1 / cy (1) | 8…32 |
| orbit | spacing / geometry | 2 / cx (0) | 68…92 |
| orbit | size / geometry | 3 / radius (2) | 1…20 |

Base stroke is randomly 3, 4, or 5. Some recipes randomly assign an accent or arrow rotation as part of the source glyph; these are not target-only mutations.

## 6. Difficulty and grid logic

Magnitude bands are mutation-aware because geometry coordinates, non-scaling
stroke widths, and rotation degrees do not have equal visual weight:

| Difficulty | Grid sizes | Geometry: offset / size / spacing | Stroke | Rotation |
|---|---|---|---|---|
| beginner | 4 | 8, 10, 12 | 3, 4 | 10°, 12° |
| steady | 4, 5 | 6, 7, 8 | 2, 3 | 8°, 9° |
| tricky | 5 | 5, 6 | 2, 3 | 7°, 8° |
| expert | 6 | 4, 5 | 1, 2 | 6°, 7° |

The dense 6×6 expert grid remains the hardest round. Its geometry and rotation
floors prevent changes from collapsing below roughly one rendered pixel on a
small phone, while stroke stays lower because the renderer uses non-scaling
strokes and a one-unit weight change remains perceptible.

Round schedule:

| Round | Index | Difficulty | Possible grid |
|---:|---:|---|---|
| 1 | 0 | beginner | 4×4 |
| 2 | 1 | steady | 4×4 or 5×5 |
| 3 | 2 | tricky | 5×5 |
| 4 | 3 | tricky | 5×5 |
| 5 | 4 | expert | 6×6 |

Mutation sign is tried in randomized order and must keep `from ± magnitude` within the selected candidate bounds. The mutation records kind, primitive index, field, optional coordinate index, from, to, and signed delta.

## 7. Puzzle generation

For each round:

1. Initialize the per-round PRNG.
2. Choose grid size from the difficulty array.
3. Build the selected family source glyph, including its random base stroke/accent/orientation choices.
4. Choose one family mutation candidate.
5. Choose one magnitude from the difficulty band for the candidate mutation kind.
6. Choose a valid sign and create one mutation descriptor.
7. Apply that scalar change to produce the target glyph.
8. Choose target index uniformly through the float/inclusive-integer helper.
9. Create `gridSize²` row-major cells: target gets target glyph/mutation; every other cell gets source glyph/null.
10. Return the descriptor with stable ID `opo-g1-r<round>-<stableSeedHash(seed|round)>`.

There is no candidate retry, rejection loop, or fallback puzzle in generation version 1.

## 8. Puzzle invariants

`pixelPuzzleInvariantViolations` checks:

- schema/generation version 1;
- round index 0…4;
- allowlisted difficulty, grid `{4,5,6}`, family, and palette;
- mutation magnitude allowed by its difficulty and mutation-kind band;
- source family consistency and puzzle ID length 1…96;
- primitive geometry shape and integer bounds;
- circle/rect bounds, stroke rules, rotation -180…180;
- cell count equals `gridSize²`;
- target index within cells;
- row-major cell index/row/column;
- target has one mutation and exactly one scalar glyph difference matching both mutation descriptors;
- every non-target has null mutation and zero scalar glyph differences;
- exactly one mutation-bearing target.

Session invariants additionally check five rounds, matching difficulty sequence, unique round IDs, five distinct family IDs, seed/mode/Daily envelope, and catalog/version validity.

## 9. Prepared session

`generatePixelSession` validates mode/seed/date, shuffles catalogs, and creates exactly five rounds synchronously. It returns either a `PreparedPixelSession` or a typed error. Session ID is:

`opo-<mode>-g1-<stableSeedHash(seed)>`

Quick and Challenge with the same seed generate equal round descriptors but different session IDs because mode is part of the session ID.

## 10. State machine

### States

```ts
type PixelGameState =
  | { phase: "ready"; roundIndex; progress; lastNowMs; phaseToken; ... }
  | { phase: "playing"; roundIndex; progress; lastNowMs; phaseToken;
      startedAtMs; deadlineMs; wrongCellIndexes; ... }
  | { phase: "round_result"; roundIndex; progress; lastNowMs;
      phaseToken; outcome; ... }
  | { phase: "session_result"; progress; lastNowMs; completedAtMs; ... };
```

Setup and error are GameShell component states; they are not reducer phases.

### Guards

`START_ROUND`, `TAP_CELL`, `CLOCK_TICK`, and `NEXT_ROUND` include a guard with session ID, round index, and phase token. If phase or guard does not match, the action is a no-op. Candidate phase tokens must be nonblank, maximum 128, and different; otherwise a deterministic suffix token is created.

### Time

`finiteNow(last, proposed)` rejects nonfinite values and otherwise returns `max(last, proposed)`. Time cannot move backward in reducer state.

Starting records:

- `startedAtMs = nowMs`
- `deadlineMs = nowMs + 15000`

Both clock ticks and cell taps call `advancePixelClock`. At `nowMs >= deadlineMs`, timeout is constructed before the cell index or target is considered.

### Transition table

| State | Action | Guard/result | Next |
|---|---|---|---|
| ready | START_ROUND | valid finite time | playing, empty wrongs, deadline set |
| ready | any other/stale | invalid | unchanged |
| playing | CLOCK_TICK | time < deadline | playing with monotonic `lastNowMs` |
| playing | CLOCK_TICK | time ≥ deadline | round_result timeout |
| playing | TAP_CELL | time ≥ deadline | round_result timeout |
| playing | TAP_CELL | invalid index, time remains | playing after clock advance |
| playing | TAP_CELL | target, time remains | round_result found |
| playing | TAP_CELL | new wrong, time remains | playing, append index |
| playing | TAP_CELL | repeated wrong, time remains | playing unchanged apart from clock advance |
| round_result | NEXT_ROUND | rounds 1–4 | ready at next index |
| round_result | NEXT_ROUND | round 5 | session_result |
| any | stale/wrong-phase action | — | unchanged |

### Timeout outcome

- result `timeout`;
- `endedAtMs = deadlineMs`;
- `elapsedMs = 15000`;
- `remainingMs = 0`;
- preserves unique wrong indexes;
- score `0`.

The state’s `lastNowMs` can be later than the recorded deadline after a throttled tab resumes.

### Found outcome

- result `found`;
- elapsed clamps to `0…15000` from `nowMs - startedAtMs`;
- remaining is `15000 - elapsed`;
- preserves unique wrong indexes;
- score is computed once by `scoreFoundRound`.

## 11. Scoring

```ts
raw = 100 + floor(clamp(remainingMs, 0, 15000) / 100)
      - 20 * max(0, floor(finiteUniqueWrongCountOrZero))

foundScore = clamp(raw, 25, 250)
timeoutScore = 0
sessionScore = min(1250, sum(outcome.score))
```

Fixtures:

| Remaining | Unique wrong | Found score |
|---:|---:|---:|
| 15000 | 0 | 250 |
| 12000 | 0 | 220 |
| 7500 | 2 | 135 |
| 0 | 0 | 100 |
| 0 | 4 | 25 |
| 0 | 99 | 25 |

Although `scoreFoundRound(0,…)` is defined, a UI tap at the exact deadline produces timeout because deadline reconciliation happens first.

## 12. Challenge token

Payload type:

```ts
type ChallengePayloadV1 = { v: 1; g: 1; s: string };
```

Token format:

`opo1.<canonical-unpadded-base64url-UTF8-JSON>.<16 lowercase hex>`

The checksum concatenates two padded xmur3 hashes:

- `xmur3("opo-checksum-a|" + payloadSegment)`
- `xmur3("opo-checksum-b|" + payloadSegment)`

It is integrity/copy-error detection, not a signature.

Decoder order:

1. Require string, 1…256 chars, overall token alphabet.
2. Require three nonempty segments.
3. Require prefix `opo1`; otherwise `TOKEN_UNSUPPORTED`.
4. Require 16 lowercase hex checksum and constant-work match.
5. Decode canonical unpadded base64url.
6. Reject more than 192 decoded bytes.
7. Decode fatal UTF-8 and parse JSON.
8. Require plain record and exactly keys `g,s,v`.
9. Require `v=1`, `g=1`, and canonical safe seed of maximum 96 chars.

The route is `/challenge/[token]`, not a query parameter. The token contains no score, duration, target, cell data, player identity, or secret.

## 13. Local aggregate stats

Only completed `session_result` states are recorded, once per session ID per mounted GameShell.

Storage key: `one-pixel-off:stats:v1`.

Validated shape:

```ts
{
  schemaVersion: 1,
  sessionsCompleted: safeNonnegativeInteger,
  roundsFound: safeNonnegativeInteger,
  totalScore: safeNonnegativeInteger,
  bestScore: integer0To1250,
  dailyDatesCompleted: stringsMatchingYYYYMMDD, maximum400
}
```

Stored Daily strings are regex-checked, not full calendar-validated. Dates are deduplicated and sliced to the latest 400 array entries. Invalid/corrupt/inaccessible storage loads as empty stats. A failed/invalid write returns `false`. There is no preferences/history/first-attempt/active-session data.

## 14. UI interaction baseline

- Cells are native buttons with labels `Tile <row>, <column>`.
- Every cell is in normal tab order during play; Enter/Space trigger native click.
- Arrow-key/roving-grid navigation is not implemented.
- During result, all cells are disabled; target gets `data-target`, wrong cells retain `data-wrong`.
- The playing timer ticks every 100 ms in GameShell and displays tenths.
- Wrong count is announced in a polite live region.
- Round result text names the mutation kind, not the exact scalar/primitive.

## 15. Test matrix

### Implemented unit coverage

- Pinned xmur3/mulberry32 output and Unicode normalization.
- Same-seed session equality and Quick/Challenge round equality.
- Invalid seed and Daily-date cases.
- All family and palette construction.
- Exactly one scalar target mutation and forged second-mutation detection.
- Grid set `{4,5,6}`, bounded target, difficulty/delta sequence, family coverage.
- Challenge round trip, 96-char boundary, 256-char token, corruption, unsupported prefix, schema/prototype/UTF-8/192-byte/fuzz input.
- Reducer guards, deadlines, wrong uniqueness, five-round progression, fuzzed invalid actions, score bounds/selectors.

### Required browser verification

| Story | Expected |
|---|---|
| Quick | five rounds, local generated boards, result/share |
| Daily | same UTC seed/boards within generation v1 |
| Challenge | `/challenge/[token]` reproduces seed boards |
| Wrong repeat | one penalty/index only |
| Exact deadline | timeout, never found |
| Background | first resumed tick/tap at/after deadline times out |
| Storage denied/corrupt | session/results still work |
| Share unavailable | clipboard or manual URL fallback |
| Offline navigation | `/offline` fallback; no guarantee of play shell |
| Keyboard baseline | Tab plus Enter/Space; arrow keys currently absent |

## 16. Roadmap, not current behavior

- Roving grid focus/arrow keys and richer live-region strategy.
- Explicit persistence byte ceilings/migrations/clear controls.
- Canonical first-attempt Daily results or streaks.
- Guaranteed cached offline gameplay and phase-aware SW updates.
- Generator retry/fallback/perceptual rejection pipeline.
- Separate scoring/rules version if compatibility requires it.
- Server-authoritative competition.

Do not write tests or docs that assume these exist before implementation.
