"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("Route error", error);
  }, [error]);

  return (
    <section className="pixel-play-page" role="alert">
      <div className="pixel-game-shell">
        <div className="pixel-panel">
          <p className="eyebrow">Render anomaly</p>
          <h1 className="pixel-title">Something slipped out of line.</h1>
          <p className="pixel-copy">
            No result was guessed or submitted. Retry this route or begin a clean local scan.
          </p>
          <div className="game-actions">
            <button className="button button--signal" type="button" onClick={reset}>Try again</button>
            <a className="button button--secondary" href="/play">Start fresh</a>
          </div>
        </div>
      </div>
    </section>
  );
}
