# One Pixel Off

One Pixel Off is a backend-free visual inspection game with two complementary loops. **Classic Five** delivers a fixed five-board Quick, Daily, or friend Challenge. **Focus Run** keeps generating boards locally until the player finishes at a five-board checkpoint, exhausts three focus charges, or completes the deterministic 15-board Weekly variant.

Nothing calls an image-generation API. A deterministic seed selects an authored vector family, palette, grid size, target cell, and bounded mutation. React renders the resulting circles, lines, rectangles, and polygons as inline SVG. Within a pinned version, the same Classic seed reconstructs the same five puzzles and the same Focus seed plus board number reconstructs the same numbered board.

## Implemented game

- **Classic Five / Quick Scan** creates a fresh local seed and remains exactly five boards.
- **Daily Scan** derives the same fixed-five board set from the UTC calendar date.
- **Challenge** uses a validated `/challenge/[token]` URL to replay an exact fixed-five seed.
- **Focus Run** starts with three charges, tracks find and clean streaks, and pauses after every five resolved boards so the player can continue or finish.
- A Focus timeout consumes one charge, resets both streaks, and gives the next board a transparent two-second recovery bonus. Wrong taps break the clean streak and reduce score, but do not consume charges.
- Every fifth consecutive find restores one missing charge, up to three. Difficulty advances through authored tiers while the base timer steps from 15 to 14 to 13 to 12 seconds; mutation visibility floors remain intact.
- **Weekly Focus** is a deterministic UTC ISO-week variant capped at 15 boards. It uses the same three-charge rules and ends early if those charges are exhausted.
- Every board remains a square 4×4, 5×5, or 6×6 grid with exactly one scalar anomaly.
- A wrong tile is recorded once and play continues.
- A correct find receives 100 points plus a millisecond-derived speed bonus, minus 20 per unique wrong tile, clamped to 25–250.
- A tap at or after the absolute deadline loses to timeout; backgrounding a tab cannot extend the round.
- Versioned local storage keeps aggregate Classic statistics, Daily completion dates, and aggregate Focus records. Daily streaks, seven-day activity, Clean Five, Every Angle, Deep Focus, and family mastery are derived rather than stored as unlock flags.
- There are no accounts, remote generation calls, paid lives, ad-watched revives, or globally verified leaderboards.

Classic Challenge replay uses the checksummed `/challenge/[token]` format. Focus results share the exact numbered-board sequence through `/focus?g=2&r=1&seed=<normalized opaque seed>` and add `mode=weekly` for Weekly. The Focus query pins generation/rules versions and validates the seed, but it is not a signed/checksummed token or proof of score; a hardened token format remains a separate compatibility and privacy decision.

The normative generator, reducer, timing, and token rules are in [docs/GAME_LOGIC.md](docs/GAME_LOGIC.md).

## Stack

- Next.js 16 App Router
- React 19 and TypeScript 5
- Tailwind CSS 4
- Vitest 4
- pnpm 10 and Node.js 20.9+

## Clone and run locally

```bash
git clone https://github.com/fawaskoya/one-pixel-off.git one-pixel-off
cd one-pixel-off
pnpm install
pnpm dev
```

Open `http://localhost:3000`. If that port is occupied:

```bash
pnpm dev --port 3001
```

The Next development server hot-reloads code and styles. The service worker is registered only in production, which prevents stale caches while developing.

## Configuration

Copy `.env.example` to `.env.local` when you need non-default values.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | local dev origin; production project URL | Canonical public origin. Set this explicitly when moving to a custom domain. |
| `GOOGLE_SITE_VERIFICATION` | empty | Search Console HTML-tag content token; emitted as verification metadata only. |
| `NEXT_PUBLIC_ADS_ENABLED` | `false` | Reserved ad-placement gate; keep false until every launch gate is met. |
| `ADSENSE_PUBLISHER_ID` | empty | Public `pub-…` account identifier used for AdSense ownership metadata and `/ads.txt`; does not enable ads. |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `false` | Reserved analytics gate; no provider is connected. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | empty | Monitored support/privacy mailbox required before launch. |

Public-prefixed values are visible to browsers. Never put secrets in them.

## Verification

```bash
pnpm check
pnpm build
```

| Command | Purpose |
| --- | --- |
| `pnpm lint` | ESLint and Next/React rules |
| `pnpm typecheck` | TypeScript without emitting files |
| `pnpm test` | Complete deterministic unit suite |
| `pnpm test:domain` | Classic and Focus Run domain suites |
| `pnpm test:watch` | Watch-mode tests during development |
| `pnpm build` | Optimized production build |

After automated checks, verify Quick, Daily, valid Challenge, invalid Challenge, wrong-tap, timeout, share, keyboard, narrow-screen, and refresh behavior in a real browser. See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Architecture map

```text
src/app/                 Routes, metadata, legal/recovery pages, PWA files
src/components/game/     Classic orchestration and shared SVG renderer
src/components/focus/    Focus orchestration, HUD, checkpoints, summary, progression
src/components/site/     Shared navigation, brand, footer, and ad boundary
src/domain/pixel/         Pure generation, invariants, reducer, score, tokens, tests
src/domain/focus-run/     Versioned lazy run generation, reducer, weekly seed, tests
src/lib/client/           Aggregate persistence, Daily activity, and share adapters
docs/                    Product, architecture, design, launch, growth, agent plans
```

The domain is deliberately UI-independent. Vector descriptors contain integer-only geometry and semantic color roles, so a later Canvas or native renderer can reproduce the same versioned puzzle contract.

## Ads and growth

No live AdSense script, analytics provider, account system, or remote puzzle service is connected. Timed play, results, checkpoints, charges, and continues are protected from ads; an ad is never a condition for continuing a run. Monetization requires production content, policy review, a real operator and contact route, privacy/consent implementation where required, placement QA, traffic-quality monitoring, and a kill switch. The staged plan is in [docs/GROWTH_ADSENSE.md](docs/GROWTH_ADSENSE.md).

The product name remains a working title until trademark, domain, and handle checks are complete.
