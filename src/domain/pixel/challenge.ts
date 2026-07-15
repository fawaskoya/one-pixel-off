import {
  CHALLENGE_TOKEN_MAX_LENGTH,
  PIXEL_GENERATION_VERSION,
} from "./constants";
import { normalizePixelSeed } from "./generator";
import { xmur3 } from "./prng";
import type {
  ChallengePayloadV1,
  PixelDomainResult,
} from "./types";

const TOKEN_PREFIX = "opo1";
const TOKEN_CHARACTERS = /^[A-Za-z0-9._-]+$/;
const BASE64URL_CHARACTERS = /^[A-Za-z0-9_-]+$/;
const BASE64URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export type DecodedPixelChallenge = Readonly<{
  seed: string;
  generationVersion: 1;
  tokenId: string;
}>;

function invalidToken(message = "Challenge token is invalid.") {
  return { code: "TOKEN_INVALID" as const, message };
}

function encodeBytes(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] as number;
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const block =
      (first << 16) | ((second ?? 0) << 8) | (third ?? 0);
    output += BASE64URL_ALPHABET[(block >>> 18) & 63];
    output += BASE64URL_ALPHABET[(block >>> 12) & 63];
    if (second !== undefined) {
      output += BASE64URL_ALPHABET[(block >>> 6) & 63];
    }
    if (third !== undefined) {
      output += BASE64URL_ALPHABET[block & 63];
    }
  }
  return output;
}

function decodeBytes(value: string): Uint8Array | null {
  if (
    value.length === 0 ||
    value.length % 4 === 1 ||
    !BASE64URL_CHARACTERS.test(value)
  ) {
    return null;
  }
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const chunk = value.slice(index, index + 4);
    const indexes = [...chunk].map((character) =>
      BASE64URL_ALPHABET.indexOf(character),
    );
    if (indexes.some((item) => item < 0)) {
      return null;
    }
    const block =
      ((indexes[0] as number) << 18) |
      ((indexes[1] as number) << 12) |
      ((indexes[2] ?? 0) << 6) |
      (indexes[3] ?? 0);
    bytes.push((block >>> 16) & 255);
    if (chunk.length >= 3) {
      bytes.push((block >>> 8) & 255);
    }
    if (chunk.length === 4) {
      bytes.push(block & 255);
    }
  }
  const decoded = Uint8Array.from(bytes);
  return encodeBytes(decoded) === value ? decoded : null;
}

function checksumFor(payloadSegment: string): string {
  const high = xmur3(`opo-checksum-a|${payloadSegment}`)()
    .toString(16)
    .padStart(8, "0");
  const low = xmur3(`opo-checksum-b|${payloadSegment}`)()
    .toString(16)
    .padStart(8, "0");
  return `${high}${low}`;
}

function equalStringsConstantWork(left: string, right: string): boolean {
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function encodePixelChallengeToken(
  seedInput: string,
): PixelDomainResult<string> {
  const seed = normalizePixelSeed(seedInput);
  if (seed === null) {
    return {
      ok: false,
      error: { code: "INVALID_SEED", message: "Seed cannot be shared." },
    };
  }
  const payload: ChallengePayloadV1 = {
    v: 1,
    g: PIXEL_GENERATION_VERSION,
    s: seed,
  };
  const json = JSON.stringify(payload);
  const payloadSegment = encodeBytes(new TextEncoder().encode(json));
  const token = `${TOKEN_PREFIX}.${payloadSegment}.${checksumFor(payloadSegment)}`;
  if (token.length > CHALLENGE_TOKEN_MAX_LENGTH) {
    return {
      ok: false,
      error: { code: "INVALID_SEED", message: "Seed cannot be shared." },
    };
  }
  return { ok: true, value: token };
}

export function decodePixelChallengeToken(
  token: unknown,
): PixelDomainResult<DecodedPixelChallenge> {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > CHALLENGE_TOKEN_MAX_LENGTH ||
    !TOKEN_CHARACTERS.test(token)
  ) {
    return { ok: false, error: invalidToken() };
  }
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return { ok: false, error: invalidToken() };
  }
  const [prefix, payloadSegment, suppliedChecksum] = parts as [
    string,
    string,
    string,
  ];
  if (prefix !== TOKEN_PREFIX) {
    return {
      ok: false,
      error: {
        code: "TOKEN_UNSUPPORTED",
        message: "Challenge token version is unsupported.",
      },
    };
  }
  if (
    suppliedChecksum.length !== 16 ||
    !/^[a-f0-9]{16}$/.test(suppliedChecksum) ||
    !equalStringsConstantWork(
      suppliedChecksum,
      checksumFor(payloadSegment),
    )
  ) {
    return { ok: false, error: invalidToken() };
  }
  const bytes = decodeBytes(payloadSegment);
  if (bytes === null || bytes.length > 192) {
    return { ok: false, error: invalidToken() };
  }

  let parsed: unknown;
  try {
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    parsed = JSON.parse(json) as unknown;
  } catch {
    return { ok: false, error: invalidToken() };
  }
  if (!isPlainRecord(parsed)) {
    return { ok: false, error: invalidToken() };
  }
  const keys = Object.keys(parsed).sort();
  if (
    keys.length !== 3 ||
    keys[0] !== "g" ||
    keys[1] !== "s" ||
    keys[2] !== "v" ||
    parsed.v !== 1 ||
    parsed.g !== PIXEL_GENERATION_VERSION
  ) {
    return { ok: false, error: invalidToken() };
  }
  const seed = normalizePixelSeed(parsed.s);
  if (seed === null || seed !== parsed.s) {
    return { ok: false, error: invalidToken() };
  }
  return {
    ok: true,
    value: {
      seed,
      generationVersion: PIXEL_GENERATION_VERSION,
      tokenId: suppliedChecksum,
    },
  };
}
