import type { Metadata } from "next";
import {
  Callout,
  ContentPage,
  ContentSection,
  InlineLink,
  PrimaryContentLink,
} from "@/components/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why One Pixel Off is a tiny, deterministic visual puzzle with no accounts, uploads, or paid generation APIs.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="The experiment"
      title="A tiny test for sharp eyes"
      description="One Pixel Off turns a grid of almost-identical marks into a five-round visual sprint. Every puzzle is made from code, right in your browser."
    >
      <ContentSection id="idea" title="The idea">
        <p>
          Look at the board. One tile differs by a small change in spacing, size,
          angle, stroke, or alignment. Find it before the 15-second scan ends.
          That is the entire game—and exactly why it works in a spare minute.
        </p>
        <p>
          It is designed for solo play, a quick daily comparison, or a challenge
          link sent to a friend. The same seed always reconstructs the same five
          boards, so a shared challenge is fair without storing it on a server.
        </p>
      </ContentSection>

      <ContentSection id="principles" title="What we protect">
        <ul>
          <li><strong>Instant starts:</strong> no registration, profile, or app install.</li>
          <li><strong>Real puzzles:</strong> one valid target is guaranteed on every generated board.</li>
          <li><strong>Calm play:</strong> no ad belongs inside an active timed round.</li>
          <li><strong>Small data footprint:</strong> preferences and results stay in local browser storage.</li>
          <li><strong>Reproducibility:</strong> daily and shared boards are derived from a compact seed.</li>
        </ul>
      </ContentSection>

      <Callout title="No AI image bill" tone="notice">
        <p>
          The boards are structured vector instructions—circles, lines, polygons,
          and rectangles—not downloaded pictures. A seeded generator selects a
          pattern and changes exactly one numeric property. SVG draws the result
          locally, for effectively zero generation cost.
        </p>
      </Callout>

      <ContentSection id="status" title="Built as a web game">
        <p>
          One Pixel Off currently runs in a modern browser. A future native app
          could reuse the same seed and puzzle rules, but would require its own
          accessibility, privacy, advertising, and store-review work.
        </p>
        <p>
          Found a board that looks ambiguous or a device where play feels wrong?
          Please <InlineLink href="/contact">send the puzzle code and details</InlineLink>.
          Reproducible reports are how the pattern lab gets better.
        </p>
      </ContentSection>

      <PrimaryContentLink href="/play">Run a five-round scan</PrimaryContentLink>
    </ContentPage>
  );
}
