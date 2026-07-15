import type { Metadata } from "next";
import {
  Callout,
  ContentPage,
  ContentSection,
  PrimaryContentLink,
} from "@/components/content";

export const metadata: Metadata = {
  title: "How to Play",
  description:
    "Learn the five-round, 15-second rules for One Pixel Off, including wrong taps, scoring, Daily Scan, and keyboard play.",
  alternates: { canonical: "/how-to-play" },
};

export default function HowToPlayPage() {
  return (
    <ContentPage
      eyebrow="Scan protocol"
      title="How to play"
      description="Five boards. Fifteen seconds each. Find the single tile whose geometry is just a little different."
    >
      <ContentSection id="quick-rules" title="The quick rules">
        <ol>
          <li>Choose Quick Scan, Daily Scan, or open a friend&apos;s challenge.</li>
          <li>Press start when your eyes are ready; the timer begins with the board.</li>
          <li>Inspect the full grid and select the one tile that differs.</li>
          <li>A wrong tile is marked, but the round continues and the clock keeps moving.</li>
          <li>Find the target or let time expire. After five boards, compare the complete scan.</li>
        </ol>
      </ContentSection>

      <Callout title="There is always exactly one target" tone="notice">
        <p>
          Every normal tile uses the same immutable vector description. The target
          receives one bounded numeric mutation. The engine validates the target
          index and cell count before the board reaches the screen.
        </p>
      </Callout>

      <ContentSection id="differences" title="What can be different?">
        <p>
          Look for a shifted dot, a slightly shorter line, an unusual gap, a
          thicker stroke, a changed radius, or a small rotation. Early boards are
          generous; later grids are denser and their changes become subtler.
        </p>
        <p>
          Color creates the pattern, but it is never the only answer. The actual
          target is encoded in geometry so the puzzle remains meaningful when
          colors are perceived differently.
        </p>
      </ContentSection>

      <ContentSection id="scoring" title="Scoring">
        <p>
          A correct find earns a base score plus a speed bonus. Each unique wrong
          tile reduces the round score; repeated taps on the same wrong tile do
          not stack the penalty. A timeout scores zero and reveals the answer.
        </p>
        <p>
          Scores live on this device and are meant for lightweight comparison,
          not verified global rankings. Challenge players receive the same boards,
          but their own device keeps the result.
        </p>
      </ContentSection>

      <ContentSection id="modes" title="Three ways to scan">
        <ul>
          <li><strong>Quick Scan</strong> generates a fresh five-board session.</li>
          <li><strong>Daily Scan</strong> uses the current UTC date, so everyone gets the same set.</li>
          <li><strong>Challenge</strong> encodes a safe seed in the URL for an exact replay.</li>
        </ul>
      </ContentSection>

      <ContentSection id="accessible-play" title="Keyboard, motion, and sound">
        <p>
          Each tile is a real button. Use Tab or Shift+Tab to move and Enter or
          Space to select. Important state is visible and announced to assistive
          technology; sound is not required. Reduced-motion preferences suppress
          decorative movement, and the game remains usable at narrow widths and zoom.
        </p>
      </ContentSection>

      <PrimaryContentLink href="/play">Start scanning</PrimaryContentLink>
    </ContentPage>
  );
}
