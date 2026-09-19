import { timingSafeEqual } from "node:crypto";

export function matchesBearerToken(
  authorization: string | null,
  secret: string | undefined,
) {
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const candidate = authorization.slice("Bearer ".length);
  const expectedBytes = Buffer.from(secret);
  const candidateBytes = Buffer.from(candidate);
  return (
    expectedBytes.length === candidateBytes.length &&
    timingSafeEqual(expectedBytes, candidateBytes)
  );
}

export function isAuthorizedAdministrator(request: Request) {
  return matchesBearerToken(
    request.headers.get("authorization"),
    process.env.REPORT_ADMIN_TOKEN ?? process.env.CRON_SECRET,
  );
}
