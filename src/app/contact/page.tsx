import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout, ContentPage, ContentSection } from "@/components/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact One Pixel Off about a reproducible puzzle, accessibility, privacy, support, or launch feedback.",
  alternates: { canonical: "/contact" },
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

function ContactLink({ subject, children }: { subject: string; children: ReactNode }) {
  if (!contactEmail) return <strong>{children}</strong>;
  return (
    <a className="inline-link" href={`mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`}>
      {children}
    </a>
  );
}

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Reports and support"
      title="Contact the pattern lab"
      description="A puzzle code, device, and short sequence of events are usually enough to reproduce a problem. Please leave other people’s personal information out of your message."
    >
      <Callout title="Development contact status" tone="warning">
        <p>
          The project does not yet have its final public support mailbox. A
          monitored domain address must be configured before launch; this build
          never sends a report to a placeholder inbox.
        </p>
      </Callout>

      <ContentSection id="contact-options" title="Choose a subject">
        <ul>
          <li><ContactLink subject="One Pixel Off — ambiguous puzzle">Report a puzzle</ContactLink> — include the board code, round, and what looked ambiguous.</li>
          <li><ContactLink subject="One Pixel Off — accessibility feedback">Share accessibility feedback</ContactLink> — mention the browser, device, assistive technology, and difficult step.</li>
          <li><ContactLink subject="One Pixel Off — privacy question">Ask a privacy question</ContactLink> — do not send identity documents until a verified secure route exists.</li>
          <li><ContactLink subject="One Pixel Off — bug report">Report a bug</ContactLink> — include what you expected, what happened, and whether retrying changed it.</li>
          <li><ContactLink subject="One Pixel Off — general feedback">Send general feedback</ContactLink> — ideas about difficulty, patterns, or game feel are welcome.</li>
        </ul>
      </ContentSection>

      <ContentSection id="address" title="Current project address">
        <p>
          {contactEmail ? (
            <>Email: <a className="inline-link" href={`mailto:${contactEmail}`}>{contactEmail}</a></>
          ) : (
            "Support mailbox: not configured in this development build."
          )}
        </p>
      </ContentSection>

      <ContentSection id="useful-report" title="What makes a useful report">
        <ul>
          <li>the route and round where the issue occurred;</li>
          <li>the visible puzzle ID or challenge integrity code, when available;</li>
          <li>your browser and device type, without account or serial details;</li>
          <li>what you expected and what happened; and</li>
          <li>a screenshot only after checking it for notifications or personal data.</li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
