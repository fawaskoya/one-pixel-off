import Link from "next/link";
import { FocusRunShell } from "@/components/focus/focus-run-shell";
import {
  FOCUS_RUN_GENERATION_VERSION,
  FOCUS_RUN_RULES_VERSION,
} from "@/domain/focus-run";
import { normalizePixelSeed } from "@/domain/pixel";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Focus Run — Endless Spot the Difference Game",
  description:
    "Play an escalating spot-the-difference endurance game with focus charges, streaks, checkpoints, local records, and a deterministic Weekly 15 gauntlet.",
  path: "/focus",
});

type FocusPageProps = Readonly<{
  searchParams: Promise<{
    mode?: string | string[];
    seed?: string | string[];
    g?: string | string[];
    r?: string | string[];
  }>;
}>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const params = await searchParams;
  const mode = firstValue(params.mode);
  const suppliedSeed = firstValue(params.seed);
  const suppliedGeneration = firstValue(params.g) ?? "1";
  const suppliedRules = firstValue(params.r) ?? "1";
  const normalizedSeed = suppliedSeed
    ? normalizePixelSeed(suppliedSeed)
    : null;
  const supportedVersion =
    suppliedGeneration === FOCUS_RUN_GENERATION_VERSION.toString() &&
    suppliedRules === FOCUS_RUN_RULES_VERSION.toString();
  const sharedSeed = supportedVersion
    ? (normalizedSeed ?? undefined)
    : undefined;

  return (
    <>
      <FocusRunShell
        initialVariant={mode === "weekly" ? "weekly" : "focus"}
        initialError={
          suppliedSeed && normalizedSeed === null
            ? "This shared run seed is invalid. You can still start a fresh sequence below."
            : suppliedSeed && !supportedVersion
              ? "This shared run uses an unsupported engine or rules version. It was not opened, but you can start a fresh sequence below."
              : undefined
        }
        sharedSeed={sharedSeed}
      />
      <section className="faq-section" aria-labelledby="focus-game-context">
        <div className="reading-shell">
          <p className="section-kicker">Escalating observation game</p>
          <h2 id="focus-game-context">Build a streak, reach a checkpoint, keep your focus</h2>
          <p>
            Focus Run continues until all three focus charges are spent. Correct
            finds build streaks, every five boards opens a checkpoint, and the
            timer tightens without making the answer intentionally invisible.
            Weekly 15 uses one shared sequence for the current UTC week.
          </p>
          <p>
            See the <Link className="inline-link" href="/how-to-play#focus-run">Focus Run rules and scoring</Link>,
            or learn <Link className="inline-link" href="/about">how the deterministic puzzle engine works</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
