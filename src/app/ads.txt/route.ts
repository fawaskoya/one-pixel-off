const publisherId = process.env.ADSENSE_PUBLISHER_ID;
const isValidPublisherId = /^pub-\d{10,20}$/.test(publisherId ?? "");

export function GET() {
  const body = isValidPublisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense publisher record is intentionally disabled until site approval.\n";

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
