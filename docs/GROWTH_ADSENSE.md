# One Pixel Off — Responsible Growth, SEO, Analytics, and AdSense Plan

> Status: operating plan for the web/PWA MVP
> Implementation reviewed: July 15, 2026
> Publisher-policy links reviewed: July 15, 2026
> Brand status: working title until domain and trademark checks are complete
> Monetization status: disabled; approval, consent, operator, and placement gates remain open

This plan explains how to grow One Pixel Off without paid puzzle-generation services, deceptive distribution, thin search pages, intrusive tracking, or ads around play. It is not a promise of traffic, virality, AdSense approval, or revenue. Every forecast is a hypothesis until production evidence exists, and every policy gate must be checked again immediately before advertising is enabled.

## 1. Implemented product truth

Growth claims must match the shipped behavior. The current product is a browser-based visual puzzle built from deterministic TypeScript descriptors and SVG rendering.

| Contract | Implemented behavior |
| --- | --- |
| Session length | Exactly five rounds |
| Board dimensions | Square 4×4, 5×5, or 6×6 grids |
| Puzzle rule | Exactly one target tile differs by exactly one scalar mutation |
| Geometry | Integer-only vector geometry in a fixed 100×100 view box |
| Pattern families | Rings, stripes, arrows, corners, dots, diamonds, chevrons, and orbit |
| Visual palettes | Six curated semantic-color palettes |
| Difficulty curve | Beginner, steady, tricky, tricky, expert |
| Round time | 15,000 ms, enforced from an absolute reducer deadline |
| Correct selection | Resolves the round as found and awards a bounded score |
| Incorrect selection | Records the unique tile, applies a score penalty, and keeps the round active |
| Timeout | Resolves at the exact logical deadline, even when a callback arrives late |
| Quick mode | A fresh opaque seed creates a deterministic five-board session locally |
| Daily mode | A UTC calendar date creates the same versioned session for compliant clients |
| Challenge mode | A strict versioned token carries only an opaque seed and integrity checksum |
| Accounts and uploads | Neither is required |
| Image generation | No image-generation service or request-time model call |
| Local persistence | Aggregate completion statistics and completed UTC dates only |

The site must not claim that every conceivable board is perceptually perfect. Procedural invariants guarantee structural uniqueness; visual clarity still requires human QA across devices, sizes, contrast modes, and pattern families.

## 2. Strategy in one sentence

Earn repeat visits by making the daily board set worth returning for, earn direct acquisition by making fair friend challenges effortless, and earn search visibility through a small library of genuinely useful authored visual-puzzle resources.

The sequence matters:

1. Make the five-round experience reliable and accessible.
2. Establish daily return and friend-recipient loops.
3. Publish original resources that stand on their own without the game.
4. Measure only what is needed and only after the privacy gate passes.
5. Apply for AdSense only after the public site has an audience and substantial content.
6. If approved, serve ads only on explicitly approved editorial reading pages.

## 3. Non-negotiable growth and monetization guardrails

- Never promise easy money, guaranteed traffic, guaranteed rankings, guaranteed approval, or guaranteed virality.
- Never buy bulk visitors, use traffic exchanges, hire click services, run pop-under distribution, or accept opaque traffic sources.
- Never ask anyone to view or click ads to support the project.
- Never click live ads during development, QA, demonstrations, or operator review.
- Never manufacture hundreds of near-duplicate pages from grid size, color, date, seed, difficulty, or family combinations.
- Never index tokenized challenge URLs or expose their full paths to analytics, logs, screenshots, or support tools.
- Never send a puzzle seed, challenge token, session ID, full URL, IP address, contact detail, free-form text, or other personal data as an analytics event property.
- Never make play conditional on analytics consent, advertising consent, local storage, sharing support, or an account.
- Never place ads on setup, ready, playing, round-result, session-result, challenge, error, offline, navigation-only, or other behavioral screens.
- Never place an ad near a tile, timer, start control, next control, replay control, share control, mode selector, or navigation control.
- Keep Auto ads, anchors, vignettes, overlays, and interstitial formats off for the MVP.
- Make advertising and analytics independently removable through tested production kill switches.

## 4. Audience and positioning

### Primary audiences

1. **Short-session puzzle players** who want a complete challenge in two to three minutes without an account.
2. **Friends and group chats** that exchange lightweight competitive links.
3. **Daily-routine players** who prefer one globally consistent board set each day.
4. **Visual-design and frontend enthusiasts** interested in deterministic geometry and SVG systems.
5. **People seeking a low-commitment screen break** without claims of clinical, educational, or cognitive benefit.

The product is intended for a general audience. Family-friendly presentation must not drift into child-directed positioning without a separate privacy, advertising, content, and audience review.

### Jobs to be done

- “Give me a satisfying visual test I can finish immediately.”
- “Give my friend the exact same boards so our scores are comparable for fun.”
- “Give me one small reason to return tomorrow.”
- “Explain how deterministic procedural visual puzzles work without using an AI image service.”
- “Let me play without creating an identity or uploading anything.”

### Positioning statement

For people who enjoy fast visual challenges, One Pixel Off is a five-round anomaly hunt made from deterministic vector geometry. Each board contains one structurally verified change, runs locally, and can be replayed from the same opaque seed—without an account, uploaded image, or image-generation bill.

### Message hierarchy

1. One detail is different; find it before 15 seconds expire.
2. Five rounds create a complete session rather than an endless feed.
3. Quick sessions are fresh, Daily is UTC-consistent, and friend challenges are reproducible.
4. Boards are assembled from code and SVG, not fetched from an image service.
5. Core play needs no account or upload.

### Claims that require evidence or must remain excluded

- Do not call the game a medical eyesight test.
- Do not claim it improves intelligence, attention, memory, visual acuity, or neurological health.
- Do not call a seed cryptographically secret; the token checksum detects corruption but is not an authentication signature.
- Do not describe scores as tamper-proof, globally ranked, or professionally meaningful.
- Do not say the game works fully offline until the service worker actually caches all required play resources; today it provides a navigation fallback only.
- Do not claim universal accessibility until representative assistive-technology testing is complete.
- Do not advertise “infinite unique boards” as a mathematical guarantee. Prefer “fresh deterministic combinations” or “many reproducible boards.”

## 5. Growth model

The product has three distinct acquisition loops. They must be measured separately because they solve different problems.

### Loop A — Daily return

```text
first session → discover Daily → play UTC set → remember/return tomorrow → compare personal history
```

Daily succeeds when players return voluntarily, not when notifications or dark patterns manufacture opens. The MVP stores completed UTC dates locally; it does not provide a server-authoritative streak or prevent storage resets.

### Loop B — Friend challenge

```text
complete five rounds → create tokenized link → friend opens valid route → friend completes same seed → friend starts another challenge
```

The challenge loop is the strongest direct-distribution mechanism because the sender gives the recipient an immediate reason to play. Share copy may mention the sender’s score, but the token itself contains no score or identity.

### Loop C — Useful discovery content

```text
specific visual-puzzle question → substantial authored guide → relevant playable example → optional five-round session → later direct return
```

Search traffic is valuable only if visitors understand the page, get a useful answer, and choose to play. Raw impressions or ad pageviews are not success by themselves.

### North-star behavior

**Completed five-round sessions per returning player.**

This keeps the team focused on a complete, repeatable experience. It does not reward inflating pageviews, forcing extra navigation, or placing ads between states.

## 6. Funnel and retention model

### Core product funnel

| Stage | Definition | Denominator | Primary diagnostic |
| --- | --- | --- | --- |
| Eligible landing | A real human reaches an approved landing surface | Valid eligible visits | Traffic source and device class |
| Setup viewed | The mode setup is rendered without a blocking error | Eligible landings entering play | Landing-to-play intent |
| Session prepared | Five boards are constructed and initial state validates | Setup views with prepare action | Generator/session failure rate |
| Round one started | The first board becomes active | Prepared sessions | Readiness friction |
| Round one resolved | Found or timed out | Round-one starts | Immediate comprehension |
| Session completed | All five outcomes exist and report is shown | Round-one starts | Core completion |
| Challenge shared | A share or copy flow succeeds | Completed sessions | Sender intent |
| Challenge recipient started | A valid recipient begins round one | Valid challenge opens | Recipient activation |
| Next-day return | Same privacy-safe cohort returns on a later UTC day | First-time players eligible for comparison | Retention |
| Daily repeat | A player completes Daily on two or more distinct UTC dates | Daily completers | Habit strength |

### Required formulas

- Preparation success = prepared sessions ÷ prepare actions.
- Round-one activation = round-one starts ÷ prepared sessions.
- Session completion = completed sessions ÷ round-one starts.
- Share initiation = share starts ÷ completed sessions.
- Share success = successful share/copy outcomes ÷ share starts.
- Recipient activation = recipient round-one starts ÷ valid challenge opens.
- Challenge completion = recipient completed sessions ÷ recipient round-one starts.
- Daily next-day retention = next-UTC-day Daily players ÷ eligible prior-day Daily players.
- Seven-day return = players observed on a later day within seven days ÷ eligible first-day players, only when the approved measurement design can calculate it without an unnecessary persistent identifier.

If privacy review rejects cross-day user linkage, use aggregate daily completion trends and local-only streak statistics instead of forcing an identifier into analytics.

### Baseline policy

Do not invent conversion targets before launch. Collect enough consented, valid traffic for a stable baseline, record the sample and interval, then set an improvement hypothesis. Small samples must be reported with counts and uncertainty, not only percentages.

## 7. Daily mode growth plan

### Product contract

- The day is the UTC calendar day, not the device’s local date label.
- The seed includes the generation version and UTC date.
- Every compliant client on the same version receives the same five boards.
- Local storage records completed UTC dates but does not establish global authority.
- A release that changes generation behavior can change board identity; generation-version changes must be intentional and documented.

### Daily discovery surfaces

- Home page link: “Today’s UTC scan.”
- Session report action: “Daily scan.”
- How-it-works explanation that clearly states the UTC reset rule.
- Optional future non-indexed Daily landing route with reset time and local completion state.

### Daily return experiments

| Experiment | Hypothesis | Measure | Guardrail | Stop condition |
| --- | --- | --- | --- | --- |
| Report-page Daily action | A clear next-day proposition increases Daily starts | Daily starts per completed Quick session | No notification permission request | No measurable lift after a predefined sample |
| UTC reset copy | Explicit reset timing reduces confusion | Setup exits and support issues | Copy remains short | Confusion or wrong-date reports rise |
| Local completion marker | A simple “completed today” state encourages return | Distinct completed UTC dates per local profile | No shame or loss language | Users misread it as a global record |
| Shareable non-spoiler result | A compact found/timeout pattern increases organic shares | Share starts and recipient opens | No board, seed, or target disclosure | Recipient activation falls or spoilers appear |

No daily archive should be generated solely for indexing. Historical pages require unique authored value beyond a date and generated board.

## 8. Challenge growth plan

### Token and privacy contract

- Maximum token length is 256 characters.
- The current format contains a schema version, generation version, opaque seed, and checksum.
- It does not contain a player name, email, account ID, score, device ID, contact, or board image.
- The checksum detects corruption and casual editing; it is not a signature or proof of authorship.
- Challenge pages are `noindex, nofollow` and must never enter the sitemap.
- Logs and analytics normalize the route to `/challenge/[token]` before storage or reporting.

### Sender experience

1. Finish all five rounds.
2. See an honest local score and found count.
3. Select “Challenge a friend.”
4. Use Web Share when available.
5. Fall back to clipboard.
6. Fall back to a selectable URL when clipboard access fails.

### Recipient experience

1. Open the link without an account.
2. See that the five boards are locked to the sender’s seed.
3. Start on an explicit action; do not begin the clock on page load.
4. Complete the same deterministic board descriptors.
5. Receive a normal report and a chance to issue a new challenge.

### Failure behavior

- Invalid, oversized, corrupted, unsupported, or malformed tokens show a concise recovery message.
- The error surface offers a fresh session without partially trusting the token.
- Full tokens never appear in client error telemetry, analytics events, support captures, or screenshots.
- An invalid route must not create an advertising opportunity.

### Challenge experiments

| Experiment | Hypothesis | Primary measure | Secondary measure | Guardrail |
| --- | --- | --- | --- | --- |
| Score-led share copy | Friendly competition increases opens | Valid challenge opens per successful share | Recipient completion | No manipulative or humiliating language |
| Mystery-led share copy | Curiosity outperforms score emphasis | Valid opens per successful share | Round-one activation | No false scarcity |
| Report action order | Making challenge the first action increases sends | Share starts per completion | Quick replay rate | Replay remains easy to find |
| Recipient explanation length | Short integrity copy improves starts | Recipient round-one activation | Invalid exits | Token mechanics remain accurate |

Run one material variation at a time. Predefine the comparison window, minimum sample, primary measure, and stop rule. Do not repeatedly inspect a small sample and declare a winner.

## 9. Original content and SEO plan

Google’s [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) favors original material made for an audience, while AdSense eligibility expects high-quality, original content that attracts an audience. One Pixel Off must therefore build a compact editorial library with real authorship, examples, diagrams, and review—not programmatic filler.

### Search intent clusters

#### A. How visual anomaly puzzles work

- How to scan a grid systematically without losing your place.
- Alignment, spacing, size, stroke, and rotation differences explained with original SVG examples.
- Why larger grids feel harder even when only one value changes.
- How time pressure changes scanning strategy, presented as gameplay advice rather than health science.

#### B. Procedural vector design

- How deterministic seeds reproduce a visual board.
- SVG primitives used for browser puzzle generation.
- Why integer geometry improves reproducibility and testing.
- Structural uniqueness versus perceptual clarity.
- Designing safe mutation ranges for multiple grid densities.

#### C. Accessible visual puzzle design

- Designing a tile grid that does not rely on color alone.
- Keyboard access for spatial selection interfaces.
- Screen-reader labeling for visual boards.
- Reduced motion and urgent timer communication.
- Zoom, contrast, target size, and mobile reach considerations.

#### D. Fair friend challenges

- What makes two browser sessions reproducible.
- Why a checksum is not an anti-cheat signature.
- How to share a visual puzzle without embedding identity.
- Friendly comparison practices without global rankings.

### Initial cornerstone backlog

| Priority | Working article | Standalone value | Original asset required | Play connection |
| --- | --- | --- | --- | --- |
| 1 | A practical method for scanning visual grids | Teaches row, column, region, and symmetry passes | Original annotated SVG boards | Start a five-round scan |
| 2 | How One Pixel Off builds boards without image-generation calls | Explains the deterministic architecture | System diagram and code-native examples | Try the pattern families |
| 3 | Five geometric changes that make an outlier | Explains mutation types | Before/after vector examples | Play a mixed session |
| 4 | Designing an accessible spot-the-difference grid | Useful design guidance | Accessibility checklist and examples | Try keyboard operation |
| 5 | Deterministic seeds and reproducible browser games | Technical education | Seed-to-board flow diagram | Open a friend challenge |
| 6 | Why a 6×6 board feels different from a 4×4 board | Explains visual density honestly | Controlled comparison boards | Try the difficulty curve |

### Editorial acceptance gate

An indexable article must:

- solve one clear reader problem;
- contain substantial human-authored explanation;
- include an original diagram, example, experiment, checklist, or interactive demonstration;
- distinguish observed product behavior from general advice;
- cite authoritative sources for factual claims that need them;
- avoid medical, psychological, or educational-performance claims without qualified evidence and review;
- have an identified author or responsible editor;
- include a review date and update owner;
- avoid repeating another page’s intent;
- include internal links because they help the reader, not to force crawl paths;
- work without ads, scripts, or a game start;
- pass mobile, accessibility, spelling, metadata, and originality review;
- receive an explicit index/noindex decision.

### Prohibited scaled-content patterns

- One page per date, seed, token, score, target location, palette, or grid coordinate.
- Near-identical pages for “easy,” “medium,” “hard,” and every numeric variation.
- Auto-generated family pages containing only changed nouns and screenshots.
- Scraped puzzle collections or copied explanations.
- Empty leaderboard, result, login, status, or utility pages built to host ads.
- Search pages that merely embed the same playable board with a changed heading.
- AI-drafted pages published without material expert editing, original evidence, and ownership.

### Technical SEO rules

- Use one production HTTPS origin and one canonical host.
- Keep preview, localhost, tokenized, error, offline, and state-only routes out of the index.
- Include only canonical, substantive public pages in `sitemap.xml`.
- Keep `/challenge/[token]` explicitly `noindex, nofollow`.
- Give every indexable page a distinct title, description, heading, and purpose.
- Ensure server-rendered editorial content is readable without client interaction.
- Do not block required production assets or the operational `ads.txt` file.
- Validate Open Graph output without exposing a live token.
- Use structured data only when it accurately represents visible content and passes current Google validation.
- Monitor Search Console for indexing, query overlap, manual actions, security issues, and Core Web Vitals.

## 10. Launch-channel experiments

Distribution must be useful, transparent, and attributable. Every experiment has one owner, one primary measure, one guardrail, one time box, and one stop rule.

### Channel 1 — Short-form visual demonstrations

Create 8–15 second recordings showing a code-generated grid, a visible scan, the target reveal, and the “generated locally” distinction.

- Hypothesis: an immediately understandable board earns qualified visits.
- Asset: vertical recording with large readable grid and captions.
- Landing: canonical home or play route; never a token copied from a real person.
- Measure: completed sessions per landing visit, not video views alone.
- Guardrail: do not imply every viewer should be able to find the target or shame misses.
- Stop: pause a creative if it attracts high bounce, misleading comments, or unusable device traffic.

### Channel 2 — Visual-puzzle and frontend communities

- Participate only where self-promotion is allowed.
- Lead with a real technical or design contribution.
- Disclose that the poster built the product.
- Use one canonical link, not repeated replies or multiple accounts.
- Measure useful discussion, qualified starts, completions, and defect reports.
- Stop immediately if moderators object or the post attracts low-quality automated traffic.

### Channel 3 — Small creator tests

- Select creators whose audience already engages with visual puzzles, frontend craft, or design systems.
- Give each creator accurate product facts and freedom to state criticism.
- Disclose consideration according to the applicable rules and platform requirements.
- Never compensate based on ad clicks.
- Use campaign-level source codes that do not identify individual viewers.
- Compare recipient completion and later return, not raw link volume.

### Channel 4 — Search discovery

- Publish one cornerstone resource at a time.
- Confirm distinct intent before adding another page.
- Use Search Console queries to improve an existing resource before expanding.
- Do not purchase links, exchange links at scale, or manufacture guest posts.
- Evaluate traffic by article engagement and completed sessions.

### Channel 5 — Product directories and launch platforms

- Submit only after the production experience, legal identity, contact route, and rollback process are ready.
- Use accurate screenshots from the real build.
- State clearly that boards are deterministic SVG, not AI-generated images.
- Avoid coordinating artificial votes, reviews, or comments.
- Time-box operator monitoring during and after the listing.

### Experiment record template

```text
Experiment ID:
Owner:
Start and stop dates:
Audience and channel:
Hypothesis:
Single primary measure:
Guardrail measures:
Attribution method:
Minimum sample or observation window:
Stop rule:
Result with raw counts:
Decision: keep / revise / stop
Unexpected effects:
```

## 11. Privacy-preserving analytics plan

Analytics is optional and currently not implemented. The public product may launch with analytics disabled. No analytics tag may load until the operator, vendor, data map, consent behavior, retention, access, and deletion process are approved.

### Measurement principles

- Collect the minimum event data needed to make a named decision.
- Prefer low-cardinality enums and buckets.
- Do not collect raw board identity or reconstructable challenge material.
- Do not track every tile coordinate.
- Aggregate unique misses into a count or bucket at round resolution.
- Normalize tokenized paths before any telemetry pipeline sees them.
- Separate production, preview, automation, and operator traffic.
- Make rejection or withdrawal leave the full game usable.
- Document vendor-added fields, including IP handling and device identifiers, rather than reviewing only custom properties.

### Approved shared properties

Only properties in this table may be considered for the first implementation. Each still requires privacy and vendor review.

| Property | Allowed values | Purpose |
| --- | --- | --- |
| `mode` | `quick`, `daily`, `challenge` | Compare intended loops |
| `round_number` | `1`–`5` | Locate session drop-off |
| `difficulty` | `beginner`, `steady`, `tricky`, `expert` | Diagnose difficulty curve |
| `grid_size` | `4`, `5`, `6` | Diagnose density |
| `family_id` | Eight shipped family enums | Diagnose perceptual problems |
| `result` | `found`, `timeout` | Round outcome |
| `elapsed_bucket` | `0_3s`, `3_6s`, `6_10s`, `10_15s`, `timeout` | Timing analysis without exact timestamps |
| `wrong_tap_bucket` | `0`, `1`, `2`, `3_plus` | Difficulty analysis without coordinates |
| `found_count` | `0`–`5` | Session outcome |
| `score_bucket` | `0_249`, `250_499`, `500_749`, `750_999`, `1000_1250` | Coarse session comparison |
| `share_method` | `native`, `clipboard`, `manual` | Capability reliability |
| `share_outcome` | `completed`, `cancelled`, `failed` | Sharing reliability |
| `challenge_validity` | `valid`, `invalid`, `unsupported` | Link-health monitoring |
| `surface` | Approved low-cardinality route or state name | Error localization |
| `error_code` | Sanitized internal enum | Reliability diagnosis |
| `generation_version` | Current small integer | Release comparison |
| `viewport_class` | `small`, `medium`, `large` | Layout diagnosis |
| `source_group` | `direct`, `search`, `social`, `creator`, `directory`, `other` | Coarse acquisition quality |

### Event dictionary

| Event | Trigger | Required properties | Explicitly excluded | Deduplication rule |
| --- | --- | --- | --- | --- |
| `play_setup_viewed` | Setup renders successfully | `surface`, `viewport_class` | Query string, referrer URL | Once per rendered setup visit |
| `mode_selected` | Player changes Quick/Daily selection | `mode` | Device identity | Once per actual value change |
| `session_prepare_failed` | Generation or state initialization returns typed failure | `mode`, `error_code`, `generation_version` | Seed, exception text | Once per prepare action |
| `session_prepared` | Five valid boards enter ready state | `mode`, `generation_version` | Session ID, seed, board IDs | Once per in-memory session |
| `round_started` | Ready transitions to playing | `mode`, `round_number`, `difficulty`, `grid_size`, `family_id` | Start timestamp, tile values | Once per round transition |
| `round_resolved` | Playing transitions to found or timeout | Round properties plus `result`, `elapsed_bucket`, `wrong_tap_bucket` | Target index, selected indexes, exact elapsed time | Once per resolved round |
| `session_completed` | Fifth result advances to report | `mode`, `found_count`, `score_bucket`, `wrong_tap_bucket` | Session ID, exact completion time | Once per in-memory completion |
| `share_started` | Explicit share action begins | `mode` | URL, token, score text | Once per user action |
| `share_finished` | Native/copy/manual flow returns | `mode`, `share_method`, `share_outcome` | Destination contact/app identity, URL | Once per share action |
| `challenge_opened` | Token route validation completes | `challenge_validity`, `generation_version` when safe | Token, seed, checksum, full path | Once per route load |
| `challenge_recovery_selected` | Invalid challenge recovery is chosen | `challenge_validity` | Token and decoded content | Once per action |
| `client_error_presented` | Sanitized recoverable UI error appears | `surface`, `error_code` | Stack, URL, seed, token, storage content | Once per error presentation |

### Forbidden analytics fields

- Puzzle seed or any hash intended to identify it.
- Challenge token, checksum, token ID, or full challenge path.
- Puzzle ID, session ID, phase token, target index, selected cell index, or vector geometry.
- Name, email, phone number, contact list, account identifier, advertising identifier, or free-form feedback.
- Full IP address stored in custom event data.
- Precise location.
- Full referrer or destination URL.
- Clipboard contents or sharing recipient.
- Browser local-storage contents or completed-date list.
- Exact per-action timestamps when buckets answer the product question.
- User-agent strings copied into custom properties.

### Analytics activation gate

Before `NEXT_PUBLIC_ANALYTICS_ENABLED` can be set to `true`:

1. Name the vendor and production property owner.
2. Document every vendor-generated and custom field.
3. Approve purpose, legal basis, consent/opt-out behavior, retention, access, deletion, and data transfer posture.
4. Update the public privacy notice with actual behavior.
5. Implement a consent-aware loader that fails closed.
6. Test accept, reject, no-action, partial choice, withdrawal, reset, expiry, and unknown-region paths.
7. Capture production-like network evidence showing no prohibited field.
8. Verify the independent analytics kill switch.
9. Exclude preview, local, automated, and operator traffic.
10. Obtain owner and privacy sign-off.

## 12. Metrics, alerts, and kill switches

### Product health metrics

- Session preparation success.
- Round-one activation.
- Five-round completion.
- Timeout and unique-miss distribution by family, difficulty, grid size, and viewport class.
- Daily completions by UTC date.
- Challenge valid/invalid rate.
- Challenge recipient activation and completion.
- Client error rate.
- LCP, INP, and CLS on home, editorial, and play surfaces.
- Keyboard and assistive-technology defect reports.

### Growth-quality metrics

- Completed sessions per source group.
- Recipient completions per successful challenge share.
- Returning completions by daily cohort when privacy-safe.
- Editorial landing-to-play rate.
- Search queries and pages from Search Console.
- Support and confusion reports per meaningful visit.

### Advertising metrics, only after activation

- Ad-request eligibility rate by allowed route.
- Consent state coverage by region.
- Viewable impressions on allowed editorial pages.
- Page RPM as a business observation, never a reason to weaken placement safety.
- Invalid-traffic notices, serving limits, Policy Center issues, and unexplained source changes.
- Layout shift attributable to ad containers.
- Editorial exit and play-entry changes after ads are introduced.

Do not optimize CTR through placement movement, visual mimicry, or interaction proximity.

### Immediate product kill switches

Pause acquisition and consider rollback when any of these occur:

- session preparation failure exceeds 1% of legitimate attempts over 30 minutes with at least 100 attempts;
- a current release’s completion rate falls more than 20% relative to its comparable seven-day baseline with a meaningful sample;
- exact-deadline behavior or five-round completion is found incorrect;
- challenge decoding exposes a token or seed to logs or telemetry;
- a critical accessibility, privacy, security, or data-loss defect is confirmed;
- a pattern family produces a repeatedly ambiguous or clipped target on a supported device.

These thresholds are operational alarms, not proof of root cause. Human review decides rollback.

### Immediate analytics kill switches

Disable analytics when:

- any rejected or unconsented path sends a non-essential request;
- any forbidden property appears once;
- tokenized URLs reach the vendor;
- consent withdrawal does not stop subsequent collection;
- production and test traffic cannot be separated;
- vendor configuration changes without review.

### Immediate advertising kill switches

Set `NEXT_PUBLIC_ADS_ENABLED=false` and redeploy when:

- an ad request occurs on `/play`, `/challenge/[token]`, or any game state;
- an ad appears on home, legal, contact, error, offline, or other non-allowlisted route;
- consent behavior fails closed incorrectly or a required CMP signal is missing;
- a slot shifts, overlays, or approaches an interactive control;
- suspicious, automated, incentivized, purchased, or unexplained traffic appears;
- Google issues a serving limit, invalid-traffic warning, or relevant Policy Center notice;
- an operator or tester accidentally clicks a live ad;
- the operator cannot identify the active publisher, slot, route, or traffic source.

The ad-free site remains the safe fallback. Revenue loss is preferable to policy, user, or advertiser harm.

## 13. AdSense readiness

Google’s [AdSense eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en) state that publisher content must be high-quality, original, and able to attract an audience. Approval is discretionary, policies change, and an approved account does not make every route eligible.

### Operator prerequisites

- A real operator aged 18 or older owns or is authorized to operate the site.
- Operator/payee name, address, tax, identity, payment, and recovery details are accurate.
- The operator controls the production domain and can modify its source and root files.
- A monitored policy/account email has a named backup.
- The working title and domain have received appropriate clearance.
- The operator can respond to Policy Center, account, legal, privacy, and security issues.

### Site prerequisites

- Canonical HTTPS domain and redirects are stable.
- Home, About, How to Play, Privacy, Terms, Contact, and substantial editorial resources are complete and consistent.
- No placeholder operator, email, jurisdiction, or retention text remains on public legal pages.
- Navigation works without ads.
- The game works without ads, analytics, or consent storage.
- Search indexing contains only useful canonical pages.
- There is enough real audience evidence to show the site attracts visitors for its content and product.
- No empty, duplicated, copied, or under-construction routes are public.
- Current Google Publisher Policies and account-specific instructions have been re-read and dated.

### Technical prerequisites

- `NEXT_PUBLIC_ADS_ENABLED` defaults to `false` in every environment.
- No Google ad script or request loads while the flag is false.
- A real production publisher ID is validated; samples and placeholders cannot emit requests.
- `/ads.txt` uses the exact account-provided seller record only after the account exists.
- Local, preview, test, and screenshot environments make zero ad-network requests.
- Consent state reaches the ad loader before any eligible request.
- Route eligibility uses a server-controlled or reviewed explicit allowlist.
- The independent kill switch has been exercised by a second operator.

## 14. Advertising route and state policy

Google’s policy for [screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688?hl=en) disallows ads on no/low-value, under-construction, alert, navigation, and other behavioral screens. Google also cautions against ads near game controls and interactive elements in its [AdSense beginner guide](https://support.google.com/adsense/answer/23921?hl=en). The MVP uses a stricter rule than attempting to monetize the play experience.

### Permanent MVP denylist

| Surface | Advertising decision | Reason |
| --- | --- | --- |
| Setup | Never | Mode selection and prepare action are behavioral controls |
| Ready | Never | Start control and imminent timed interaction |
| Playing | Never | Rapid tile selection and timer |
| Round result | Never | Target reveal and next-board control |
| Session result | Never | Share, replay, and Daily controls |
| Every `/challenge/[token]` state | Never | Tokenized, noindex, interactive recipient flow |
| `/play` route | Never | Entire route exists for the game state machine |
| Home | No ads in MVP | Primary start actions and product acquisition surface |
| Pattern library | No ads in MVP | Dense navigation into play and potentially thin summaries |
| Privacy, Terms, Contact | Never | Legal/support purpose, not monetization inventory |
| Error, not-found, offline | Never | Recovery or low-content states |
| Consent interface | Never | Choice surface must not contain monetization pressure |

### Initial post-approval allowlist

Only substantial, individually reviewed editorial non-game pages may be considered. Examples are an in-depth SVG-generation article, an accessibility-design guide, or a visual-scanning strategy resource that satisfies the editorial gate.

Each allowed URL requires a record containing:

- canonical URL;
- responsible editor;
- publication and review date;
- distinct reader intent;
- original asset inventory;
- word/visual substance assessment;
- mobile screenshots at all supported widths;
- keyboard and screen-reader review;
- ad-to-content balance review;
- distance from every link and control;
- consent-network capture;
- layout-shift measurement;
- approval and expiry date.

No wildcard route becomes eligible merely because one page in the section passed.

### Placement rules

- Start with at most one reserved inline slot after substantial introductory content.
- The article must remain useful when the slot is empty.
- Label advertising clearly without styling it as editorial content.
- Reserve dimensions to prevent layout movement.
- Keep at least 150 CSS pixels from interactive controls as a floor, not a universal guarantee; increase distance when touch patterns, sticky elements, or viewport constraints warrant it.
- Never place an ad before the article establishes its purpose.
- Never place an ad between steps that require immediate interaction.
- Keep sticky, anchor, vignette, overlay, and interstitial formats disabled.
- Do not use misleading headings, arrows, selection markers, or game-like borders around ads.
- Recheck every allowed page after layout, navigation, consent, or ad-format changes.

## 15. Consent, privacy, and operator gates

Google currently requires a Google-certified CMP integrated with the IAB TCF for the relevant personalized-ad serving described for the EEA, UK, and Switzerland; the current publisher guidance is in [Google’s consent-management requirements](https://support.google.com/adsense/answer/13554116?hl=en). Certification does not establish full legal compliance. The operator must review actual markets, vendors, purposes, and applicable law.

### Required data map

| System | Data or access | Purpose | Required for play? | Storage/retention | Recipient | Choice |
| --- | --- | --- | --- | --- | --- | --- |
| Hosting/CDN/security | Document actual request and security logs | Delivery and abuse prevention | Usually yes | Operator-defined | Named providers | Notice and applicable rights |
| Local game statistics | Aggregate scores, found totals, Daily UTC dates | Device-local history | No | Until cleared/expired | Browser only | Clear site data; future in-product control |
| Challenge URL | Opaque seed and checksum | Reproduce five boards | Only for challenges | URL lifecycle | Recipient and chosen sharing app | Do not share/delete message |
| Analytics | Approved event enums and vendor-added fields | Product decisions | No | Approved fixed period | Named vendor | Consent/opt-out where required |
| CMP | Consent choices and required signals | Manage choices | No for core play | Documented by CMP | CMP/ad vendors | Persistent revisit/withdrawal control |
| Advertising | Cookies, identifiers, request metadata, consent signals as configured | Ad delivery and measurement | No | Vendor/operator documented | Google and disclosed vendors | Applicable consent and privacy controls |

### Public privacy gate

Before non-essential measurement or ads:

- Identify the actual legal operator and privacy contact.
- Identify every production vendor and role.
- Describe local game data accurately.
- Explain tokenized challenge sharing accurately.
- Document hosting/security logs and retention.
- Document analytics fields, purpose, retention, access, and choices.
- Document advertising cookies, identifiers, personalization modes, vendors, and choices.
- Explain applicable rights and a verified request channel.
- State the intended general audience and complete any child-directed assessment.
- Provide a persistent way to revisit consent choices where required.
- Record effective date and material-change process.
- Obtain appropriate legal/privacy review for launch markets.

### CMP test matrix

- First visit from each relevant test region.
- Accept all.
- Reject all.
- Close or take no action.
- Granular/partial choice where offered.
- Return with stored choice.
- Withdraw after acceptance.
- Change choice after rejection.
- Expired consent.
- Cleared browser storage.
- Unknown or failed region detection.
- CMP script blocked or unavailable.
- Client-side navigation from editorial page to play.
- Client-side navigation from play to editorial page.
- Ad loader unavailable.

Core play must work in every row. Ad requests must match the approved consent outcome and route eligibility.

## 16. `ads.txt`, site connection, and production configuration

### Environment rules

```text
NEXT_PUBLIC_SITE_URL=https://[canonical-domain]
NEXT_PUBLIC_CONTACT_EMAIL=[monitored-address]
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_ADS_ENABLED=false
ADSENSE_PUBLISHER_ID=
```

- Public-prefixed values are public, not secrets.
- Production-only identifiers must not be copied into preview without an approved reason.
- Missing, malformed, sample, or unapproved values fail closed.
- A configuration change requires review, deployment, and network verification.

### `ads.txt` gate

The current route intentionally emits a disabled comment unless `ADSENSE_PUBLISHER_ID` matches `pub-` followed by 10–20 digits. Activation requires:

1. Copy the exact publisher ID from the approved account.
2. Verify the exact seller line shown by AdSense.
3. Confirm `https://[canonical-domain]/ads.txt` returns HTTP 200 as plain text.
4. Confirm no authentication, redirect loop, preview host, stale cache, or security rule blocks it.
5. Confirm apex and `www` behavior match the canonical-domain decision.
6. Allow normal crawl time and monitor account status.
7. Do not guess, duplicate, or repeatedly rewrite a correct row.

Use Google’s current [ads.txt guidance](https://support.google.com/adsense/answer/9785052?hl=en) and account output as the authority.

### Site connection gate

- Use only the connection method presented in the current AdSense account.
- Preserve the exact account client value.
- Do not treat connection as approval.
- Confirm site status in the account before enabling any ad request.
- Remove sample or obsolete connection code.
- Record account owner, connected domain, verification date, and screenshot reference.

## 17. Invalid-traffic prevention and response

Google defines invalid traffic to include artificially inflated impressions or clicks, including accidental interactions, self-clicks, repeated clicks, encouraged clicks, and automated tools. Publishers remain responsible for traffic quality; review the current [invalid-traffic guidance](https://support.google.com/adsense/answer/16737?hl=en) before activation.

### Prevention

- Never click live ads, including to inspect an advertiser.
- Do not ask friends, testers, contractors, creators, or communities to click.
- Do not reward ad viewing or interaction.
- Do not purchase visitors from unverifiable networks.
- Reject pop-ups, redirects, toolbars, bundled software, traffic exchanges, bots, and incentivized sources.
- Use UTM-like campaign groupings that contain no identity and make source quality inspectable.
- Keep launch experiments small enough to isolate anomalies.
- Separate operator and automated traffic where the vendor supports it.
- Never put ads on rapid-interaction routes.
- Monitor source, geography, landing page, request volume, viewability, and unusual interaction patterns.

### Suspicious-traffic runbook

1. Disable ads first.
2. Stop the suspected campaign or referrer source.
3. Preserve privacy-approved aggregate evidence; do not begin invasive fingerprinting.
4. Record start time, route, source group, geography, volume change, and operator actions.
5. Check AdSense Policy Center and account messages.
6. Review recent placement, CMP, routing, deployment, and campaign changes.
7. Contact official support when the account provides an appropriate path.
8. Keep ads off until the source and controls are understood.
9. Document the decision and prevention change.

Revenue or estimated earnings must never override this response.

## 18. Thirty-, sixty-, and ninety-day plan

### Days 1–30 — prove the product, ad-free

#### Product reliability

- Complete all automated domain, UI, build, and route gates.
- Test all eight families across 4×4, 5×5, and 6×6 boards on representative devices.
- Verify exact-deadline timeout, repeated incorrect selections, stale actions, and five-round completion.
- Verify valid, invalid, corrupted, oversized, and unsupported challenge paths.
- Verify the UTC date transition around midnight.
- Complete keyboard, screen-reader, zoom, contrast, reduced-motion, and mobile QA.
- Resolve operator, domain, contact, privacy, and legal-template blockers.

#### Content

- Finish About and How to Play as substantial, accurate resources.
- Publish the first two cornerstone articles only after editorial acceptance.
- Create original diagrams and annotated SVG examples.
- Establish author, review date, citation, and update records.
- Configure canonical metadata, sitemap, robots, and Search Console.

#### Distribution

- Prepare three short-form demonstrations.
- Run a small private usability cohort.
- Run one transparent community post where permitted.
- Collect qualitative confusion and accessibility reports.
- Do not enable ads.
- Keep analytics disabled unless its entire gate passes; local/manual measurement is acceptable.

#### Day-30 decision

Proceed only if people can reliably complete the game, challenge recipients activate, no critical accessibility/privacy/security issue remains, and the site has clear standalone value without ads.

### Days 31–60 — establish repeat and qualified acquisition

#### Product and retention

- Improve the single largest verified funnel loss.
- Test one Daily return presentation.
- Test one challenge share-copy variation.
- Review family/grid timeout and unique-miss patterns for perceptual ambiguity.
- Add a local completion indicator only if it remains honest and non-coercive.

#### Content and search

- Publish two to four additional cornerstone resources, one at a time.
- Use Search Console evidence to improve existing pages before expanding.
- Consolidate overlapping intent rather than creating another URL.
- Add original demonstrations where they materially improve understanding.

#### Distribution

- Run two short-form creative tests.
- Run one small creator pilot with disclosure and source-quality monitoring.
- Consider one directory launch after production and operator readiness.
- Stop channels that deliver visits without meaningful starts or completions.

#### Monetization readiness

- Audit the site against current AdSense and Publisher Policies.
- Confirm the public site has original content and a real audience.
- Select and test the appropriate consent approach.
- Finalize the data map and privacy disclosure.
- Prepare, but do not enable, the explicit editorial-page allowlist.
- Apply only when ownership, content, policy, and audience requirements are genuinely met.

#### Day-60 decision

An AdSense application is reasonable only if the product is useful, content is substantive, traffic provenance is understood, legal/operator fields are final, and the site would remain worth operating without approval.

### Days 61–90 — conservative monetization or continued ad-free growth

If approval or consent readiness is absent, continue ad-free work. Do not force the schedule.

If every gate passes:

1. Activate the CMP and verify all region/choice paths with ads still off.
2. Connect the approved site and verify `ads.txt`.
3. Enable one reserved slot on one approved substantial editorial page.
4. Verify no ad request on home, play, any game state, challenge, legal, error, or offline surfaces.
5. Monitor consent coverage, layout shift, traffic quality, Policy Center, editorial engagement, and play-entry behavior daily.
6. Exercise the ad kill switch.
7. Expand to another editorial URL only after a documented review.

Continue product work:

- Improve the strongest qualified acquisition loop.
- Refresh and consolidate existing content.
- Review accessibility and perceptual clarity using real reports.
- Record whether ads harm reading quality or product activation.
- Reject any revenue experiment that needs interaction proximity, extra pageviews, or low-value pages.

#### Day-90 decision

Choose one of four honest outcomes:

- continue ad-free because the audience/content base is still early;
- keep a single conservative editorial placement;
- expand the reviewed editorial allowlist slowly;
- disable ads because policy, traffic quality, consent cost, user experience, or revenue does not justify them.

## 19. Operating cadence

### Daily during active launch windows

- Check production availability, game completion, challenge validity, and client failures.
- Review acquisition sources for anomalies.
- Review support, accessibility, and ambiguity reports.
- If ads are active, inspect Policy Center, serving status, and consent coverage without interacting with live ads.

### Weekly

- Review the full funnel using raw counts and rates.
- Segment by mode, grid size, family, difficulty, viewport, and source group only where privacy-approved.
- Select one product or content hypothesis.
- Review Search Console query/page overlap.
- Recheck current allowed ad URLs and recent layout changes.
- Record decisions and owners.

### Monthly

- Re-read relevant Google policy changes and account notices.
- Audit public privacy, operator, consent, and vendor statements.
- Review dependency and security posture.
- Test analytics and ad kill switches.
- Recheck accessibility across representative devices.
- Prune stale, overlapping, or underperforming content when it lacks distinct value.
- Review whether monetization remains worth its operational cost.

## 20. Source register

Recheck these primary sources immediately before implementation or activation:

- [AdSense eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en)
- [Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en)
- [Screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688?hl=en)
- [AdSense policies: a beginner’s guide](https://support.google.com/adsense/answer/23921?hl=en)
- [Invalid traffic](https://support.google.com/adsense/answer/16737?hl=en)
- [Preventing invalid traffic](https://support.google.com/adsense/answer/1112983?hl=en)
- [Consent-management requirements for publishers](https://support.google.com/adsense/answer/13554116?hl=en)
- [Set up and manage a CMP](https://support.google.com/adsense/answer/7670013?hl=en)
- [Required privacy-policy content](https://support.google.com/adsense/answer/1348695?hl=en)
- [How AdSense uses cookies](https://support.google.com/adsense/answer/7549925?hl=en)
- [Connect a site to AdSense](https://support.google.com/adsense/answer/7584263?hl=en)
- [Ads.txt guidance](https://support.google.com/adsense/answer/9785052?hl=en)
- [People-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Search Console Performance report](https://support.google.com/webmasters/answer/7576553?hl=en)

## 21. Definition of responsible growth

Growth is responsible only when:

- the complete five-round experience works without monetization or measurement;
- return and sharing are earned through product value;
- content is useful, original, and reviewed;
- traffic sources are transparent and valid;
- privacy choices are real and reversible;
- no token, seed, or personal data enters analytics;
- every ad request is consent-eligible and route-allowlisted;
- all game states and challenge routes remain ad-free;
- a second operator can disable optional systems quickly;
- decisions use evidence without pretending uncertainty is certainty.

The desired business is a small, trusted visual-puzzle product with repeat users and durable authored resources. Advertising is an optional outcome of that value, not the product’s reason to exist.
