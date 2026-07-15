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

export async function shareChallenge(
  url: string,
  score: number,
): Promise<ShareOutcome> {
  const shareData = {
    title: "One Pixel Off challenge",
    text: `I scored ${score} in One Pixel Off. Can your eyes beat mine?`,
    url,
  };

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
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "manual-copy-required";
  }
}
