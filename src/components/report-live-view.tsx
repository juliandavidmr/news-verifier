"use client";

import { useEffect, useState } from "react";
import type { ReportEvent } from "../domain/reports";
import { isTerminalStatus } from "../domain/reports";
import { messages } from "../lib/i18n";
import type { PublicReportDetails } from "../server/reports/report-reader";
import type { PublicReport } from "../server/reports/repository";
import { ReportReader } from "./report-reader";

function statusLabel(report: PublicReport) {
  const copy = messages[report.reportLocale];
  if (report.status === "failed") return copy.reportFailed;
  if (report.status === "partial") return copy.reportPartial;
  if (report.status === "completed") return copy.reportCompleted;
  if (report.status === "queued") return copy.reportQueued;
  return copy.reportExtracting;
}

export function ReportLiveView({
  initialReport,
  initialDetails,
}: {
  initialReport: PublicReport;
  initialDetails: PublicReportDetails | null;
}) {
  const [report, setReport] = useState(initialReport);
  const [details, setDetails] = useState(initialDetails);
  const copy = messages[report.reportLocale];

  useEffect(() => {
    document.documentElement.lang = report.reportLocale;
    if (isTerminalStatus(report.status)) return;

    let cancelled = false;
    let sequence = 0;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/reports/${report.shortId}/events?after=${sequence}`,
          { cache: "no-store" },
        );
        if (!response.ok || cancelled) return;
        const result = (await response.json()) as {
          report: PublicReport;
          events: ReportEvent[];
          details: PublicReportDetails | null;
        };
        setReport(result.report);
        if (result.details) setDetails(result.details);
        const last = result.events.at(-1);
        if (last) sequence = last.sequence;
      } finally {
        if (!cancelled) timer = window.setTimeout(poll, 1_500);
      }
    };
    timer = window.setTimeout(poll, 600);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [report.shortId, report.reportLocale, report.status]);

  const ready = report.status === "partial" || report.status === "completed";

  return (
    <main className="report-shell">
      <header className="topbar report-topbar">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            ✓
          </span>
          {copy.brand}
        </a>
        <span className={`status-chip ${report.status}`}>
          {statusLabel(report)}
        </span>
      </header>

      <section className="report-hero">
        <p className="kicker">{copy.reportTitle}</p>
        <h1>{report.extractedTitle ?? statusLabel(report)}</h1>
        <p className="report-date">
          {copy.createdAt}:{" "}
          <time dateTime={report.createdAt} suppressHydrationWarning>
            {new Intl.DateTimeFormat(report.reportLocale, {
              dateStyle: "long",
              timeStyle: "short",
            }).format(new Date(report.createdAt))}
          </time>
        </p>
      </section>

      {!isTerminalStatus(report.status) ? (
        <section className="progress-card" aria-live="polite">
          <div className="activity-dot" aria-hidden="true" />
          <div>
            <strong>{statusLabel(report)}</strong>
            <p>{copy.automatedLimit}</p>
          </div>
        </section>
      ) : null}

      {ready && details ? (
        <ReportReader locale={report.reportLocale} details={details} />
      ) : null}

      {report.status === "failed" ? (
        <section className="failure-card" role="alert">
          <strong>{copy.reportFailed}</strong>
          <p>{report.errorMessage ?? copy.genericError}</p>
        </section>
      ) : null}

      <section className="source-card">
        <span>{copy.source}</span>
        {report.sourceUrl ? (
          <a href={report.sourceUrl} target="_blank" rel="noreferrer noopener">
            {new URL(report.sourceUrl).hostname} ↗
          </a>
        ) : null}
      </section>

      <p className="report-limit">{copy.automatedLimit}</p>
    </main>
  );
}
