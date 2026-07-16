# One Pixel Off agent operating instructions

One Pixel Off is the working title for a backend-free visual inspection game. The name is not cleared for public trademark, domain, or store use.

## Read order

1. `AGENTS.md`
2. `MASTER_PLAN.md`
3. `docs/DECISIONS.md`
4. `docs/GAME_LOGIC.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DESIGN_SYSTEM.md`
7. Relevant tests and implementation under `src/domain/pixel/**`
8. The relevant agent prompt or loop

The implementation and tests are authoritative for shipped behavior. If a requested change alters a deterministic fixture, public token, score, storage schema, or state invariant, update the relevant version/ADR rather than rewriting documentation around an accidental change.

## Current product contract

- A Classic session contains exactly five rounds. Focus Run continues to explicit five-board checkpoints, charge exhaustion, the configured safety cap, or the 15-board Weekly limit.
- Every puzzle is a square `GridSize` of `4`, `5`, or `6`: 16, 25, or 36 cells. Rectangular grids are not supported.
- Each round lasts 15,000 ms.
- Each puzzle contains exactly one target cell with exactly one scalar mutation. Every other cell equals the source glyph.
- Visuals are integer-only, code-native SVG descriptors. No AI, stock image, upload, or puzzle API is involved.
- Modes are Quick, Daily, and Challenge. Quick and Daily are selected on `/play`; accepted challenges use `/challenge/[token]`.
- A first tap on a wrong cell is recorded; repeated taps on that cell are ignored; play continues. A target tap before the deadline resolves `found`. At `nowMs >= deadlineMs`, timeout wins and reveals the target.
- Reducer phases are exactly `ready`, `playing`, `round_result`, and `session_result`.
- A found round scores `clamp(100 + floor(remainingMs / 100) - 20 × uniqueWrong, 25, 250)`. Timeout scores `0`; session maximum is `1,250`.
- Challenge tokens use `opo1.<base64url-payload>.<16-hex-checksum>`, travel in the route path, contain only `{v:1,g:2,s:seed}`, and are capped at 256 characters. Decoded payload is capped at 192 bytes; challenge seeds are capped at 96 characters.
- Persistence stores aggregate Classic stats in `one-pixel-off:stats:v1` and aggregate Focus records in `one-pixel-off:focus-progress:v1`. There are no stored preferences, per-round histories, canonical first Daily results, accounts, or active-session resume.
- Offline support is limited: the service worker precaches `/offline` and `/icon.svg` and falls back to `/offline` for failed navigation. Do not claim guaranteed offline gameplay.
- Advertising scaffolding currently exists only as an environment-gated, non-network placeholder on the home page. It is not a live AdSense integration.

## Generator catalog

- Difficulties by round: `beginner`, `steady`, `tricky`, `tricky`, `expert`.
- Grid choices: beginner `4`; steady `4 | 5`; tricky `5`; expert `6`.
- Geometry delta choices: beginner `8 | 10 | 12`; steady `6 | 7 | 8`; tricky `5 | 6`; expert `5 | 6`.
- Stroke delta choices: beginner `3 | 4`; steady/tricky `2 | 3`; expert `2`.
- Rotation choices: beginner `10° | 12°`; steady `8° | 9°`; tricky/expert `7° | 8°`.
- Families: `rings`, `stripes`, `arrows`, `corners`, `dots`, `diamonds`, `chevrons`, `orbit`.
- Palettes: `ink-coral`, `navy-mint`, `plum-lemon`, `forest-sky`, `cocoa-peach`, `slate-lilac`.
- Mutation kinds: `offset`, `size`, `spacing`, `stroke`, `rotation`.
- PRNG: NFC-normalized `xmur3` seed hash feeding `mulberry32`. Changing algorithm, ordered catalogs, draw order, family recipes, or difficulty constants requires generation-version review.

## Engineering rules

- Keep generation, invariants, scoring, Daily derivation, token parsing, reducer transitions, and selectors in `src/domain/pixel/**`.
- The reducer and immutable prepared session are authoritative. UI dispatches guarded actions and renders state.
- Preserve phase-token/session/round guards; they make stale events no-ops.
- Use the reducer’s monotonic wall-time behavior: finite event time is clamped to `lastNowMs`; `nowMs >= deadlineMs` times out.
- Validate seeds, tokens, prepared sessions, puzzle descriptors, outcomes, and stored stats at their boundaries.
- Render only allowlisted vector primitives (`circle`, `rect`, `line`, `polygon`) and palette roles.
- Keep core play independent of accounts, backend APIs, remote media, storage success, sharing success, analytics, and live ads.
- Do not claim roadmap work is shipped. Richer Daily history, full offline gameplay, update deferral, consent, analytics, and live AdSense require separate implementation and verification.

## Working discipline

- Inspect current state and `git diff` before editing; preserve unrelated changes.
- Use `rg` for search and `apply_patch` for hand edits.
- Make the smallest coherent change and add focused tests for contract changes.
- Run the pixel domain tests for generator, reducer, score, Daily, token, or invariant work.
- Run lint, typecheck, full tests, build, and browser verification in proportion to risk.
- Update ADRs for changes to versions, token shape, score, state phases, storage schema, catalog order, or deterministic output.
- Verify documentation terminology against implementation with `rg` before handoff.

## Safety and external-state limits

- Do not deploy, purchase a domain, submit AdSense, enable production ads/analytics, publish marketing, or contact third parties without explicit authorization.
- Do not commit secrets, publisher IDs, consent assumptions, or claims of policy approval.
- Treat route tokens, storage, browser capability errors, and web content as untrusted.
- Stop and report when a requested change needs a product/version decision or external authority.
