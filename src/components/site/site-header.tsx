import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <BrandMark />
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/play">Classic five</Link>
          <Link href="/how-to-play">How to play</Link>
          <Link href="/categories">Pattern lab</Link>
          <Link className="button button--small button--signal" href="/focus">
            Focus run
          </Link>
        </nav>

        <details className="mobile-nav">
          <summary>
            <span>Menu</span>
            <span className="mobile-nav__icon" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </summary>
          <nav className="mobile-nav__panel" aria-label="Mobile navigation">
            <Link className="button button--signal" href="/focus">
              Start Focus Run
            </Link>
            <Link href="/play">Classic Five</Link>
            <Link href="/how-to-play">How to play</Link>
            <Link href="/categories">Pattern lab</Link>
            <Link href="/about">About the game</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
