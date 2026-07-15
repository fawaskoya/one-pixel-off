let fallbackCounter = 0;

export function createUniqueId(prefix: "session" | "phase"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  fallbackCounter += 1;
  const random = Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now().toString(36)}_${fallbackCounter.toString(36)}_${random}`;
}

export function createSelectionSeed(): string {
  const id = createUniqueId("session");
  return `nff|quick|1|${id}`;
}
