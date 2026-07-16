import {
  Callout,
  ContentPage,
  ContentSection,
  PrimaryContentLink,
} from "@/components/content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How to Play One Pixel Off",
  description:
    "Learn how to spot the one different tile in One Pixel Off, including Focus Run charges, streaks, checkpoints, Daily Scan, scoring, and keyboard controls.",
  path: "/how-to-play",
});

export default function HowToPlayPage() {
  return (
    <ContentPage
      path="/how-to-play"
      eyebrow="Scan protocol"
      title="How to play"
      description="Find the single tile whose geometry breaks the pattern. Play a compact five-board scan or stay in an escalating Focus Run."
    >
      <ContentSection id="quick-rules" title="The quick rules">
        <ol>
          <li>Choose Focus Run, Weekly 15, Quick Scan, Daily Scan, or open a friend&apos;s challenge.</li>
          <li>Press start when your eyes are ready; the timer begins with the board.</li>
          <li>Inspect the full grid and select the one tile that differs.</li>
          <li>A wrong tile is marked, but the round continues and the clock keeps moving.</li>
          <li>Find the target or let time expire. The next step depends on the run mode.</li>
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
          thicker stroke, a changed radius, or a small rotation. Later boards use
          denser grids and tighter timers, while minimum visibility rules keep the target fair.
        </p>
        <p>
          Color creates the pattern, but it is never the only answer. The actual
          target is encoded in geometry so the puzzle remains meaningful when
          colors are perceived differently.
        </p>
      </ContentSection>

      <ContentSection id="focus-run" title="Focus Run rules">
        <ul>
          <li>You begin with three focus charges. Only a timeout spends one.</li>
          <li>Every find grows the find streak. A timeout resets it.</li>
          <li>A first-tap find grows the clean streak. A wrong tap breaks only that clean streak and reduces the round score.</li>
          <li>Five consecutive finds restore one charge, up to the three-charge maximum.</li>
          <li>Every five boards opens a checkpoint where you can continue or finish and save.</li>
          <li>After a timeout, the next board receives a clearly labeled two-second recovery bonus.</li>
        </ul>
        <p>
          Difficulty grows through the timer and pattern complexity, not by making
          anomalies nearly invisible. The timer bottoms out at twelve seconds.
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

      <ContentSection id="modes" title="Five ways to scan">
        <ul>
          <li><strong>Focus Run</strong> continues with charges, streaks, and five-board checkpoints.</li>
          <li><strong>Weekly 15</strong> gives everyone the same deterministic 15-board gauntlet for the UTC week.</li>
          <li><strong>Quick Scan</strong> generates a fresh five-board session.</li>
          <li><strong>Daily Scan</strong> uses the current UTC date, so everyone gets the same set.</li>
          <li><strong>Challenge</strong> encodes a safe seed in the URL for an exact replay.</li>
        </ul>
      </ContentSection>

      <ContentSection id="accessible-play" title="Keyboard, motion, and sound">
        <p>
          Each tile is a real button. Tab enters the board, arrow keys move between
          tiles, Home and End move across a row, and Enter or Space selects. Important state is visible and announced to assistive
          technology; sound is not required. Reduced-motion preferences suppress
          decorative movement, and the game remains usable at narrow widths and zoom.
        </p>
      </ContentSection>

      <PrimaryContentLink href="/focus">Start a Focus Run</PrimaryContentLink>
    </ContentPage>
  );
}
