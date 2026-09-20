export const REPORT_REMOVAL_EMAIL = "news-verifier.securely376@silomails.com";

export function reportRemovalMailto({
  shortId,
  reportUrl,
  subject,
  body,
}: {
  shortId: string;
  reportUrl: string;
  subject: string;
  body: string;
}) {
  const parameters = new URLSearchParams({
    subject: `${subject} ${shortId}`,
    body: `${body}\n\n${reportUrl}`,
  });
  return `mailto:${REPORT_REMOVAL_EMAIL}?${parameters.toString()}`;
}
