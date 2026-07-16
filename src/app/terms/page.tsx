import {
  Callout,
  ContentPage,
  ContentSection,
  InlineLink,
} from "@/components/content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Terms of Use",
  description:
    "Read the launch-stage terms template for using the One Pixel Off visual puzzle game, local scores, and challenges.",
  path: "/terms",
  noIndex: true,
});

export default function TermsPage() {
  return (
    <ContentPage
      path="/terms"
      eyebrow="Launch-stage template"
      title="Terms of use"
      description="These draft terms describe the intended rules for the first web release. They are not final until the site owner, legal operator, domain, jurisdiction, and service configuration are confirmed."
      updated="July 15, 2026"
    >
      <Callout title="Owner and legal review required" tone="warning">
        <p>
          This is a planning template, not legal advice and not a substitute for terms prepared or approved for the
          actual operator. Before publication, replace every unresolved operator and jurisdiction statement, verify
          that the terms match the product, and obtain appropriate professional review.
        </p>
      </Callout>

      <ContentSection id="agreement" title="Using the service">
        <p>
          The final terms should identify the legal operator and explain that accessing or using One Pixel Off means
          accepting the published terms and privacy notice. If a player does not agree, they should not use the
          service. This draft cannot supply the operator identity that a final agreement requires.
        </p>
      </ContentSection>

      <ContentSection id="game" title="What the game provides">
        <p>
          One Pixel Off is a browser-based entertainment game. It presents timed visual puzzles and calculates local scores.
          It does not promise educational assessment, factual certification, prizes, employment results, or official
          rankings.
        </p>
        <p>
          Generated puzzles and scores are recreational, not tests of vision, cognition, or health. Results may be
          affected by display quality, browser timing, zoom, accessibility settings, software errors, or altered links.
        </p>
      </ContentSection>

      <ContentSection id="eligibility" title="Audience and supervision">
        <p>
          The intended launch is for a general audience, not a service directed primarily to children. The final terms
          must state any minimum age, parental-permission rule, and regional eligibility requirement that applies to the
          operator and launch markets. Adults supervising younger players should review the game and device use for their
          group.
        </p>
      </ContentSection>

      <ContentSection id="acceptable-use" title="Acceptable use">
        <p>You may use the service for personal, lawful play. You must not:</p>
        <ul className="list-disc space-y-3 pl-6 marker:text-[#ef6a5b]">
          <li>interfere with the service, probe it for vulnerabilities, or bypass reasonable security and rate limits;</li>
          <li>use automated requests, scraping, or traffic schemes that degrade the service or manipulate analytics or advertising;</li>
          <li>send altered, deceptive, malicious, or privacy-invasive challenge links;</li>
          <li>copy or redistribute a substantial part of the authored pattern system as a competing product;</li>
          <li>use the game to harass, shame, discriminate against, or endanger another person; or</li>
          <li>use the service while driving or in another situation where distraction is unsafe.</li>
        </ul>
      </ContentSection>

      <ContentSection id="content" title="Puzzles, feedback, and reports">
        <p>
          Pattern families and difficulty ranges may change as the generator is reviewed. If a board seems ambiguous,
          inaccessible, unsafe, or infringing, report it through the <InlineLink href="/contact">contact page</InlineLink>.
          Include its puzzle code when available, but no unnecessary personal information.
        </p>
        <p>
          The final terms should explain any license granted for submitted suggestions and how intellectual-property
          complaints are handled. Until that process is approved, do not submit confidential ideas or material you do
          not have permission to share.
        </p>
      </ContentSection>

      <ContentSection id="availability" title="Availability and changes">
        <p>
          Features, patterns, scores, links, or the entire service may change, pause, or stop. The operator should try to
          preserve a playable experience but cannot promise uninterrupted, error-free, or permanently available access.
          Unsupported, malformed, or retired challenge links may fall back to a normal game.
        </p>
      </ContentSection>

      <ContentSection id="third-parties" title="Third-party services">
        <p>
          Hosting, sharing destinations, analytics, consent tools, or advertising providers may operate under their own
          terms. The public version must identify material integrations and ensure that the privacy notice describes
          their data use. No advertising service is active in the initial local build.
        </p>
      </ContentSection>

      <ContentSection id="ownership" title="Ownership and permissions">
        <p>
          The final operator should state who owns or licenses the game name, interface, code, writing, pattern catalog,
          and other materials, together with the limited permission players receive to use the service. This template
          does not assert ownership on behalf of an unnamed entity.
        </p>
      </ContentSection>

      <ContentSection id="disclaimers" title="Disclaimers and liability">
        <p>
          Any warranty disclaimer, limitation of liability, indemnity, consumer-rights exception, and remedy language
          is jurisdiction-sensitive. Those clauses must be drafted or approved for the actual operator and must not
          exclude rights that cannot legally be excluded. They are intentionally not invented in this template.
        </p>
      </ContentSection>

      <ContentSection id="law" title="Governing law and disputes">
        <p>
          The public terms must name an appropriate governing law, forum, and dispute process only after the operator
          and launch jurisdictions are known. Do not publish a guessed location or arbitration requirement.
        </p>
      </ContentSection>

      <ContentSection id="changes" title="Changes to these terms">
        <p>
          The operator may update the final terms as the service changes. Material updates should receive a new
          effective date and suitable notice. Continued-use language and any required renewed acceptance must be checked
          for the applicable law.
        </p>
      </ContentSection>

      <ContentSection id="contact" title="Questions">
        <p>
          Use the <InlineLink href="/contact">contact page</InlineLink> for questions. A monitored legal contact and
          operator details must replace the temporary launch information before these terms are published as final.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
