import type { Metadata } from "next";
import { GameShell } from "@/components/game/game-shell";
import { decodePixelChallengeToken } from "@/domain/pixel";
import { absoluteUrl, siteConfig } from "@/lib/site";

const challengeDescription =
  "Inspect the exact same five One Pixel Off boards as a friend and compare your local score.";

type ChallengePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({
  params,
}: ChallengePageProps): Promise<Metadata> {
  const { token } = await params;
  const path = `/challenge/${encodeURIComponent(token)}`;
  const title = "A friend challenged your eyes | One Pixel Off";

  return {
    title: { absolute: title },
    description: challengeDescription,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      title,
      description: challengeDescription,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: challengeDescription,
    },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

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
