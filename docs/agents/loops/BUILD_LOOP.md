# Build loop

Run one bounded engineering iteration against the implemented One Pixel Off baseline, prove it, report it, and stop.

## Inputs

- Objective: `[ISSUE/REQUEST]`
- Owned files: `[SCOPE]`
- Excluded files: `[SCOPE]`
- Required evidence: `[TEST/BROWSER]`

Read `AGENTS.md`, master build prompt, relevant specs, `src/domain/pixel/**`, affected UI/adapter/routes, tests, and git state.

## Current-contract reminder

- square grids only 4/5/6;
- difficulty beginner/steady/tricky/tricky/expert with source constants;
- xmur3 → mulberry32 generation version 2;
- one scalar target mutation;
- phases ready/playing/round_result/session_result;
- tap reconciles deadline first; `>=` times out;
- found score `clamp(100 + floor(remaining/100) - 20*wrong,25,250)`;
- challenge `/challenge/[token]`, `opo1`, limits 256/192/96;
- aggregate stats key only;
- navigation-only offline fallback.

## Procedure

1. Reproduce current behavior and capture the first failing layer.
2. Classify it as defect, explicit enhancement, or stale expectation.
3. State acceptance criteria and deterministic/state/token/storage version impact.
4. Add the smallest authoritative test.
5. Implement only in owned files.
6. Run focused test, adjacent pixel tests, lint, typecheck, full tests, build, and browser story as applicable.
7. Exercise boundary/malformed/stale/capability-failure cases.
8. Inspect diff for unrelated changes and target/token/storage leakage.
9. Update docs/ADR only when contract changed.
10. Report and stop.

## Selection order

1. Invalid/multiple/zero target or deterministic drift.
2. Deadline, guard, outcome, or score integrity.
3. Challenge decode/reproduction or storage crash.
4. Core UI/input/accessibility blocker.
5. Build/route/offline failure.
6. Bounded polish or content work.
7. Ads/growth only after gates and authorization.

## Prohibited shortcuts

- Do not add rectangular grids or old score formulas.
- Do not replace PRNG/draw order casually.
- Do not invent reducer phases.
- Do not move challenge tokens to query strings.
- Do not add stored preferences/first Daily history from stale docs.
- Do not claim generator fallback or guaranteed offline play unless implemented.
- Do not deploy or alter external accounts.

## Handoff

Report outcome, chosen issue, files, shipped behavior, version impact, exact test output, browser/accessibility evidence, known roadmap limitations, and next bounded issue.
