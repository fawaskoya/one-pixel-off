import Link from "next/link";

export default function NotFound() {
  return (
    <section className="pixel-play-page">
      <div className="pixel-game-shell">
        <div className="pixel-panel">
          <p className="eyebrow">Route anomaly / 404</p>
          <h1 className="pixel-title">This page is off-grid.</h1>
          <p className="pixel-copy">
            The address may be mistyped, retired, or an incomplete challenge link.
          </p>
          <div className="game-actions">
            <Link className="button button--signal" href="/play">Start a fresh scan</Link>
            <Link className="button button--secondary" href="/">Back home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
