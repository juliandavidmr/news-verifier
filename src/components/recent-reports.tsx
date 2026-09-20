import type { PublicReportListing } from "../domain/public-report-listing";
import type { SupportedLocale } from "../domain/reports";
import { messages } from "../lib/i18n";

export function RecentReports({
  locale,
  reports,
}: {
  locale: SupportedLocale;
  reports: PublicReportListing[];
}) {
  if (reports.length < 3) return null;
  const copy = messages[locale];

  return (
    <section className="recent-reports" aria-labelledby="recent-reports-title">
      <div className="section-heading">
        <h2 id="recent-reports-title">{copy.recentReportsTitle}</h2>
        <p>{copy.recentReportsDescription}</p>
      </div>
      <div className="recent-reports-grid">
        {reports.map((report) => (
          <a
            className="recent-report-card"
            href={`/r/${report.shortId}`}
            key={report.shortId}
          >
            <h3>{report.title}</h3>
            <div className="recent-report-meta">
              <span>{report.sourceHostname}</span>
              <time dateTime={report.completedAt} suppressHydrationWarning>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                }).format(new Date(report.completedAt))}
              </time>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
