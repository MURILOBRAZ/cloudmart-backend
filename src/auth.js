import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 12);

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("ADMIN_PASSWORD is not set, admin routes are unavailable.");
  return value;
}

function sign(expiresAt) {
  return createHmac("sha256", secret()).update(String(expiresAt)).digest("base64url");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Creates an opaque token "<expiry>.<hmac>" that only this server can forge. */
export function createToken() {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return { token: `${expiresAt}.${sign(expiresAt)}`, expiresAt };
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set, admin routes are unavailable.");
  return typeof password === "string" && safeEqual(password, expected);
}

/** Express middleware: requires a valid, unexpired token in the Authorization header. */
export function requireAdmin(req, res, next) {
  const token = (req.get("authorization") || "").replace(/^Bearer /, "");
  const [expiresAt, signature] = token.split(".");

  if (!expiresAt || !signature || !safeEqual(signature, sign(expiresAt))) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  if (Number(expiresAt) < Date.now()) {
    return res.status(401).json({ error: "Session expired, please sign in again" });
  }
  next();
}
