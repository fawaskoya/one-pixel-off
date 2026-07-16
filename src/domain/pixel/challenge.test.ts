import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import {
  CHALLENGE_TOKEN_MAX_LENGTH,
  createSeededRandom,
  decodePixelChallengeToken,
  encodePixelChallengeToken,
  xmur3,
} from "./index";

function checksumFor(payloadSegment: string): string {
  const high = xmur3(`opo-checksum-a|${payloadSegment}`)()
    .toString(16)
    .padStart(8, "0");
  const low = xmur3(`opo-checksum-b|${payloadSegment}`)()
    .toString(16)
    .padStart(8, "0");
  return `${high}${low}`;
}

function tokenFromBytes(bytes: Uint8Array, prefix = "opo1"): string {
  const payload = Buffer.from(bytes).toString("base64url");
  return `${prefix}.${payload}.${checksumFor(payload)}`;
}

function tokenFromJson(value: unknown, prefix = "opo1"): string {
  return tokenFromBytes(Buffer.from(JSON.stringify(value), "utf8"), prefix);
}

function expectEncoded(seed: string): string {
  const result = encodePixelChallengeToken(seed);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

describe("challenge tokens", () => {
  it("round-trips only an opaque seed and generation versions", () => {
    const token = expectEncoded("opaque-seed-001");
    const decoded = decodePixelChallengeToken(token);
    expect(decoded).toEqual({
      ok: true,
      value: {
        seed: "opaque-seed-001",
        generationVersion: 2,
        tokenId: token.split(".")[2],
      },
    });

    const payloadJson = Buffer.from(token.split(".")[1]!, "base64url").toString(
      "utf8",
    );
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    expect(Object.keys(payload)).toEqual(["v", "g", "s"]);
    expect(payload).not.toHaveProperty("userId");
    expect(payload).not.toHaveProperty("score");
    expect(payload).not.toHaveProperty("name");
  });

  it("is deterministic and contains no padding", () => {
    const first = expectEncoded("repeatable-seed");
    const second = expectEncoded("repeatable-seed");
    expect(second).toBe(first);
    expect(first).toMatch(/^opo1\.[A-Za-z0-9_-]+\.[a-f0-9]{16}$/);
    expect(first).not.toContain("=");
  });

  it("accepts the maximum seed and rejects one byte beyond it", () => {
    const boundary = "x".repeat(96);
    const token = expectEncoded(boundary);
    expect(token.length).toBeLessThanOrEqual(CHALLENGE_TOKEN_MAX_LENGTH);
    expect(decodePixelChallengeToken(token)).toMatchObject({
      ok: true,
      value: { seed: boundary },
    });
    expect(encodePixelChallengeToken("x".repeat(97))).toMatchObject({
      ok: false,
      error: { code: "INVALID_SEED" },
    });
  });

  it("rejects truncation and changes to payload or checksum", () => {
    const token = expectEncoded("tamper-proofing-seed");
    const [prefix, payload, checksum] = token.split(".") as [
      string,
      string,
      string,
    ];
    const replacement = payload[0] === "A" ? "B" : "A";
    const changedPayload = `${replacement}${payload.slice(1)}`;
    for (const candidate of [
      token.slice(0, -1),
      `${prefix}.${changedPayload}.${checksum}`,
      `${prefix}.${payload}.${checksum.slice(0, -1)}0`,
    ]) {
      expect(decodePixelChallengeToken(candidate)).toMatchObject({
        ok: false,
        error: { code: "TOKEN_INVALID" },
      });
    }
  });

  it("rejects unknown prefixes separately from malformed tokens", () => {
    const unsupported = tokenFromJson({ v: 1, g: 2, s: "safe" }, "opo2");
    expect(decodePixelChallengeToken(unsupported)).toMatchObject({
      ok: false,
      error: { code: "TOKEN_UNSUPPORTED" },
    });
    for (const malformed of [
      "",
      "opo1",
      "opo1..deadbeefdeadbeef",
      "opo1.a.b.c",
      " opo1.a.deadbeefdeadbeef",
      "opo1.a!.deadbeefdeadbeef",
      "x".repeat(CHALLENGE_TOKEN_MAX_LENGTH + 1),
    ]) {
      expect(decodePixelChallengeToken(malformed)).toMatchObject({
        ok: false,
        error: { code: "TOKEN_INVALID" },
      });
    }
  });

  it("rejects valid-checksum payloads with extra keys, wrong values, or unsafe seeds", () => {
    const values: unknown[] = [
      { v: 1, g: 2, s: "safe", score: 250 },
      { v: 2, g: 2, s: "safe" },
      { v: 1, g: 1, s: "safe" },
      { v: 1, g: 2, s: 12 },
      { v: 1, g: 2, s: "personal data with spaces" },
      { v: 1, g: 2, s: "cafe\u0301" },
      [1, 2, "safe"],
      null,
    ];
    for (const value of values) {
      expect(decodePixelChallengeToken(tokenFromJson(value))).toMatchObject({
        ok: false,
        error: { code: "TOKEN_INVALID" },
      });
    }
  });

  it("rejects prototype-pollution-shaped, invalid JSON, and invalid UTF-8 payloads", () => {
    const prototypeJson = Buffer.from(
      '{"v":1,"g":2,"s":"safe","__proto__":{"polluted":true}}',
      "utf8",
    );
    const candidates = [
      tokenFromBytes(prototypeJson),
      tokenFromBytes(Buffer.from("{not json", "utf8")),
      tokenFromBytes(Uint8Array.from([0xc3, 0x28])),
      tokenFromBytes(new Uint8Array(193).fill(65)),
    ];
    for (const candidate of candidates) {
      expect(decodePixelChallengeToken(candidate)).toMatchObject({
        ok: false,
        error: { code: "TOKEN_INVALID" },
      });
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("never throws for a deterministic fuzz corpus or non-string input", () => {
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._- !@#$%^&*()";
    const random = createSeededRandom("challenge-token-fuzz-v1");
    const corpus: unknown[] = [
      null,
      undefined,
      0,
      1,
      true,
      {},
      [],
      Symbol("token"),
    ];
    for (let sample = 0; sample < 1_000; sample += 1) {
      const length = Math.floor(random() * 320);
      let value = "";
      for (let index = 0; index < length; index += 1) {
        value += alphabet[Math.floor(random() * alphabet.length)];
      }
      corpus.push(value);
    }
    for (const candidate of corpus) {
      expect(() => decodePixelChallengeToken(candidate)).not.toThrow();
      const result = decodePixelChallengeToken(candidate);
      expect(typeof result.ok).toBe("boolean");
    }
  });
});
