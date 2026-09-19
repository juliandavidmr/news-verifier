import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const visitorCookieName = "nv_visitor";

function signingSecret() {
  const secret =
    process.env.VISITOR_SIGNING_SECRET ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DATABASE_URL;
  if (!secret) throw new Error("VISITOR_SIGNING_SECRET is not configured");
  return secret;
}

function digest(purpose: string, value: string) {
  return createHmac("sha256", signingSecret())
    .update(`${purpose}\0${value}`)
    .digest("base64url");
}

function signVisitorId(visitorId: string) {
  return `${visitorId}.${digest("visitor-cookie", visitorId)}`;
}

function verifiedVisitorId(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  const separator = cookieValue.lastIndexOf(".");
  if (separator < 1) return null;
  const visitorId = cookieValue.slice(0, separator);
  const signature = cookieValue.slice(separator + 1);
  const expected = digest("visitor-cookie", visitorId);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return null;
  }
  return visitorId;
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [candidate, ...value] = part.trim().split("=");
    if (candidate === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function requestAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function resolveAnonymousIdentity(request: Request, now = new Date()) {
  const existing = verifiedVisitorId(cookieValue(request, visitorCookieName));
  const visitorId = existing ?? randomBytes(24).toString("base64url");
  const usageDate = now.toISOString().slice(0, 10);
  return {
    visitorKey: digest("visitor-key", visitorId),
    networkKey: digest(
      "network-key",
      `${usageDate}\0${requestAddress(request)}`,
    ),
    cookie: existing ? null : signVisitorId(visitorId),
  };
}
