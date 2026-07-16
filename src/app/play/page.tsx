import Link from "next/link";
import { GameShell } from "@/components/game/game-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Play a Free Spot the Difference Game",
  description:
    "Play five free spot-the-difference visual puzzles in your browser. Every One Pixel Off board is generated locally with no account, upload, or AI image API.",
  path: "/play",
});

type PlayPageProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const modeParam = (await searchParams).mode;
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam;
  return (
    <>
      <GameShell initialMode={mode === "daily" ? "daily" : "quick"} />
      <section className="faq-section" aria-labelledby="classic-game-context">
        <div className="reading-shell">
          <p className="section-kicker">Five-board classic</p>
          <h2 id="classic-game-context">A quick visual puzzle with a fair answer</h2>
          <p>
            Each board contains one geometry change hidden among repeating vector
            marks. Quick Scan creates a fresh five-board set, while Daily Scan
            gives every player the same dated sequence. Both modes run entirely
            in the browser and need no account.
          </p>
          <p>
            New to the pattern? Read the <Link className="inline-link" href="/how-to-play">complete rules and controls</Link>,
            or explore the <Link className="inline-link" href="/categories">visual puzzle pattern families</Link> used by the generator.
          </p>
        </div>
      </section>
    </>
  );
}
