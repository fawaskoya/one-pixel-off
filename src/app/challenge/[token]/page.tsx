import type { Metadata } from "next";
import { GameShell } from "@/components/game/game-shell";
import { decodePixelChallengeToken } from "@/domain/pixel";

export const metadata: Metadata = {
  title: "A friend challenged your eyes",
  description: "Inspect the exact same five One Pixel Off boards and compare your score.",
  robots: { index: false, follow: false },
};

type ChallengePageProps = {
  params: Promise<{ token: string }>;
};

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { token } = await params;
  const decoded = decodePixelChallengeToken(token);

  if (!decoded.ok) {
    return <GameShell challengeError={`${decoded.error.message} Start a fresh scan instead.`} />;
  }

  return (
    <GameShell
      challengeSeed={decoded.value.seed}
      challengeTokenId={decoded.value.tokenId}
      initialMode="challenge"
    />
  );
}
