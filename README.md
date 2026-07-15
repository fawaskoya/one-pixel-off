# One Pixel Off

One Pixel Off is a backend-free visual inspection game. Each session contains five procedurally generated boards; every board has one tile with one altered geometric value, and the player has 15 seconds to find it.

Nothing calls an image-generation API. A deterministic seed selects an authored vector family, palette, grid size, target cell, and bounded mutation. React renders the resulting circles, lines, rectangles, and polygons as inline SVG. The same seed always reconstructs the same five puzzles.

## Implemented game

- **Quick Scan** creates a fresh local seed.
- **Daily Scan** derives a shared seed from the UTC calendar date.
- **Challenge** uses a validated `/challenge/[token]` URL to replay an exact seed.
- Sessions have exactly five rounds with 4×4, 5×5, or 6×6 boards.
- A wrong tile is recorded once and play continues.
- A correct find receives 100 points plus a millisecond-derived speed bonus, minus 20 per unique wrong tile, clamped to 25–250.
- A tap at or after the absolute deadline loses to timeout; backgrounding a tab cannot extend the round.
- Local storage keeps aggregate sessions, finds, scores, best score, and Daily completion dates. There are no accounts.

The normative generator, reducer, timing, and token rules are in [docs/GAME_LOGIC.md](docs/GAME_LOGIC.md).

## Stack

- Next.js 16 App Router
- React 19 and TypeScript 5
- Tailwind CSS 4
- Vitest 4
- pnpm 10 and Node.js 20.9+

## Run locally

```bash
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
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical public origin. |
| `NEXT_PUBLIC_ADS_ENABLED` | `false` | Reserved ad-placement gate; keep false until every launch gate is met. |
| `ADSENSE_PUBLISHER_ID` | empty | Server-only publisher value used by `/ads.txt` after approval. |
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
| `pnpm test:domain` | Procedural puzzle domain only |
| `pnpm test:watch` | Watch-mode tests during development |
| `pnpm build` | Optimized production build |

After automated checks, verify Quick, Daily, valid Challenge, invalid Challenge, wrong-tap, timeout, share, keyboard, narrow-screen, and refresh behavior in a real browser. See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md).

## Architecture map

```text
src/app/                 Routes, metadata, legal/recovery pages, PWA files
src/components/game/     Client game orchestration and SVG renderer
src/components/site/     Shared navigation, brand, footer, and ad boundary
src/domain/pixel/         Pure generation, invariants, reducer, score, tokens, tests
src/lib/client/           Local persistence and share adapters
docs/                    Product, architecture, design, launch, growth, agent plans
```

The domain is deliberately UI-independent. Vector descriptors contain integer-only geometry and semantic color roles, so a later Canvas or native renderer can reproduce the same versioned puzzle contract.

## Ads and growth

No live AdSense script, analytics provider, account system, or remote puzzle service is connected. Timed play and round results are protected from ads. Monetization requires production content, policy review, a real operator and contact route, privacy/consent implementation where required, placement QA, traffic-quality monitoring, and a kill switch. The staged plan is in [docs/GROWTH_ADSENSE.md](docs/GROWTH_ADSENSE.md).

The product name remains a working title until trademark, domain, and handle checks are complete.
