import Link from "next/link";
import { AdSlot } from "@/components/site/ad-slot";

const patternFamilies = [
  { name: "Alignment", code: "A-01", note: "One mark slips off the shared axis" },
  { name: "Geometry", code: "G-02", note: "One shape bends a precise rule" },
  { name: "Signal", code: "S-03", note: "One indicator breaks the sequence" },
  { name: "Rotation", code: "R-04", note: "One object turns against the system" },
] as const;

const faqs = [
  {
    question: "Are these images made with AI?",
    answer:
      "No. Every board is assembled from SVG geometry and deterministic code in your browser. There is no image-generation API or per-puzzle bill.",
  },
  {
    question: "Is every board genuinely new?",
    answer:
      "Quick play generates a fresh seed. Daily and challenge modes reuse a seed intentionally so everybody sees the exact same puzzle.",
  },
  {
    question: "Does it need an account?",
    answer:
      "No account, download, camera, or personal information is required. Your basic results can stay on this device.",
  },
] as const;

function DemoBoard() {
  return (
    <div className="demo-board" aria-label="Example six by six pattern with one misaligned tile">
      {Array.from({ length: 36 }, (_, index) => (
        <span className="demo-cell" data-anomaly={index === 22 ? "true" : "false"} key={index}>
          <i />
        </span>
      ))}
      <span className="demo-board__stamp">01 anomaly</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero hero--pixel shell" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow"><span className="status-dot" /> Visual inspection test 001</p>
          <h1 id="hero-title">One detail is wrong. <em>How fast can you see it?</em></h1>
          <p className="hero__lede">
            Scan code-generated patterns, find each single anomaly, and keep
            your focus alive as the timer tightens.
          </p>
          <div className="button-row">
            <Link className="button button--primary button--large" href="/focus">
              Start Focus Run <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button--secondary button--large" href="/play">
              Play five boards
            </Link>
          </div>
          <ul className="trust-row" aria-label="Game benefits">
            <li>No sign-up</li>
            <li>No AI bill</li>
            <li>Infinite seeds</li>
          </ul>
        </div>

        <div className="hero-card-wrap hero-card-wrap--pixel">
          <div className="scan-card">
            <div className="scan-card__meta"><span>Generated locally</span><strong>15.0</strong></div>
            <DemoBoard />
            <p>Can you spot it?</p>
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Game facts">
        <div className="shell metric-strip__grid">
          <p><strong>03</strong><span>focus charges</span></p>
          <p><strong>05</strong><span>boards per checkpoint</span></p>
          <p><strong>12s</strong><span>minimum timer</span></p>
          <p><strong>∞</strong><span>deterministic boards</span></p>
        </div>
      </section>

      <section className="how-strip how-strip--dark" aria-labelledby="how-title">
        <div className="shell">
          <p className="section-kicker">Protocol</p>
          <h2 id="how-title">Scan. Decide. Commit.</h2>
          <ol className="step-grid">
            <li>
              <span className="step-number">1</span>
              <div><h3>Read the system</h3><p>Every cell follows a visual rule except one carefully generated outlier.</p></div>
            </li>
            <li>
              <span className="step-number">2</span>
              <div><h3>Find the break</h3><p>Inspect alignment, rotation, spacing, shape, or signal before time expires.</p></div>
            </li>
            <li>
              <span className="step-number">3</span>
              <div><h3>Tap with confidence</h3><p>Correct taps stop the clock. Wrong taps stay on the record and the scan continues.</p></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section shell" aria-labelledby="category-title">
        <div className="section-heading">
          <div><p className="section-kicker">Pattern library</p><h2 id="category-title">Different systems. One broken rule.</h2></div>
          <Link className="text-link" href="/categories">Enter the pattern lab <span aria-hidden="true">→</span></Link>
        </div>
        <div className="pattern-grid">
          {patternFamilies.map((pattern) => (
            <article className="pattern-card" key={pattern.name}>
              <span>{pattern.code}</span>
              <div className={`pattern-card__glyph pattern-card__glyph--${pattern.name.toLowerCase()}`} aria-hidden="true"><i /><i /><i /></div>
              <h3>{pattern.name}</h3>
              <p>{pattern.note}</p>
            </article>
          ))}
        </div>
      </section>

      <AdSlot className="shell ad-slot--home" />

      <section className="section shell split-feature split-feature--pixel" aria-labelledby="engine-title">
        <div className="split-feature__art" aria-hidden="true">
          <div className="seed-sheet">
            <span>SEED / 4F9-A7C</span>
            <strong>Same seed.<br />Same puzzle.</strong>
            <div className="seed-lines"><i /><i /><i /><i /></div>
            <b>ZERO IMAGE REQUESTS</b>
          </div>
        </div>
        <div className="split-feature__copy">
          <p className="section-kicker">The free generation engine</p>
          <h2 id="engine-title">Procedural, not generative.</h2>
          <p>Curated geometry, palettes, layouts, and mutations are combined by a seeded algorithm. Challenge links carry the seed—not an uploaded image—so the same board rebuilds instantly on another device.</p>
          <Link className="button button--secondary" href="/about">See the technical approach</Link>
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="reading-shell">
          <p className="section-kicker">System notes</p>
          <h2 id="faq-title">Before your first scan</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta shell" aria-labelledby="cta-title">
        <div className="target-lock" aria-hidden="true"><i /></div>
        <h2 id="cta-title">Your eyes are already searching.</h2>
        <p>Give them something worth finding.</p>
        <Link className="button button--signal button--large" href="/focus">Begin a Focus Run <span aria-hidden="true">→</span></Link>
      </section>
    </>
  );
}
