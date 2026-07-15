# Complete-story QA loop

Verify one complete One Pixel Off story across route, pixel domain, reducer, adapter, UI, and fallback. Fix only authorized files and stop after re-verification.

## Inputs

- Target build/URL: `[TARGET]`
- Browser/device matrix: `[MATRIX]`
- Allowed fixes: `[FILES]`

Default story:

`/play Quick → five rounds including wrong→found and timeout → session_result → share → fresh /challenge/[token] with identical rounds → /play?mode=daily same UTC boards → corrupt/blocked aggregate storage → failed navigation offline fallback`

## First-layer order

1. Route/path input.
2. Challenge/Daily/seed parsing.
3. Generator/invariants.
4. Reducer/clock/score.
5. Storage/share/service-worker adapter.
6. UI/render/input/accessibility.

Do not patch the UI to hide a lower-layer defect.

## Matrix

### Generator

- Exactly five rounds.
- Square `gridSize` only 4, 5, 6; cells equal size².
- Difficulty order beginner, steady, tricky, tricky, expert.
- Correct delta set per tier.
- Five distinct families from exact eight-item catalog.
- Palettes from exact six-item catalog.
- One target, one mutation, one scalar difference; every non-target equals source.
- Same seed/generation 1 reproduces descriptors.
- No gameplay fetch/AI/image request.

### Ready/start

- Setup is component state, not reducer state.
- Prepared session enters `ready`.
- Board absent until playing.
- Stale/double START guard is a no-op.
- Deadline equals start + 15000.

### Tap/clock

- New wrong appends once and clock continues.
- Same wrong repeats without another penalty.
- Invalid index cannot find/penalize.
- Target at deadline-1 finds.
- Target at deadline and deadline+1 times out.
- Backward event time clamps; nonfinite time is ignored.
- Background return at/after deadline times out.
- Stale phase/session/round guard is ignored.

### Score/result

- Formula `clamp(100 + floor(remaining/100) - 20*wrong,25,250)`.
- Fixtures: 15000/0=250; 12000/0=220; 7500/2=135; 0/0=100; 0/99=25.
- Timeout 0; session max 1250.
- Phases are ready → playing → round_result; after fifth NEXT_ROUND → session_result.
- Target is marked only in result DOM.

### Challenge

- URL is `/challenge/[token]`.
- Format `opo1.payload.16hex`; max token 256.
- Payload exact `{v:1,g:1,s}`; decoded max 192 bytes; seed max 96.
- Test missing/truncated/tampered/bad checksum/alphabet/base64/UTF-8/JSON/shape/extra keys/unsafe seed.
- Unknown prefix returns unsupported rather than generic invalid.
- Fresh challenge rounds equal source seed rounds.
- Token excludes score, target, descriptor, player data, duration.

### Daily

- Seed exact `opo|daily|g1|YYYY-MM-DD` UTC.
- Invalid calendar date rejected.
- Same UTC date reproduces.
- Do not expect first-attempt result or practice labels; they are not implemented.

### Storage/share

- Only key `one-pixel-off:stats:v1`.
- Valid completed session increments aggregate and Daily date set.
- Invalid/corrupt/blocked/quota storage does not block results.
- Best/session score bounds and 400-date cap.
- Native share → clipboard → manual URL.
- Score may be share text but is absent from token.

### UI/accessibility baseline

- Native buttons work with Tab/Enter/Space.
- Arrow navigation is currently absent; log as roadmap unless task implements it.
- Test 4×4, 5×5, 6×6; ≤380 px fluid target sizing; short landscape/desktop.
- Reduced motion CSS applies.
- Forced colors base styling applies; inspect wrong/target distinction as known gap.
- No pre-reveal target attribute/style/label leak.
- No AdSlot in GameShell.

### Offline/PWA

- Manifest starts `/play`.
- Production SW caches only `/offline` and `/icon.svg` explicitly.
- Failed GET navigation falls back to `/offline`.
- Do not mark offline Quick guaranteed merely because browser cache sometimes retains chunks.
- Registration failure is nonblocking.

### Routes/content

- Sitemap: `/`, `/play`, `/how-to-play`, `/categories`, `/about`, `/privacy`, `/terms`, `/contact`.
- Challenge and offline are noindex; robots disallow `/challenge/`.
- There is no `/daily` or `/stats` route.

## Fix loop

1. Capture first failure and expected current contract.
2. Add focused regression proof.
3. Fix authoritative layer in owned files.
4. Run focused, adjacent, lint, typecheck, full tests, build as applicable.
5. Restart complete story from clean state.
6. Inspect diff and version/document impact.
7. Report and stop.

## Handoff

Report environment, story result, matrix coverage, first failure/layer, files, exact checks, current-vs-roadmap issues, version impact, and unresolved severity-ranked defects. Do not deploy.
