import crypto from "node:crypto";

const TTL_MS = 10 * 60 * 1000;
const VERSION = "v1";

function getSecret(): string {
  const secret = process.env.CHAT_STATE_SECRET;
  if (!secret) {
    throw new Error("CHAT_STATE_SECRET is required to sign chat state");
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

function hmac(payload: string): string {
  return b64url(
    crypto.createHmac("sha256", getSecret()).update(payload).digest()
  );
}

export function signState<T>(state: T, userId: string): string {
  const envelope = {
    v: VERSION,
    uid: userId,
    exp: Date.now() + TTL_MS,
    state,
  };
  const payload = b64url(Buffer.from(JSON.stringify(envelope), "utf8"));
  return `${payload}.${hmac(payload)}`;
}

export function verifyState<T>(token: unknown, userId: string): T | null {
  if (typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(payload);

  if (sig.length !== expected.length) return null;
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  let envelope: { v: unknown; uid: unknown; exp: unknown; state: T };
  try {
    envelope = JSON.parse(fromB64url(payload).toString("utf8"));
  } catch {
    return null;
  }
  if (envelope.v !== VERSION) return null;
  if (envelope.uid !== userId) return null;
  if (typeof envelope.exp !== "number" || envelope.exp < Date.now()) return null;
  return envelope.state;
}
