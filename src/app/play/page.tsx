import type { Metadata } from "next";
import { GameShell } from "@/components/game/game-shell";

export const metadata: Metadata = {
  title: "Play",
  description:
    "Play five deterministic One Pixel Off visual puzzles in your browser. No account, upload, or AI image generation required.",
  alternates: { canonical: "/play" },
};

type PlayPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const modeParam = (await searchParams).mode;
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam;
  return <GameShell initialMode={mode === "daily" ? "daily" : "quick"} />;
}
