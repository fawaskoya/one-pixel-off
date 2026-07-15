import type { Metadata } from "next";
import { FocusRunShell } from "@/components/focus/focus-run-shell";
import {
  FOCUS_RUN_GENERATION_VERSION,
  FOCUS_RUN_RULES_VERSION,
} from "@/domain/focus-run";
import { normalizePixelSeed } from "@/domain/pixel";

export const metadata: Metadata = {
  title: "Focus Run",
  description:
    "Play an escalating One Pixel Off endurance run with focus charges, streaks, checkpoints, local records, and a deterministic weekly gauntlet.",
  alternates: { canonical: "/focus" },
};

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
  );
}
