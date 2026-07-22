import crypto from "node:crypto";

const MAX_AGE_MS = 10 * 60 * 1000;

function sign(timestamp: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(timestamp).digest("base64url");
}

export function createState(secret: string): string {
  const timestamp = String(Date.now());
  const signature = sign(timestamp, secret);
  return `${timestamp}.${signature}`;
}

export function verifyState(state: string | null | undefined, secret: string): boolean {
  if (!state) return false;
  const [timestamp, signature] = state.split(".");
  if (!timestamp || !signature) return false;
  if (Date.now() - Number(timestamp) > MAX_AGE_MS) return false;

  const expected = sign(timestamp, secret);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
