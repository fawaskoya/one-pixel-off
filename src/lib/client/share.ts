export type ShareOutcome =
  | "shared"
  | "copied"
  | "cancelled"
  | "manual-copy-required";

function isUserCancellation(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "NotAllowedError")
  );
}

async function shareWithFallback(
  shareData: Readonly<{ title: string; text: string; url: string }>,
): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (isUserCancellation(error)) {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    return "copied";
  } catch {
    return "manual-copy-required";
  }
}

export async function shareChallenge(
  url: string,
  score: number,
): Promise<ShareOutcome> {
  return shareWithFallback({
    title: "One Pixel Off challenge",
    text: `I scored ${score} in One Pixel Off. Can your eyes beat mine?`,
    url,
  });
}

export async function shareFocusRun(
  url: string,
  score: number,
  boardsCleared: number,
): Promise<ShareOutcome> {
  return shareWithFallback({
    title: "One Pixel Off Focus Run",
    text: `I cleared ${boardsCleared} board${boardsCleared === 1 ? "" : "s"} and scored ${score}. How deep can you go?`,
    url,
  });
}
