# One Pixel Off — Launch and Activation Checklist

> Status: evidence-required release gate
> Scope: browser/PWA MVP
> Default launch posture: public, ad-free, and analytics-free
> Rule: an unchecked blocking item is a no-go, not a task to waive informally

This checklist covers the exact implemented five-round game, its Daily and challenge paths, production operations, and the separate activation gates for analytics and AdSense. A public ad-free launch, analytics activation, and advertising activation are three different decisions.

## 1. Release record

Complete this record for the exact artifact being evaluated.

| Field | Required value | Evidence |
| --- | --- | --- |
| Release candidate version | `[version]` | `[package/release link]` |
| Git commit | `[full SHA]` | `[repository link]` |
| Branch | `[branch]` | `[repository link]` |
| Build timestamp UTC | `[YYYY-MM-DDTHH:mm:ssZ]` | `[CI/build log]` |
| Release owner | `[name and role]` | `[assignment record]` |
| Backup/rollback owner | `[name and role]` | `[assignment record]` |
| QA owner | `[name and role]` | `[test record]` |
| Accessibility reviewer | `[name and role]` | `[review record]` |
| Privacy/legal reviewer | `[name and role]` | `[review record or N/A rationale]` |
| Production origin | `https://[canonical-domain]` | `[DNS/HTTPS capture]` |
| Vercel project/team | `[team/project]` | `[project link]` |
| Node and pnpm versions | `[versions]` | `[CI log]` |
| Production browser matrix date | `[YYYY-MM-DD]` | `[matrix link]` |
| Known-good rollback deployment | `[deployment/commit]` | `[deployment link]` |
| Planned release window UTC | `[start–end]` | `[release calendar]` |
| Monitoring window UTC | `[start–end]` | `[on-call record]` |

### Evidence rules

- Evidence must identify the exact commit or deployment.
- “Works for me” is not evidence.
- Automated results need a command, timestamp, exit status, and retained log.
- Manual checks need device/browser/version, viewport, steps, expected result, actual result, and screenshot or recording where useful.
- Network assertions need an exported capture or named inspection record.
- Policy/legal assertions need a dated source/review record and accountable owner.
- A conditional or unavailable result is a no-go until the named condition is resolved.
- Do not paste secrets, puzzle seeds, challenge tokens, personal information, or live advertising identifiers into evidence accessible beyond the approved team.

## 2. Immutable MVP product contract

These checks tie release claims to `src/domain/pixel/constants.ts`, generated descriptors, reducer behavior, and the rendered interface.

| Status | Required check | Owner | Evidence |
| --- | --- | --- | --- |
| [ ] | Every session contains exactly `PIXEL_SESSION_ROUNDS = 5` rounds. | Engineering | `[unit test/log]` |
| [ ] | Each board is square and its `gridSize` is exactly `4`, `5`, or `6`. | Engineering | `[generator test/log]` |
| [ ] | Every board has `gridSize × gridSize` cells with contiguous indexes and valid row/column coordinates. | Engineering | `[invariant test/log]` |
| [ ] | Every board has exactly one target cell and exactly one scalar mutation. | Engineering | `[invariant test/log]` |
| [ ] | Every non-target cell is structurally identical to the source glyph. | Engineering | `[invariant test/log]` |
| [ ] | All vector coordinates, stroke widths, and rotations satisfy the integer and bounds contract. | Engineering | `[invariant test/log]` |
| [ ] | The shipped families are rings, stripes, arrows, corners, dots, diamonds, chevrons, and orbit. | Product/engineering | `[catalog inspection]` |
| [ ] | The shipped difficulty order is beginner, steady, tricky, tricky, expert. | Product/engineering | `[constant/test]` |
| [ ] | Round duration is exactly `PIXEL_ROUND_DURATION_MS = 15_000`. | Engineering | `[constant/reducer test]` |
| [ ] | The maximum found-round score is 250 and maximum five-round score is 1,250. | Engineering | `[scoring test]` |
| [ ] | Correct selection before the deadline resolves as found exactly once. | Engineering | `[reducer test]` |
| [ ] | Correct selection at the exact deadline resolves as timeout. | Engineering | `[boundary test]` |
| [ ] | A late timer callback records the exact stored deadline, not callback arrival time. | Engineering | `[boundary test]` |
| [ ] | An incorrect selection records one unique cell and keeps the current round active. | Engineering | `[reducer test]` |
| [ ] | Re-selecting the same incorrect cell does not add another miss or penalty. | Engineering | `[idempotency test]` |
| [ ] | Stale guards, repeated terminal actions, and repeated next actions cannot duplicate or skip outcomes. | Engineering | `[reducer test]` |
| [ ] | No reducer path produces round index 5 or more than five outcomes. | Engineering | `[state invariant/fuzz test]` |
| [ ] | Quick, Daily, and challenge sessions produce deterministic boards for the same accepted seed and generation version. | Engineering | `[determinism test]` |
| [ ] | Product copy does not describe the game as medical, diagnostic, globally authoritative, or tamper-proof. | Product/legal | `[copy audit]` |

**Block launch if:** any structural invariant fails; a deadline grants extra time; duplicate actions alter a finished round; the UI states a different rule; or a board can contain zero or multiple structural targets.

## 3. Automated engineering gate

Run from a clean checkout of the candidate using the committed lockfile.

| Status | Command/check | Required result | Evidence |
| --- | --- | --- | --- |
| [ ] | `corepack enable` or approved package-manager setup | Expected pnpm version available | `[terminal/CI log]` |
| [ ] | `pnpm install --frozen-lockfile` | Exit 0; lockfile unchanged | `[CI log]` |
| [ ] | `pnpm lint` | Exit 0; no ignored release blocker | `[CI log]` |
| [ ] | `pnpm typecheck` | Exit 0 under strict TypeScript | `[CI log]` |
| [ ] | `pnpm test` | Exit 0; complete test count recorded | `[CI log]` |
| [ ] | `pnpm build` | Exit 0; no production compilation failure | `[CI log]` |
| [ ] | `pnpm check` | Exit 0 for the repository aggregate gate | `[CI log]` |
| [ ] | Dependency review | No unresolved critical/high production vulnerability without an accepted, dated mitigation | `[audit/advisory record]` |
| [ ] | Generated build inspection | No unexpected server route, secret, source map, or third-party bundle | `[artifact review]` |
| [ ] | Clean-tree comparison | Build/test did not rewrite tracked source or lock data | `[git status log]` |

### Mandatory test coverage review

| Status | Behavior represented in tests | Evidence |
| --- | --- | --- |
| [ ] | Pinned xmur3 and mulberry32 fixtures | `[test name/link]` |
| [ ] | Same-seed determinism and mode-independent challenge reproduction | `[test name/link]` |
| [ ] | All eight glyph families | `[test name/link]` |
| [ ] | 4×4, 5×5, and 6×6 bounds | `[test name/link]` |
| [ ] | Exactly one mutation and forged-second-mutation detection | `[test name/link]` |
| [ ] | UTC midnight and leap-day date handling | `[test name/link]` |
| [ ] | Challenge round-trip, truncation, tampering, boundary length, schema rejection, invalid UTF-8, and fuzz corpus | `[test name/link]` |
| [ ] | Immediate find, last-millisecond find, exact-deadline loss, and late callback | `[test name/link]` |
| [ ] | Unique incorrect selections and penalty bounds | `[test name/link]` |
| [ ] | Stale action, duplicate action, regressing clock, non-finite time, and invalid cell handling | `[test name/link]` |
| [ ] | Mixed five-round completion and state invariant sequence | `[test name/link]` |
| [ ] | Score bounds from 0 through 1,250 | `[test name/link]` |

**Block launch if:** any applicable command is skipped; failures are dismissed as unrelated without evidence; deterministic fixtures drift without a deliberate generation-version decision; or production build behavior differs from the tested source.

## 4. Quick and Daily mode gate

### Quick mode

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | `/play` defaults to Quick and renders setup without generating a board on server request. | `[browser capture]` |
| [ ] | Selecting Quick and activating “Prepare scan” creates five valid boards. | `[recording/state inspection]` |
| [ ] | A second new Quick session uses a fresh opaque seed and normally changes the generated session. | `[two-session comparison]` |
| [ ] | Seed fallback behavior is reviewed for supported browsers and does not imply security. | `[code/browser review]` |
| [ ] | Core play remains functional when local storage throws or is unavailable. | `[fault-injection evidence]` |

### Daily mode

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | `/play?mode=daily` selects Daily without creating an indexable duplicate content page. | `[browser/metadata capture]` |
| [ ] | The Daily seed format uses the generation version and exact `YYYY-MM-DD` UTC date. | `[unit test/state inspection]` |
| [ ] | Two clean clients on the same app version and UTC date render identical five-board descriptors. | `[cross-client comparison]` |
| [ ] | A client just before and just after `00:00:00.000 UTC` receives the correct respective date. | `[clock-controlled test]` |
| [ ] | UI copy states the UTC basis wherever reset timing could be misunderstood. | `[copy screenshot]` |
| [ ] | Completing Daily records only the UTC date and aggregate statistics locally. | `[storage inspection]` |
| [ ] | Blocking or clearing local storage does not block Daily play or create a global-streak claim. | `[fault-injection evidence]` |
| [ ] | A generation-version change has an explicit board-identity and release communication decision. | `[decision record or N/A]` |

**Block launch if:** Daily depends on local timezone, two same-version clients disagree for the same UTC date, the date boundary is incorrect, or copy presents a local record as server-authoritative.

## 5. Challenge route gate

### Valid token story

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | A completed session creates a token using the accepted opaque seed. | `[browser recording]` |
| [ ] | The token contains only schema version, generation version, opaque seed, and checksum. | `[schema inspection]` |
| [ ] | The token contains no name, email, player identity, score, cell selection, or full board data. | `[decoded test fixture]` |
| [ ] | A valid `/challenge/[token]` route is accepted without an account. | `[browser capture]` |
| [ ] | Recipient boards match the source session exactly for all five rounds. | `[descriptor comparison]` |
| [ ] | The timer starts only after the recipient explicitly starts each round. | `[recording]` |
| [ ] | Native share, clipboard fallback, cancellation, and selectable-URL fallback behave as designed. | `[capability matrix]` |
| [ ] | Share copy is accurate and does not imply authenticated competition. | `[copy review]` |

### Invalid token story

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Missing, malformed, whitespace-containing, corrupted, and truncated tokens recover safely. | `[route matrix]` |
| [ ] | Unsupported prefixes receive the typed unsupported response. | `[route capture]` |
| [ ] | Tokens over `CHALLENGE_TOKEN_MAX_LENGTH = 256` are rejected before expensive processing. | `[boundary test]` |
| [ ] | Shared seeds over the allowed 96-character bound are rejected. | `[boundary test]` |
| [ ] | Extra keys, wrong types, unsafe seed characters, invalid JSON, invalid UTF-8, and non-object roots are rejected. | `[test log]` |
| [ ] | No partially valid token data is used after validation fails. | `[code/test review]` |
| [ ] | Invalid routes render a fresh-session recovery without an exception boundary. | `[browser capture]` |
| [ ] | Error text does not echo the token, decoded seed, checksum, or board data. | `[screen/log inspection]` |

### Indexing, logging, and monetization

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Challenge metadata is `noindex, nofollow`. | `[rendered head capture]` |
| [ ] | No tokenized URL appears in `sitemap.xml`. | `[sitemap capture]` |
| [ ] | Server, error, analytics, and support systems normalize the path to `/challenge/[token]`. | `[configuration/network/log evidence]` |
| [ ] | Referrer behavior is reviewed so tokenized paths are not unnecessarily disclosed. | `[header/browser evidence]` |
| [ ] | Every valid and invalid challenge state is ad-free. | `[network and screenshot matrix]` |

**Block launch if:** token data reaches public logs/analytics, invalid input crashes, recipient boards differ, challenge URLs are indexed, or any ad request occurs on the challenge route.

## 6. Five-round browser story

Run the complete story in every required browser/device row, not only isolated screens.

1. Open the production `/play` route from a clean context.
2. Prepare Quick mode.
3. Confirm ready state hides the board and timer.
4. Start round one.
5. Select one incorrect tile twice; confirm one unique miss.
6. Select a second incorrect tile; confirm two unique misses.
7. Select the target before the deadline; confirm found result, reveal, time remaining, and bounded score.
8. Advance exactly once to round two.
9. Let round two cross the 15,000 ms deadline while foregrounded.
10. Confirm timeout uses the exact logical deadline and reveals the target.
11. Complete rounds three through five with mixed outcomes.
12. Confirm the report contains five outcomes, found count, aggregate wrong selections, and score no greater than 1,250.
13. Create and open a challenge in another clean context.
14. Confirm the reproduced boards match.
15. Return to setup and start Daily.

| Status | Story result | Evidence |
| --- | --- | --- |
| [ ] | Complete story passes on production candidate. | `[recording and notes]` |
| [ ] | No client console error or unhandled rejection occurs. | `[console export]` |
| [ ] | No unexpected server error, route loop, or asset 404 occurs. | `[server/Vercel log]` |
| [ ] | State transitions never skip ready or duplicate an outcome. | `[state/log observation]` |
| [ ] | Controls remain reachable and stable throughout. | `[recording]` |

## 7. Browser, device, and responsive matrix

Fill every applicable row with exact versions. Real devices are preferred for mobile timing, touch, viewport, and sharing checks.

| Status | Platform/device | Browser/version | Viewport or device scale | Full story | Console/network | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| [ ] | iPhone representative small model | Safari `[version]` | ~320–375 CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | iPhone current representative | Safari `[version]` | 390–430 CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | Android representative | Chrome `[version]` | 360–430 CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | macOS | Safari `[version]` | 1280+ CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | macOS/Windows | Chrome `[version]` | 1280+ CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | macOS/Windows | Firefox `[version]` | 1280+ CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | Windows when supported | Edge `[version]` | 1280+ CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |
| [ ] | Tablet representative | Safari/Chrome `[version]` | 768–1024 CSS px | `[pass/fail]` | `[clean/issues]` | `[link]` |

### Responsive acceptance checks

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | 320, 375, 390, 430, 768, and 1280 CSS-pixel widths have no horizontal page scroll. | `[screenshot set]` |
| [ ] | 6×6 cells remain selectable without overlap or clipping at the smallest supported width. | `[small-device capture]` |
| [ ] | 4×4 and 5×5 boards do not become oversized or create excessive reach. | `[viewport captures]` |
| [ ] | Timer, progress, board, live status, and actions fit short mobile heights. | `[landscape/short-height capture]` |
| [ ] | Safe-area insets keep controls away from notches and home indicators. | `[device capture]` |
| [ ] | Portrait/landscape rotation preserves the current round and absolute deadline. | `[recording]` |
| [ ] | 200% browser zoom and mobile text enlargement preserve reflow and controls. | `[zoom captures]` |
| [ ] | Background/foreground, lock/unlock, and app switching cannot add time. | `[timing recording]` |
| [ ] | Back/forward navigation does not create duplicate completion writes or a trapped screen. | `[navigation recording]` |
| [ ] | Slow network affects shell/assets gracefully and cannot alter reducer timing after play begins. | `[throttle evidence]` |

**Block launch if:** a supported viewport cannot select every tile, the timer or target reveal is clipped, backgrounding grants time, or a primary mobile browser cannot finish all five rounds.

## 8. SVG rendering and visual clarity gate

### Primitive rendering

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Circle geometry renders as `[cx, cy, radius]`. | `[family screenshot/test]` |
| [ ] | Rectangle geometry renders as `[x, y, width, height, cornerRadius]`. | `[family screenshot/test]` |
| [ ] | Line geometry renders as `[x1, y1, x2, y2]`. | `[family screenshot/test]` |
| [ ] | Polygon geometry renders as ordered coordinate pairs. | `[family screenshot/test]` |
| [ ] | Rotation is centered on `(50, 50)` in the fixed view box. | `[rotation capture]` |
| [ ] | Semantic background, primary, accent, and none roles resolve correctly for all six palettes. | `[palette matrix]` |
| [ ] | No SVG accepts arbitrary markup or token-derived content. | `[code/security review]` |
| [ ] | Vector strokes remain legible and do not scale into clipping artifacts. | `[device captures]` |

### Perceptual QA matrix

For every family, inspect multiple seeds at every difficulty and applicable grid size.

| Status | Family | 4×4 | 5×5 | 6×6 | High contrast | Small mobile | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | Rings | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Stripes | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Arrows | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Corners | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Dots | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Diamonds | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Chevrons | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |
| [ ] | Orbit | `[result]` | `[result]` | `[result]` | `[result]` | `[result]` | `[link]` |

Record ambiguous, invisible, clipped, or overly obvious changes by family, mutation kind, difficulty, grid size, palette, viewport, and generation version. Store a sanitized reproduction fixture internally; never put a share token into public issue text.

**Block launch if:** a supported combination makes the structural target visually absent, multiple cells plausibly appear altered, a palette loses required contrast, or mutation disclosure relies on color alone.

## 9. Accessibility gate

### Keyboard and focus

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Every setup choice, prepare action, start action, tile, next action, share action, and replay action is keyboard operable. | `[keyboard recording]` |
| [ ] | Focus order follows the visible task order. | `[focus map]` |
| [ ] | Visible focus is not clipped by tile borders, overlays, or viewport edges. | `[screenshots]` |
| [ ] | Disabled result tiles are not presented as actionable. | `[accessibility-tree capture]` |
| [ ] | A transition never leaves focus on removed content without an understandable next location. | `[screen-reader/keyboard notes]` |
| [ ] | Repeated Enter/Space activation cannot duplicate reducer outcomes. | `[rapid-input recording/test]` |

### Names, structure, and status

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Each board has a meaningful “N by N pattern grid” group name. | `[accessibility-tree capture]` |
| [ ] | Every tile exposes one-based row and column in its accessible name. | `[accessibility-tree capture]` |
| [ ] | Decorative SVG is hidden while the button retains its accessible name. | `[tree inspection]` |
| [ ] | Timer urgency is available without relying only on color. | `[screen-reader/visual evidence]` |
| [ ] | Incorrect-selection status is concise and does not announce every 100 ms timer update. | `[screen-reader recording]` |
| [ ] | Found, timeout, setup failure, share outcome, and invalid challenge are announced appropriately. | `[screen-reader recording]` |
| [ ] | Heading order, landmarks, fieldset/legend, labels, links, and page titles are meaningful. | `[automated/manual audit]` |
| [ ] | Target reveal includes shape/border/text treatment, not color alone. | `[result screenshot]` |

### Visual, motion, and motor access

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Text and essential controls meet the selected WCAG AA contrast criteria. | `[contrast report]` |
| [ ] | Essential non-text boundaries meet applicable contrast criteria. | `[contrast report]` |
| [ ] | Touch targets meet the approved minimum and have adequate separation. | `[measurement captures]` |
| [ ] | Reduced-motion preference removes non-essential animation while preserving state meaning. | `[recording]` |
| [ ] | Forced-colors/high-contrast mode preserves board boundaries, focus, misses, and target reveal. | `[screenshots]` |
| [ ] | The game remains understandable without sound or haptics. | `[manual check]` |
| [ ] | No flashing or animation exceeds the accepted safety threshold. | `[motion audit]` |

### Representative assistive-technology matrix

| Status | Technology | Browser/device | Complete five rounds | Evidence |
| --- | --- | --- | --- | --- |
| [ ] | VoiceOver | Safari on iOS | `[pass/fail]` | `[recording/notes]` |
| [ ] | VoiceOver | Safari on macOS | `[pass/fail]` | `[recording/notes]` |
| [ ] | NVDA or approved equivalent | Chrome/Firefox on Windows | `[pass/fail]` | `[recording/notes]` |
| [ ] | Keyboard-only | Two desktop browsers | `[pass/fail]` | `[recording/notes]` |

The visual task may not be independently solvable by every blind player. Public accessibility copy must be honest about the game’s visual nature while ensuring navigation, state, rules, results, and recovery are accessible. Do not claim universal equivalence without a tested alternative interaction.

**Block launch if:** keyboard operation cannot finish; focus disappears; status floods assistive technology; critical controls lack names; or a high-severity accessibility defect has no accepted mitigation and owner.

## 10. PWA, offline, and update behavior

The current service worker pre-caches the offline route and icon, and falls back only for failed navigation. It does not prove fully offline gameplay.

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Manifest returns the correct name, short name, start URL, display mode, colors, and icons. | `[manifest capture/validator]` |
| [ ] | Icons render at required install sizes without copied or stale branding. | `[install screenshots]` |
| [ ] | Service-worker registration succeeds only in the intended production context. | `[browser application capture]` |
| [ ] | `CACHE_NAME` version and cache cleanup work after an update. | `[update recording]` |
| [ ] | Failed navigation returns the intended offline page. | `[offline recording]` |
| [ ] | Offline page does not claim all game routes or boards are cached. | `[copy screenshot]` |
| [ ] | A service-worker failure leaves online navigation usable. | `[fault-injection evidence]` |
| [ ] | A new deployment does not trap clients on incompatible generator/UI assets. | `[two-version update test]` |
| [ ] | Rollback and cache behavior restore a known-good build. | `[rollback recording]` |
| [ ] | Installability is checked in representative supporting browsers. | `[installability report]` |

**Block launch if:** the service worker breaks normal navigation, stale assets create descriptor/UI incompatibility, rollback cannot reach affected clients, or offline claims exceed actual behavior.

## 11. Performance and production behavior

| Status | Required check | Target/decision | Evidence |
| --- | --- | --- | --- |
| [ ] | Home LCP | Good Core Web Vitals target under representative mobile conditions | `[Lighthouse/field capture]` |
| [ ] | Editorial-page LCP | Good target with optional systems off | `[capture]` |
| [ ] | Play INP | Tile response remains immediate during timer updates | `[trace]` |
| [ ] | CLS | No visible board/control movement during fonts, consent, or reserved content | `[trace]` |
| [ ] | Timer work | 100 ms UI updates do not become authority or create long tasks | `[performance trace/code review]` |
| [ ] | Client bundle | No unexpected AI, backend, advertising, analytics, or state-library bundle | `[bundle report]` |
| [ ] | SVG rendering | 6×6 board remains responsive on representative low/mid device | `[device trace]` |
| [ ] | Optional system isolation | Analytics/CMP/ad failure cannot delay or break play | `[fault-injection evidence]` |
| [ ] | Fonts/assets | Stable fallback and no critical missing asset | `[network/filmstrip]` |
| [ ] | Route status | Home, play, challenge, content, manifest, robots, sitemap, `ads.txt`, offline, and 404 return intended status/content type | `[curl/browser matrix]` |

Record field Core Web Vitals once enough real traffic exists. Do not chase a synthetic score by weakening accessibility or product correctness.

**Block launch if:** tile interaction stalls, optional code enters the play critical path, controls shift under a pointer, or production has a severe unexplained regression.

## 12. Security and privacy gate

### Data minimization

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Core play requires no account, player name, email, phone, contact access, camera, microphone, or upload. | `[permission/network audit]` |
| [ ] | Local storage contains only versioned aggregate statistics and completed UTC dates. | `[storage capture]` |
| [ ] | Corrupt, blocked, quota-limited, or unavailable storage fails safely. | `[fault-injection evidence]` |
| [ ] | Challenge data contains no user identity or score. | `[schema inspection]` |
| [ ] | Share APIs run only after explicit user action. | `[code/browser review]` |
| [ ] | Clipboard failure exposes a selectable URL without an exception. | `[fault-injection evidence]` |
| [ ] | Hosting/security log behavior and retention are documented for the real provider. | `[provider/configuration record]` |

### Untrusted input and output

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Dynamic route input is length-, character-, segment-, checksum-, UTF-8-, JSON-, exact-key-, type-, and seed-validated. | `[test/code review]` |
| [ ] | Token-derived strings are never inserted as HTML. | `[code review]` |
| [ ] | Error output is sanitized and excludes untrusted values. | `[fault capture]` |
| [ ] | External sharing cancellation is distinguished from failure. | `[browser matrix]` |
| [ ] | Generated SVG descriptors cannot execute script, load a remote URL, or inject markup. | `[security review]` |
| [ ] | Environment values are validated and public-prefixed values are treated as public. | `[configuration review]` |

### Web security posture

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | HTTPS is enforced and canonical redirects do not loop. | `[header/curl evidence]` |
| [ ] | Security headers and CSP are reviewed against actual Next.js, sharing, future CMP, and future ad requirements. | `[header report]` |
| [ ] | No secret is included in client bundles, public environment values, source maps, or repository. | `[secret/build scan]` |
| [ ] | Dependency advisories and lockfile integrity are reviewed. | `[audit record]` |
| [ ] | Contact/security reporting route is monitored. | `[mailbox test]` |
| [ ] | Incident response names owner, backup, severity, evidence handling, and notification process. | `[runbook]` |

**Block launch if:** token data leaks; untrusted input reaches executable output; a secret is exposed; storage failure blocks play; or a critical/high security issue remains unresolved.

## 13. Operator, legal, and audience gate

| Status | Required check | Owner | Evidence |
| --- | --- | --- | --- |
| [ ] | The legal operator is named accurately on required public pages. | Operator/legal | `[page capture/record]` |
| [ ] | A monitored contact address replaces temporary values. | Operator | `[mailbox test]` |
| [ ] | Domain ownership and renewal access are held by the operator with recovery controls. | Operator | `[registrar record]` |
| [ ] | Working title/domain review is complete to the appropriate standard. | Operator/legal | `[clearance record]` |
| [ ] | Privacy notice matches actual hosting, local storage, challenges, analytics status, ads status, retention, rights, and contacts. | Privacy/legal | `[dated review]` |
| [ ] | Terms identify the operator, governing framework, eligibility, acceptable use, third parties, ownership, and lawful limitations. | Legal | `[dated review]` |
| [ ] | No placeholder jurisdiction, provider, retention, owner, or contact text remains. | Legal/product | `[placeholder audit]` |
| [ ] | General-audience positioning is documented and child-directed risk is reviewed for actual markets. | Privacy/legal | `[audience assessment]` |
| [ ] | Visual gameplay is described as entertainment, not medical, diagnostic, educational, employment, or prize evidence. | Product/legal | `[copy audit]` |
| [ ] | Accessibility limitations and support path are stated honestly. | Accessibility/legal | `[public copy review]` |
| [ ] | Creator/community disclosures and applicable endorsement rules are documented before outreach. | Marketing/legal | `[campaign template]` |

**Block public launch if:** operator identity/contact is unresolved; legal pages are templates; branding is knowingly conflicted; audience posture is unknown; or public claims exceed evidence.

## 14. Analytics activation gate — conditional

Public launch may proceed with analytics off. Do not enable measurement until all rows pass.

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | A vendor, production property, accountable owner, and backup are named. | `[property/access record]` |
| [ ] | A data map includes vendor-added fields, custom events, cookies/storage, IP handling, transfers, and retention. | `[approved data map]` |
| [ ] | The implemented event dictionary matches the approved dictionary in `docs/GROWTH_ADSENSE.md`. | `[schema/code review]` |
| [ ] | Events exclude seed, token, token ID, checksum, full URL, puzzle ID, session ID, phase token, target/selected coordinates, vector geometry, free text, and PII. | `[automated/network inspection]` |
| [ ] | Exact elapsed values and wrong-cell positions are replaced by approved buckets. | `[payload captures]` |
| [ ] | Tokenized routes are normalized before the vendor sees a path. | `[network/vendor capture]` |
| [ ] | Preview, local, automation, and operator traffic are separated or excluded. | `[configuration test]` |
| [ ] | Privacy notice names actual vendor, fields, purpose, retention, choices, and rights. | `[public page capture]` |
| [ ] | Applicable consent/opt-out logic defaults closed. | `[network matrix]` |
| [ ] | Accept, reject, no-action, partial, withdrawal, reset, expiry, returning, and unknown-region cases are tested. | `[consent matrix]` |
| [ ] | Rejecting or withdrawing leaves all five rounds playable and stops later non-essential requests. | `[recording/network capture]` |
| [ ] | Event duplication is tested across rerender, back/forward, repeated actions, and completion writes. | `[test/vendor debug record]` |
| [ ] | The analytics kill switch is exercised on a production-shaped deployment by a second operator. | `[drill evidence]` |

### Analytics decision

| Field | Value | Evidence |
| --- | --- | --- |
| Decision | `[GO / NO-GO]` | `[decision record]` |
| Date UTC | `[date]` | `[record]` |
| Approver | `[name/role]` | `[record]` |
| Vendor/property | `[value or N/A]` | `[access record]` |
| Kill-switch owner | `[name/role]` | `[drill]` |

**Block analytics, not the ad-free site, if:** any row is incomplete, an excluded field appears once, consent fails, or collection cannot be stopped independently.

## 15. Advertising and AdSense activation gate — conditional

The MVP advertising rule is absolute:

> No ads or ad requests during `setup`, `ready`, `playing`, `round_result`, `session_result`, or any valid/invalid `challenge` flow. `/play` and `/challenge/[token]` are fully ineligible. Only explicitly reviewed substantial editorial non-game pages may be allowlisted after approval.

### Account and site readiness

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Account owner is at least 18 and payee, identity, address, tax, payment, and recovery information is accurate. | `[account record]` |
| [ ] | Operator controls the canonical domain and source. | `[domain/source record]` |
| [ ] | Site already has original, substantial content and a real audience without ads. | `[content inventory/traffic record]` |
| [ ] | Current AdSense eligibility, Publisher Policies, placement, invalid-traffic, privacy, consent, and account instructions were reviewed and dated. | `[policy review]` |
| [ ] | AdSense reports the production site ready/approved. | `[account screenshot/reference]` |
| [ ] | Policy Center/account messages have a monitored owner and response SLA. | `[operations record]` |

### Consent and privacy

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Actual launch markets and applicable privacy rules are reviewed. | `[legal/privacy review]` |
| [ ] | A suitable Google-certified CMP integrated with the applicable TCF is configured where required for the EEA, UK, and Switzerland. | `[CMP certification/config record]` |
| [ ] | Vendor and purpose selections match the real ad configuration. | `[CMP/account comparison]` |
| [ ] | Personalized, non-personalized, limited, rejection, partial, withdrawal, returning, and failure behavior are reviewed. | `[regional network matrix]` |
| [ ] | Public privacy/cookie disclosure identifies actual vendors, cookies/identifiers, purposes, retention, choices, and rights. | `[page/review record]` |
| [ ] | A persistent choice-revisit control exists where required. | `[browser capture]` |
| [ ] | Core play works when advertising/CMP is unavailable or not permitted. | `[fault-injection recording]` |

### Production configuration and `ads.txt`

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | `NEXT_PUBLIC_ADS_ENABLED` is `false` by default in local, preview, and production configuration. | `[environment inventory]` |
| [ ] | Exact approved `pub-…` value is stored only in intended production configuration. | `[redacted configuration record]` |
| [ ] | No sample, guessed, malformed, or `ca-pub-…` value can generate the seller row. | `[route/config test]` |
| [ ] | Canonical `/ads.txt` returns HTTP 200, plain text, and the exact account-provided row. | `[curl/account comparison]` |
| [ ] | Apex/`www`, cache, robots, firewall, and crawler behavior allow the stable file. | `[curl/header evidence]` |
| [ ] | The current account-directed site connection method is used without modifying its identifier. | `[account/source comparison]` |
| [ ] | Localhost, preview, tests, and screenshot tools issue zero ad-network requests. | `[network captures]` |
| [ ] | Ad requests wait for both allowed route and approved consent state. | `[network matrix]` |

### Route and placement allowlist

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Allowlist contains only individually reviewed substantial editorial non-game URLs. | `[allowlist/review records]` |
| [ ] | Home, pattern library, legal, contact, offline, error, 404, play, and challenge routes are denied for MVP. | `[route tests/network matrix]` |
| [ ] | All six state surfaces named above issue zero ad requests. | `[state-by-state network captures]` |
| [ ] | Each allowed page has distinct intent, human authorship, original assets, review date, and useful content before/after an empty slot. | `[editorial records]` |
| [ ] | First rollout uses at most one reserved inline slot on one allowed page. | `[screenshot/source]` |
| [ ] | Slot is clearly labeled, visually distinct, and does not mimic the game or article controls. | `[screenshots]` |
| [ ] | Slot reserves dimensions and creates no harmful CLS. | `[trace]` |
| [ ] | Slot is at least 150 CSS pixels from every control and farther where touch/viewport behavior warrants it. | `[measurement captures]` |
| [ ] | Auto ads, anchor, vignette, overlay, sticky, and interstitial formats are off. | `[account/source settings]` |
| [ ] | QA uses network/visual inspection and never clicks a live ad. | `[QA procedure/signoff]` |

### Invalid-traffic controls

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | No copy encourages ad views/clicks or connects them to supporting the site. | `[copy audit]` |
| [ ] | No paid, exchanged, incentivized, automated, pop-under, redirect, or opaque traffic source is active. | `[campaign inventory]` |
| [ ] | Source, geography, page, request-volume, and anomaly monitoring is available. | `[dashboard/alert evidence]` |
| [ ] | Operator, contractor, creator, friend, and tester instructions explicitly forbid live-ad interaction. | `[written procedure]` |
| [ ] | Suspicious-traffic runbook begins by disabling ads and stopping the source. | `[runbook/drill]` |
| [ ] | Ad kill switch is exercised by a second operator and verified in network captures. | `[drill evidence]` |

### Advertising decision

| Field | Value | Evidence |
| --- | --- | --- |
| Decision | `[GO / NO-GO]` | `[decision record]` |
| Date UTC | `[date]` | `[record]` |
| Account/site status | `[approved/not approved]` | `[account reference]` |
| CMP and privacy approval | `[approved/not approved]` | `[review record]` |
| Initial allowed URL | `[exact URL or none]` | `[placement record]` |
| Kill-switch owner | `[name/role]` | `[drill]` |

**Block advertising, not the ad-free site, if:** approval is absent; operator/privacy/CMP fields are incomplete; traffic provenance is unclear; any ineligible route requests an ad; a slot approaches interaction; or the kill switch is unproven.

## 16. Editorial, SEO, and discovery gate

### Indexable page quality

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Every indexable page solves one distinct reader problem. | `[content map]` |
| [ ] | Every indexable resource is substantially human-authored and editor-reviewed. | `[editorial record]` |
| [ ] | Original SVG examples, diagrams, experiments, or checklists support the writing. | `[asset inventory]` |
| [ ] | Medical, cognitive, educational-performance, and universal-accessibility claims are absent unless properly evidenced and reviewed. | `[claim audit]` |
| [ ] | Author/responsible editor, review date, sources, and update owner are recorded. | `[page record]` |
| [ ] | No page is generated solely from date, seed, token, score, target, palette, family, grid size, or other permutation. | `[route/content audit]` |
| [ ] | No copied, scraped, spun, doorway, or near-duplicate content is published. | `[originality review]` |
| [ ] | The article remains useful with game, analytics, consent, and ads unavailable. | `[no-script/manual review]` |

### Technical search checks

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | One HTTPS canonical host is selected and redirects are consistent. | `[curl/head capture]` |
| [ ] | Titles, descriptions, headings, and canonicals are unique and accurate. | `[crawl report]` |
| [ ] | `robots.txt` references the production sitemap and does not expose a preview origin. | `[live capture]` |
| [ ] | `sitemap.xml` contains only canonical, index-worthy, HTTP-200 URLs. | `[sitemap validation]` |
| [ ] | Challenge, offline, error, state-only, and preview URLs are excluded/noindexed as intended. | `[crawl/head report]` |
| [ ] | Open Graph images and text render accurately without token or personal data. | `[sharing-debugger captures]` |
| [ ] | Structured data, if present, matches visible content and current validation. | `[validator report or N/A]` |
| [ ] | Search Console ownership, sitemap submission, coverage, manual actions, security, and performance review have an owner. | `[property/access record]` |

### Marketing readiness

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Launch assets show the real production UI and supported claims. | `[asset set]` |
| [ ] | Short-form recordings are readable, captioned, and do not shame misses. | `[creative review]` |
| [ ] | Community rules allow the proposed post and builder affiliation is disclosed. | `[rule/link and draft]` |
| [ ] | Creator relationships include required disclosure and are not compensated by ad interaction. | `[agreement/template]` |
| [ ] | Directory/platform submissions prohibit fake votes, reviews, or coordinated engagement. | `[launch procedure]` |
| [ ] | Every channel has a primary measure, guardrail, attribution method, time box, and stop rule. | `[experiment records]` |
| [ ] | Purchased or third-party traffic provenance is fully known; otherwise it is not used. | `[campaign inventory]` |
| [ ] | Public copy makes no guarantee of traffic, ranking, revenue, virality, or puzzle performance. | `[claim audit]` |

**Block indexing/promotion if:** canonical signals conflict; preview/token URLs are exposed; content is thin/copied; launch depends on spam or fake engagement; or creative claims exceed the implemented product.

## 17. Vercel environment and deployment gate

### Environment inventory

| Status | Variable/configuration | Preview | Production | Evidence |
| --- | --- | --- | --- | --- |
| [ ] | `NEXT_PUBLIC_SITE_URL` | `[value]` | `[canonical origin]` | `[redacted inventory]` |
| [ ] | `NEXT_PUBLIC_CONTACT_EMAIL` | `[test/blank]` | `[monitored address]` | `[redacted inventory]` |
| [ ] | `NEXT_PUBLIC_ANALYTICS_ENABLED` | `false` unless separately approved | `false` unless Gate 14 passes | `[inventory]` |
| [ ] | `NEXT_PUBLIC_ADS_ENABLED` | `false` | `false` unless Gate 15 passes | `[inventory]` |
| [ ] | `ADSENSE_PUBLISHER_ID` | empty | empty unless Gate 15 passes | `[redacted inventory]` |
| [ ] | Node/pnpm/build settings | `[values]` | `[values]` | `[project settings]` |
| [ ] | Production branch/root directory | `[values]` | `[values]` | `[project settings]` |

### Preview promotion

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Preview deployment corresponds to the recorded candidate SHA. | `[deployment link]` |
| [ ] | Preview passed automated, browser, accessibility, PWA, security, privacy, and content gates. | `[gate record]` |
| [ ] | Preview is not indexed and exposes no production-only identifier. | `[head/network capture]` |
| [ ] | Production deployment promotes the reviewed artifact, not an unreviewed newer build. | `[deployment record]` |
| [ ] | Custom domain, HTTPS, redirects, headers, routes, manifest, robots, sitemap, and `ads.txt` are rechecked after promotion. | `[production smoke record]` |
| [ ] | Browser console, Vercel logs, and network show no new release error. | `[logs/captures]` |

### Rollback

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Known-good deployment and commit are recorded. | `[deployment link]` |
| [ ] | Release and backup owners can promote/rollback without the original implementer. | `[drill]` |
| [ ] | DNS/domain behavior during rollback is understood. | `[runbook]` |
| [ ] | Service-worker/cache behavior after rollback is tested. | `[recording]` |
| [ ] | Analytics and ads can be disabled independently of code rollback. | `[kill-switch drills]` |
| [ ] | Rollback triggers include broken start/completion, timer failure, challenge leak, critical accessibility/security/privacy issue, consent leak, unsafe placement, and suspicious traffic. | `[runbook]` |

**Block deployment if:** environments are mixed, the artifact cannot be identified, production-only values reach preview, rollback is untested, or only one person can recover the project.

## 18. Monitoring and incident readiness

### Before opening traffic

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Release owner, backup, monitoring window, and rollback authority are active. | `[on-call record]` |
| [ ] | Synthetic checks cover home, play entry, one editorial page, manifest, robots, sitemap, and offline route. | `[monitor configuration]` |
| [ ] | Error/log systems scrub tokenized paths and excluded data. | `[redaction test]` |
| [ ] | Baselines or manual checks exist for preparation, round-one start, completion, route errors, and Core Web Vitals. | `[dashboard/check sheet]` |
| [ ] | Support/status communication route is prepared. | `[template/contact test]` |
| [ ] | Product, security, privacy, accessibility, consent, advertising, and traffic-quality incidents have named owners. | `[ownership matrix]` |

### First two hours

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Full five-round production story rerun on mobile data. | `[recording]` |
| [ ] | Valid and invalid challenge stories rerun from a separate clean client. | `[recording]` |
| [ ] | UTC Daily preparation checked against current UTC date. | `[capture]` |
| [ ] | Domain, canonical, manifest, service worker, share preview, 404, offline, and contact checked. | `[smoke sheet]` |
| [ ] | Browser console, network, Vercel logs, and deployment health inspected. | `[captures]` |
| [ ] | No unexpected analytics or ad request detected. | `[network capture]` |
| [ ] | Acquisition source and error anomalies reviewed. | `[dashboard/check]` |

### First 48 hours

| Status | Required check | Evidence |
| --- | --- | --- |
| [ ] | Preparation, activation, five-round completion, and challenge validity reviewed daily. | `[metrics/check record]` |
| [ ] | Family/grid ambiguity, clipping, accessibility, and support reports triaged. | `[issue review]` |
| [ ] | Traffic source/geography shifts reviewed for quality. | `[source report]` |
| [ ] | Search indexing and share previews checked without repeated forced submission. | `[Search Console/capture]` |
| [ ] | Any critical issue triggered the documented kill switch or rollback. | `[incident record or none]` |
| [ ] | Decisions, configuration changes, and mitigations were logged. | `[decision log]` |

### Incident quick actions

| Incident | First action | Owner | Evidence record |
| --- | --- | --- | --- |
| Timer/state integrity | Pause promotion and rollback if confirmed | Release owner | `[incident ID]` |
| Token/seed exposure | Stop affected telemetry/logging and contain access | Security/privacy | `[incident ID]` |
| Critical accessibility failure | Pause promotion; provide mitigation/rollback | Accessibility/release | `[incident ID]` |
| Consent leakage | Disable analytics and ads | Privacy/operator | `[incident ID]` |
| Unsafe ad placement | Disable ads immediately | Advertising owner | `[incident ID]` |
| Suspicious traffic | Disable ads and stop the source | Traffic-quality owner | `[incident ID]` |
| Stale PWA assets | Roll back and execute cache/update runbook | Engineering | `[incident ID]` |
| Wrong operator/legal identity | Remove or pause public release | Operator/legal | `[incident ID]` |

## 19. Explicit go/no-go decisions

### A. Public ad-free, analytics-free launch

Required: Sections 1–13 and 16–18 pass. Sections 14 and 15 may remain NO-GO with their systems disabled.

| Field | Value | Evidence |
| --- | --- | --- |
| Decision | `[GO / NO-GO]` | `[signed decision]` |
| Date/time UTC | `[value]` | `[record]` |
| Release owner | `[name]` | `[signature/approval]` |
| QA owner | `[name]` | `[signature/approval]` |
| Accessibility owner | `[name]` | `[signature/approval]` |
| Privacy/legal owner | `[name]` | `[signature/approval]` |
| Open accepted risks | `[none or linked list]` | `[risk approvals]` |
| Analytics state | `disabled` | `[network/config evidence]` |
| Advertising state | `disabled` | `[network/config evidence]` |
| Rollback target | `[deployment]` | `[link]` |

### B. Analytics activation

Required: Section 14 passes independently after or alongside public launch.

| Field | Value | Evidence |
| --- | --- | --- |
| Decision | `[GO / NO-GO]` | `[signed decision]` |
| Vendor/property | `[value]` | `[access/config record]` |
| Consent/privacy approval | `[value]` | `[review]` |
| Payload verification | `[pass/fail]` | `[network captures]` |
| Kill-switch verification | `[pass/fail]` | `[drill]` |

### C. AdSense activation

Required: Section 15 passes independently. Approval alone is insufficient.

| Field | Value | Evidence |
| --- | --- | --- |
| Decision | `[GO / NO-GO]` | `[signed decision]` |
| Site/account status | `[value]` | `[account record]` |
| CMP/privacy status | `[value]` | `[review/network matrix]` |
| Exact initial editorial URL | `[URL or none]` | `[allowlist record]` |
| Placement review | `[pass/fail]` | `[screenshots/measurements]` |
| Ineligible-route zero-request proof | `[pass/fail]` | `[network matrix]` |
| Invalid-traffic controls | `[pass/fail]` | `[campaign/runbook record]` |
| Kill-switch verification | `[pass/fail]` | `[drill]` |

## 20. Final handoff

| Field | Value | Evidence |
| --- | --- | --- |
| Exact release | `[commit/deployment]` | `[links]` |
| Checks run and results | `[summary]` | `[logs]` |
| Browsers/devices completed | `[matrix summary]` | `[matrix]` |
| Known defects | `[list]` | `[issue links]` |
| Accepted risks and approvers | `[list]` | `[risk records]` |
| Deferred analytics work | `[list/N/A]` | `[backlog]` |
| Deferred advertising work | `[list/N/A]` | `[backlog]` |
| Monitoring owners/window | `[value]` | `[on-call record]` |
| Rollback procedure/target | `[value]` | `[runbook/deployment]` |
| Next review date | `[date]` | `[calendar]` |

Release owner acknowledgement: `[name / date / signature]`
QA acknowledgement: `[name / date / signature]`
Accessibility acknowledgement: `[name / date / signature]`
Privacy/legal acknowledgement: `[name / date / signature]`
Advertising acknowledgement, only when applicable: `[name / date / signature]`

The release is complete only when the appropriate decision is GO, its evidence is retained, and optional systems remain disabled unless their separate activation decision also passes.
