/** Pinned xmur3 implementation. Changing it requires a generation-version bump. */
export function xmur3(input: string): () => number {
  const normalized = input.normalize("NFC");
  let hash = 1779033703 ^ normalized.length;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = Math.imul(hash ^ normalized.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return hash >>> 0;
  };
}

/** Pinned mulberry32 implementation. Changing it requires a generation bump. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeededRandom = () => number;

export function createSeededRandom(seed: string): SeededRandom {
  return mulberry32(xmur3(seed)());
}

export function randomInteger(
  random: SeededRandom,
  minimum: number,
  maximum: number,
): number {
  if (
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum) ||
    minimum > maximum
  ) {
    throw new RangeError("randomInteger requires an ordered integer range");
  }
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export function chooseOne<T>(
  random: SeededRandom,
  values: readonly T[],
): T {
  if (values.length === 0) {
    throw new RangeError("chooseOne requires at least one value");
  }
  return values[randomInteger(random, 0, values.length - 1)] as T;
}

export function stableSeedHash(seed: string): string {
  return xmur3(seed)().toString(36).padStart(7, "0");
}
