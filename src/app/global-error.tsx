"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("Global application error", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", margin: 0, padding: 32, display: "grid", placeItems: "center", background: "#090C11", color: "#F2EFE5", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <main style={{ width: "min(650px, 100%)" }}>
          <p style={{ color: "#C8FF38", fontFamily: "monospace", fontWeight: 800, letterSpacing: 2 }}>ONE PIXEL OFF / RECOVERY</p>
          <h1 style={{ margin: "18px 0", fontSize: "clamp(2.5rem, 8vw, 5rem)", letterSpacing: "-0.055em", lineHeight: 0.95 }}>The application hit an unexpected stop.</h1>
          <p style={{ color: "#AAB1BD", fontSize: "1.1rem", lineHeight: 1.6 }}>No score was invented or sent away. Reload the safe shell or return home.</p>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" onClick={reset} style={{ minHeight: 50, padding: "12px 22px", border: "1px solid #C8FF38", borderRadius: 8, background: "#C8FF38", color: "#0D1016", fontWeight: 800 }}>Try again</button>
            <button type="button" onClick={() => window.location.assign("/")} style={{ minHeight: 50, padding: "12px 22px", border: "1px solid #F2EFE5", borderRadius: 8, background: "transparent", color: "#F2EFE5", fontWeight: 800 }}>Back home</button>
          </div>
        </main>
      </body>
    </html>
  );
}
