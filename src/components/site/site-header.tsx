import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <BrandMark />
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/how-to-play">How to play</Link>
          <Link href="/categories">Pattern lab</Link>
          <Link className="button button--small button--signal" href="/play">
            Start scan
          </Link>
        </nav>
      </div>
    </header>
  );
}
