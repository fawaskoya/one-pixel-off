import type { Metadata } from "next";
import {
  ContentPage,
  ContentSection,
  PrimaryContentLink,
} from "@/components/content";

export const metadata: Metadata = {
  title: "Pattern Lab",
  description:
    "Explore the procedural vector pattern families and mutation rules behind One Pixel Off puzzles.",
  alternates: { canonical: "/categories" },
};

const families = [
  ["Rings", "Concentric circles where a radius, center, or stroke slips out of rhythm.", "Size · offset · stroke"],
  ["Stripes", "Parallel bars with one altered gap, height, width, or lean.", "Spacing · size · rotation"],
  ["Arrows", "Directional marks with one point, shaft, or proportion out of line.", "Size · offset · spacing"],
  ["Corners", "Paired right angles that expose the smallest alignment error.", "Offset · size · stroke"],
  ["Dot fields", "Nine-dot microgrids with one center, radius, or interval disturbed.", "Offset · size · spacing"],
  ["Diamonds", "Nested polygons whose symmetry is broken in exactly one place.", "Size · offset · stroke"],
  ["Chevrons", "Repeated angled strokes with a single endpoint or weight changed.", "Offset · spacing · stroke"],
  ["Orbit", "Circular systems where a satellite or ring misses its expected track.", "Size · offset · spacing"],
] as const;

export default function PatternLabPage() {
  return (
    <ContentPage
      eyebrow="Pattern inventory"
      title="Inside the pattern lab"
      description="A small grammar of vector shapes can produce an enormous supply of fair, reproducible puzzles without creating or downloading images."
    >
      <div className="pattern-grid">
        {families.map(([name, description, mutation]) => (
          <article className="pattern-card" key={name}>
            <p className="pattern-card__index">{mutation}</p>
            <h2>{name}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>

      <ContentSection id="recipe" title="A board is a compact recipe">
        <p>
          The generator combines a session seed, round number, palette, family,
          grid size, target position, and one mutation. It then produces plain
          data describing the primitives in every tile. The interface renders
          that data as inline SVG; no image file is created or fetched.
        </p>
      </ContentSection>

      <ContentSection id="difficulty" title="Difficulty without guesswork">
        <p>
          Difficulty increases through grid density and smaller numeric deltas.
          Mutation ranges are bounded so shapes stay on the board, and each round
          has a stable ID that makes a questionable puzzle reproducible in tests.
        </p>
      </ContentSection>

      <ContentSection id="cost" title="Why generation stays free">
        <p>
          The work is arithmetic: a tiny seeded pseudo-random generator chooses
          from authored rules, and the browser draws vectors it already knows.
          There is no model inference, media storage, moderation queue, or API
          request for each round.
        </p>
      </ContentSection>

      <PrimaryContentLink href="/play">Generate a fresh board set</PrimaryContentLink>
    </ContentPage>
  );
}
