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
      </div>
    </header>
  );
}
