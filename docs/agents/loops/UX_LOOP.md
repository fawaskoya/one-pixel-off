# UX refinement loop

Improve one implemented interface state without changing pixel-domain contracts as a visual shortcut.

## Inputs

- State/story: `[SETUP/READY/PLAYING/ROUND_RESULT/SESSION_RESULT/CONTENT]`
- Observed issue/evidence: `[ISSUE]`
- Acceptance criterion: `[CRITERION]`
- Owned files: `[FILES]`

Read the design system, current GameShell/CSS, domain state, and tests. Inspect the live state before editing.

## Baseline truth

- Setup is component state; reducer phases are ready, playing, round_result, session_result.
- Boards are square 4×4, 5×5, or 6×6.
- Native cell buttons use one roving Tab stop, Arrow/Home/End navigation, and Enter/Space activation.
- Cells scale from the square board without an intrinsic minimum; measure narrow/short viewport targets and containment together.
- Wrong uses coral inset border; revealed target uses signal-deep inset border.
- Forced-colors CSS is basic and does not explicitly differentiate those pseudo-elements.
- Reduced motion globally shortens transition/animation duration.
- No game phase contains AdSlot.

## Procedure

1. Capture baseline at desktop, 700px, ≤380px, short landscape, reduced motion, and forced colors as relevant.
2. State one hypothesis and measurable acceptance criterion.
3. Confirm no deterministic, score, deadline, token, or storage contract change.
4. Add a focused component/browser assertion where practical.
5. Implement only in owned files.
6. Verify all affected phases and square grid sizes.
7. Run focused tests, lint, typecheck, build, and browser story as relevant.
8. Compare before/after, inspect console/network, report, and stop.

## State checks

### Setup

- Quick/Daily radio semantics and Challenge lock are clear.
- Error alert and Prepare/Accept action work.
- Claims match aggregate local stats and limited offline behavior.

### Ready

- Board not rendered.
- Round/difficulty/mode clear.
- Start action dispatches once with current guard.

### Playing

- Grid is square and uses current `gridSize`.
- No target reveal attribute/style before result.
- Timer/wrong count do not obscure board.
- Native touch and keyboard activation work.
- Any arrow navigation is described only after implementation/testing.
- No ad, share CTA, or consent interruption.

### Round result

- Found/timeout, score, wrongs, and target are legible.
- Disabled board remains understandable.
- Next action is clear.

### Session result

- Total score/found/wrong and share/new Quick/Daily actions are accurate.
- Do not invent per-round history, streak, median time, or visible stored stats.

## Design guardrails

Use implemented tokens: canvas `#090c11`, panel `#f2efe5`, signal `#c8ff38`, coral `#ff7166`, cobalt `#5572ff`, system sans/mono. Keep puzzle palette colors from catalog. Preserve square cells and restrained hard shadows.

Avoid target leaks, decorative animation near the clock, toy/casino styling, fake offline/account claims, and ad-like puzzle cards.

## Accessibility hardening candidates

These are roadmap until a task implements them:

- roving focus/arrow navigation;
- ≥44px at ≤380px;
- non-color wrong/target marks;
- explicit phase focus movement;
- bounded timer/result announcements;
- 200% zoom and screen-reader evidence.

When implementing one, update tests/docs to move only that item into the current baseline.

## Handoff

Report state/issue, acceptance criterion, files, before/after evidence, viewport/input/motion/contrast matrix, tests, domain-contract impact, remaining roadmap limitations, and next bounded UX issue.
