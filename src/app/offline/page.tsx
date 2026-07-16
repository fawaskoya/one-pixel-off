import {
  Callout,
  ContentPage,
  ContentSection,
  InlineLink,
  PrimaryContentLink,
} from "@/components/content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "You Are Offline",
  description: "Offline recovery options for the One Pixel Off browser game.",
  path: "/offline",
  noIndex: true,
});

export default function OfflinePage() {
  return (
    <ContentPage
      path="/offline"
      eyebrow="Connection paused"
      title="You’re offline"
      description="Puzzle generation needs no network, but the application shell must have been saved by your browser during an earlier visit."
    >
      <Callout title="What may still work" tone="notice">
        <p>
          If the play route and game files are cached, the browser can still
          generate Quick Scan boards locally. A first visit or an uncached
          challenge needs one successful connection before it can open.
        </p>
      </Callout>
      <ContentSection id="limits" title="While offline">
        <ul>
          <li>uncached pages and new challenge routes may not open;</li>
          <li>sharing through online services can wait or fail;</li>
          <li>network-only analytics or advertising remain unavailable; and</li>
          <li>clearing browser storage removes locally held scores.</li>
        </ul>
      </ContentSection>
      <ContentSection id="recovery" title="Try this">
        <ol>
          <li>Check Wi-Fi or mobile data, then retry the home page.</li>
          <li>If you played here before, open the play screen and try a Quick Scan.</li>
          <li>Keep a failed challenge link and reopen it after reconnecting.</li>
        </ol>
      </ContentSection>
      <div className="button-row">
        <PrimaryContentLink href="/play">Try local play</PrimaryContentLink>
        <InlineLink href="/">Try the home page</InlineLink>
      </div>
    </ContentPage>
  );
}
