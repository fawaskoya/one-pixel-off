import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site";

type ContentPageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  path: `/${string}`;
  updated?: string;
  children: ReactNode;
};

type ContentSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

type CalloutProps = {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "notice" | "warning";
};

export function ContentPage({
  eyebrow,
  title,
  description,
  path,
  updated,
  children,
}: ContentPageProps) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteConfig.name,
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: absoluteUrl(path),
      },
    ],
  } as const;

  return (
    <div className="content-shell">
      <JsonLd data={breadcrumbData} />
      <div className="content-shell__inner">
        <article>
          <nav className="content-breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          <header className="content-header">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            <p className="content-header__lede">{description}</p>
            {updated ? (
              <p className="content-header__updated">
                Effective date: <time dateTime="2026-07-15">{updated}</time>
              </p>
            ) : null}
          </header>

          <div className="content-body">{children}</div>
        </article>

        <nav className="content-footer-nav" aria-label="More information">
          <ul>
            {[
              ["/how-to-play", "How to play"],
              ["/categories", "Pattern lab"],
              ["/about", "About"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function ContentSection({ id, title, children }: ContentSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section className="content-section" id={id} aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

export function Callout({ title, children, tone = "neutral" }: CalloutProps) {
  return (
    <aside className="content-callout" data-tone={tone}>
      <h2>{title}</h2>
      {children}
    </aside>
  );
}

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="inline-link" href={href}>
      {children}
    </Link>
  );
}

export function PrimaryContentLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="button button--primary" href={href}>
      {children}
    </Link>
  );
}
