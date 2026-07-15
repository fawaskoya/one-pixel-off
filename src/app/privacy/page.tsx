import type { Metadata } from "next";
import {
  Callout,
  ContentPage,
  ContentSection,
  InlineLink,
} from "@/components/content";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "Read the launch-stage privacy notice for One Pixel Off, including local scores, hosting logs, optional analytics, and future advertising.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Launch-stage template"
      title="Privacy notice"
      description="This draft explains the intended data practices for the first web release. It must be reviewed against the final domain, operator, hosting, analytics, consent, and advertising setup before public launch."
      updated="July 15, 2026"
    >
      <Callout title="Review required before launch" tone="warning">
        <p>
          This page is a product and engineering template, not legal advice. The site owner must add the legal
          operator&apos;s identity and jurisdiction, confirm every service that actually receives data, provide a
          monitored privacy contact, and obtain appropriate professional review.
        </p>
      </Callout>

      <ContentSection id="summary" title="Plain-language summary">
        <ul className="list-disc space-y-3 pl-6 marker:text-[#6d4aff]">
          <li>You can play without an account.</li>
          <li>The game does not request camera, microphone, photo-library, or location access.</li>
          <li>Basic game progress and preferences may be stored locally in your browser on your device.</li>
          <li>Normal web hosting can process technical request data such as an IP address and browser details.</li>
          <li>Non-essential analytics and advertising are not part of the initial local build and must not be activated without updating this notice and implementing any required choices or consent.</li>
        </ul>
      </ContentSection>

      <ContentSection id="operator" title="Who is responsible">
        <p>
          The public version must name the person or organization that operates the final domain and acts as the
          data controller or business where those terms apply. That information has not yet been inserted into this
          launch template. Use the <InlineLink href="/contact">contact page</InlineLink> for the current project
          contact route.
        </p>
      </ContentSection>

      <ContentSection id="local-data" title="Data kept on your device">
        <p>
          The game may use browser storage for completed-session counts, rounds found, total score, best score,
          and completed Daily Scan dates. These values remain on your device unless a future feature clearly says
          otherwise. A board seed can also appear in a challenge URL that you choose to share.
        </p>
        <p>
          You can remove local data through the game&apos;s settings when that control is available, or by clearing site
          data in your browser. Blocking browser storage may disable saved preferences or history while leaving core
          play available.
        </p>
      </ContentSection>

      <ContentSection id="not-collected" title="What the game is not designed to collect">
        <p>
          The MVP does not need an account, player name, contact list, precise location, photo upload, or microphone
          recording. Puzzles are generated from numeric rules rather than personal images. Do not place personal or
          sensitive information in feedback messages or challenge links.
        </p>
      </ContentSection>

      <ContentSection id="hosting" title="Hosting and security logs">
        <p>
          Like most websites, the final hosting and security providers may automatically process IP addresses,
          timestamps, requested pages, device or browser information, referring pages, and error or security signals.
          These records are generally used to deliver the site, prevent abuse, diagnose failures, and protect the
          service. Before launch, the owner must name the actual providers, document lawful purposes, and set suitable
          retention periods.
        </p>
      </ContentSection>

      <ContentSection id="sharing" title="Challenge links and sharing">
        <p>
          A challenge link encodes a versioned puzzle seed and integrity checksum so another player can reconstruct
          the same five boards. It does not need a player name, result, email address, or contact identity. Once you
          send a link through another app, that app handles it under its own privacy terms.
        </p>
      </ContentSection>

      <ContentSection id="analytics" title="Optional analytics and error measurement">
        <p>
          Privacy-approved analytics may be added later to measure broad events such as a game start, completed round,
          or error category. The intended event design excludes puzzle seeds, free text, names, email addresses,
          precise location, contacts, and full challenge URLs. If analytics are enabled, this notice must identify
          the provider, data fields, retention, legal basis, and applicable consent or opt-out controls before data
          collection begins.
        </p>
      </ContentSection>

      <ContentSection id="advertising" title="Advertising and cookies">
        <p>
          Advertising is not active in the initial local build, and timed gameplay is designed to remain ad-free.
          If the public site later uses Google AdSense or another ad service, vendors may use cookies, local storage,
          IP addresses, device identifiers, and activity data to deliver, limit, measure, or personalize ads depending
          on the configuration and your choices.
        </p>
        <p>
          Before any ad request, the owner must update this page with the actual vendors and purposes, configure a
          suitable consent-management platform where required, provide a way to revisit privacy choices, and review
          regional obligations. An ad platform&apos;s technical approval does not replace the owner&apos;s legal review.
        </p>
      </ContentSection>

      <ContentSection id="retention" title="Retention and deletion">
        <p>
          Local game data remains until the game or browser clears it, storage expires, or you remove site data.
          Hosting, security, analytics, and advertising retention cannot be finalized until those providers and
          configurations are selected. The public notice must replace this paragraph with verified retention periods
          or clear criteria for deciding them.
        </p>
      </ContentSection>

      <ContentSection id="rights" title="Your choices and rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, restrict, or object to certain
          processing, withdraw consent, or appeal a decision. The public site must explain which rights apply, how to
          exercise them, how identity will be verified, and whether a regulator can be contacted. For now, use the
          <InlineLink href="/contact"> project contact route</InlineLink> and do not include sensitive identification
          documents unless the operator provides a secure, verified process.
        </p>
      </ContentSection>

      <ContentSection id="audience" title="Audience and children">
        <p>
          The game is intended for a general audience and is not designed or marketed primarily to children. Family-
          friendly visuals do not by themselves make the service child-directed. A future classroom, children&apos;s, or
          store-app release requires a separate audience, privacy, safety, and advertising review.
        </p>
      </ContentSection>

      <ContentSection id="changes" title="Changes to this notice">
        <p>
          Material changes should be reflected here with a new effective date and, when appropriate, an in-product
          notice or renewed choice. The owner should keep a dated record of the services and settings reviewed for each
          version.
        </p>
      </ContentSection>

      <ContentSection id="contact" title="Privacy contact">
        <p>
          Visit the <InlineLink href="/contact">contact page</InlineLink> for privacy questions. Before public launch,
          the temporary address there must be replaced with a monitored mailbox and this notice must identify the
          responsible operator.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
