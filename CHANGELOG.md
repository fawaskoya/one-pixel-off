# Changelog

All notable pre-release changes to One Pixel Off are recorded here.

## [Unreleased]

### Added

- Built the complete five-round Quick, Daily, and Challenge game flow with 15-second absolute deadlines, unique wrong-tap tracking, target reveal, per-round results, and final scan reports.
- Added a deterministic procedural vector engine with eight pattern families, six palettes, progressive difficulty, integer-only SVG geometry, and exactly one mutated target per puzzle.
- Added strict runtime invariants proving cell counts, one-target semantics, mutation integrity, bounds, generation versions, session structure, and reducer state validity.
- Added guarded reducer transitions for ready, playing, round result, and session result states. Stale, duplicate, invalid, and late actions are safe no-ops or deterministic timeouts.
- Added UTC Daily seeds and tamper-checked, versioned challenge tokens that contain only an opaque seed.
- Added the versioned Focus Run domain as an additive mode: three charges, find and clean streaks, charge restoration at five-find milestones, one-board recovery timing after a timeout, explicit five-board checkpoints, and bounded lazy board generation.
- Added an escalating Focus schedule with 15/14/13/12-second sectors while preserving the calibrated mutation floors and 6×6 grid ceiling.
- Added a deterministic UTC ISO-week Focus variant capped at 15 boards, with the same guarded reducer and early charge-exhaustion behavior.
- Added the `/focus` experience with run selection, shared-seed replay, Focus HUD, checkpoint, summary, progression components, and result-share copy that does not claim server verification.
- Added responsive inline-SVG rendering with real button cells, roving arrow/Home/End keyboard navigation, visible focus, resolved wrong/target accessible labels, reduced-motion handling, live wrong-tap feedback, and non-color-only answer reveals.
- Added separate versioned Focus aggregate progression with defensive normalization, safe counter saturation, per-family finds, and non-blocking storage failure.
- Added derived UTC Daily current/longest streaks and seven-day activity, plus derived Clean Five, Every Angle, Deep Focus, and 5/25/100 family mastery milestones without persisted unlock flags.
- Added native sharing, clipboard fallback, and manual-copy recovery.
- Added a dark inspection-lab brand system, home experience, Pattern Lab, how-to, about, privacy, terms, contact, offline, 404, route-error, and global-recovery surfaces.
- Added metadata, Open Graph artwork, sitemap, robots, manifest, app icon, production-only offline fallback, conditional `ads.txt`, and a disabled-by-default ad boundary.
- Added the master plan, architecture, exact game-logic specification, design system, decisions, marketing/AdSense strategy, launch checklist, detailed delegation prompts, master build prompt, and five repeatable agent loops.
- Added deterministic Vitest coverage for Classic and Focus generation, invariants, seeded reproducibility, perceptual mutation floors, scoring boundaries, Daily/Weekly behavior, challenge corruption, clock authority, guarded transitions, checkpoints, recovery, streaks, selectors, progression, and storage degradation.

### Changed

- Pivoted the original word-game scaffold completely to One Pixel Off.
- Replaced prompt catalogs, spoken-answer logic, category selection, honor-system results, and old storage with procedural visual-puzzle equivalents.
- Renamed the package to `one-pixel-off` and simplified the quality gate to lint, typecheck, and tests.
- Standardized challenge replay on `/challenge/[token]` and kept challenge routes out of search indexing.
- Kept Classic Five, Daily, and Challenge fixed at five boards while adding Focus Run as a separate rules/state contract rather than changing public `opo1` challenge semantics.
- Standardized monetization language around content-first approval and a strict no-ads-during-play boundary.
- Recalibrated the pre-launch difficulty curve with separate geometry, non-scaling stroke, and rotation bands so dense rounds remain hard without relying on effectively invisible mutations.

### Removed

- Removed the retired Name Five domain, tests, prompt catalog, prompt validator, client storage schema, and all runtime imports.
- Removed all AI/API image-generation assumptions; board generation is local arithmetic and SVG rendering.

### Fixed

- Prevented 6×6 boards from overflowing their square or viewport by removing conflicting cell minimum heights, constraining active play against dynamic viewport height, and compacting short-landscape spacing.
- Reworked setup, ready, round-result, and session-summary layouts so panels, mode cards, fact strips, result reviews, stats, inputs, and actions remain width-contained and use compact phase-specific responsive compositions instead of overflowing vertical stacks.
- Enlarged the active and mobile review boards with explicit viewport-reserve budgets, compacted the play HUD/timer chrome, added safe-area-aware phone gutters, preserved roughly 46 px 6×6 cells at 320 px width, and added touch-specific pressed feedback without sticky hover styling.
- Prevented the landing hero from falling below shorter desktop viewports by budgeting against the real header height, scaling the headline by both width and height, compacting vertical rhythm, and reserving layout space for the rotated demo card and its hard shadow.
- Removed sub-pixel expert geometry and 1–2° rotation anomalies, and added a mutation-magnitude invariant plus an all-family deterministic visibility corpus to keep future tuning inside the hard-but-fair policy.

### Verification

- `pnpm check` passes repository-wide lint, TypeScript, and 95 deterministic tests across seven test files.
- `pnpm build` passes with 20 generated App Router pages and a compiled dynamic `/focus` route.
- Live development-server checks returned HTTP 200 for `/`, `/focus`, `/focus?mode=weekly`, shared-seed Focus, `/play`, `/sitemap.xml`, and `/manifest.webmanifest` on port 3001; the server log showed no compilation or request errors.
- Interactive in-app-browser discovery was unavailable in the verification session, so desktop/mobile visual, console, keyboard, zoom, and screen-reader checks remain manual launch gates rather than claimed passes.
- The Open Graph image was previously rendered and visually inspected at 1200×630.

### Security and privacy

- Challenge decoders reject oversized, malformed, unsupported, checksum-invalid, and non-canonical payloads without reflecting token contents.
- Puzzle descriptors contain authored geometry and opaque seeds, not uploads or personal data.
- Advertising, analytics, accounts, camera, microphone, photo-library access, remote generation, and user-generated public content remain disabled.
- Focus charges and continues cannot be purchased or restored by watching an ad; local results are not presented as a verified global leaderboard.
- Publisher IDs, production origin, operator identity, monitored contact, consent configuration, and credentials are not supplied in source.

### Known gaps

- The working name still needs trademark, domain, and handle clearance.
- Privacy and terms remain explicit operator-review templates until the business, jurisdiction, vendors, and final data flow are known.
- AdSense, analytics, production deployment, consent controls, and traffic acquisition are planned but deliberately not activated.
- The offline worker is a navigation fallback, not a guarantee that every uncached challenge works offline.
- Focus replay currently uses generation/rules-version query fields plus a normalized opaque `seed` (and optional Weekly mode), not a checksummed or authenticated token; a hardened Focus token remains a future copy-integrity/privacy decision.
- Native iOS packaging, accounts, global leaderboards, server-verified scores, and remote puzzle catalogs are outside this MVP.
