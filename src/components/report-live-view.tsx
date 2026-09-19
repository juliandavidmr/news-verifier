"use client";

import { useEffect, useRef, useState } from "react";
import type { ReportEvent } from "../domain/reports";
import { isTerminalStatus } from "../domain/reports";
import { messages } from "../lib/i18n";
import type { PublicReportDetails } from "../server/reports/report-reader";
import type { PublicReport } from "../server/reports/repository";
import {
  advanceEventCursor,
  initialPollDelay,
  retryDelay,
  shouldAnnounceReady,
} from "./report-live-state";
import { ReportReader } from "./report-reader";

function statusLabel(report: PublicReport) {
  const copy = messages[report.reportLocale];
  if (report.status === "failed") return copy.reportFailed;
  if (report.status === "partial") return copy.reportPartial;
  if (report.status === "completed") return copy.reportCompleted;
  if (report.status === "queued") return copy.reportQueued;
  if (report.status === "extracting") return copy.reportExtracting;
  if (report.status === "identifying_claims") return copy.reportIdentifying;
  if (report.status === "researching") return copy.reportResearching;
  if (report.status === "evaluating") return copy.reportEvaluating;
  return copy.reportGenerating;
}

type NotificationState = "idle" | "enabled" | "denied" | "unavailable";

export function ReportLiveView({
  initialReport,
  initialDetails,
}: {
  initialReport: PublicReport;
  initialDetails: PublicReportDetails | null;
}) {
  const [report, setReport] = useState(initialReport);
  const [details, setDetails] = useState(initialDetails);
  const [connectionInterrupted, setConnectionInterrupted] = useState(false);
  const [notificationState, setNotificationState] =
    useState<NotificationState>("idle");
  const reportRef = useRef(initialReport);
  const sequenceRef = useRef(0);
  const notificationArmedRef = useRef(false);
  const notificationSentRef = useRef(false);
  const previousStatusRef = useRef(initialReport.status);
  const copy = messages[report.reportLocale];

  useEffect(() => {
    document.documentElement.lang = report.reportLocale;
  }, [report.reportLocale]);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  useEffect(() => {
    const armedKey = `report-notification:${initialReport.shortId}:armed`;
    const sentKey = `report-notification:${initialReport.shortId}:sent`;
    notificationArmedRef.current = sessionStorage.getItem(armedKey) === "1";
    notificationSentRef.current = sessionStorage.getItem(sentKey) === "1";
    if (!("Notification" in window)) {
      setNotificationState("unavailable");
    } else if (Notification.permission === "denied") {
      setNotificationState("denied");
    } else if (
      notificationArmedRef.current &&
      Notification.permission === "granted"
    ) {
      setNotificationState("enabled");
    }
  }, [initialReport.shortId]);

  useEffect(() => {
    if (isTerminalStatus(initialReport.status)) return;

    let cancelled = false;
    let inFlight = false;
    let failures = 0;
    let timer: number | undefined;

    const schedule = (delay: number) => {
      if (cancelled || isTerminalStatus(reportRef.current.status)) return;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(poll, delay);
    };

    const poll = async () => {
      if (cancelled || inFlight || isTerminalStatus(reportRef.current.status)) {
        return;
      }
      inFlight = true;
      try {
        const response = await fetch(
          `/api/reports/${initialReport.shortId}/events?after=${sequenceRef.current}`,
          { cache: "no-store" },
        );
        if (!response.ok)
          throw new Error(`Report polling failed: ${response.status}`);
        if (cancelled) return;
        const result = (await response.json()) as {
          report: PublicReport;
          events: ReportEvent[];
          details: PublicReportDetails | null;
        };
        sequenceRef.current = advanceEventCursor(
          sequenceRef.current,
          result.events,
        );
        failures = 0;
        setConnectionInterrupted(false);
        reportRef.current = result.report;
        setReport(result.report);
        if (result.details) setDetails(result.details);
      } catch {
        failures += 1;
        if (!cancelled) setConnectionInterrupted(true);
      } finally {
        inFlight = false;
        schedule(retryDelay(failures));
      }
    };

    const recoverNow = () => {
      failures = 0;
      schedule(0);
    };

    window.addEventListener("online", recoverNow);
    schedule(initialPollDelay);
    return () => {
      cancelled = true;
      window.removeEventListener("online", recoverNow);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [initialReport.shortId, initialReport.status]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = report.status;
    if (
      !shouldAnnounceReady(
        previousStatus,
        report.status,
        notificationSentRef.current,
      )
    ) {
      return;
    }

    const originalTitle = document.title;
    document.title = `${copy.reportReadyTitle} · ${copy.brand}`;
    if (
      notificationArmedRef.current &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(copy.reportReadyTitle, {
        body: copy.reportReadyNotification,
      });
      notificationSentRef.current = true;
      sessionStorage.setItem(`report-notification:${report.shortId}:sent`, "1");
    }

    return () => {
      document.title = originalTitle;
    };
  }, [copy, report.shortId, report.status]);

  const requestNotification = async () => {
    if (!("Notification" in window)) {
      setNotificationState("unavailable");
      return;
    }
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== "granted") {
      setNotificationState("denied");
      return;
    }
    notificationArmedRef.current = true;
    sessionStorage.setItem(`report-notification:${report.shortId}:armed`, "1");
    setNotificationState("enabled");
  };

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
          <div className="progress-copy">
            <strong>{statusLabel(report)}</strong>
            <p>
              {connectionInterrupted ? copy.reconnecting : copy.automatedLimit}
            </p>
            {notificationState === "idle" ? (
              <button
                className="notify-button"
                type="button"
                onClick={requestNotification}
              >
                <span aria-hidden="true">◉</span> {copy.notifyWhenReady}
              </button>
            ) : (
              <output className="notification-note">
                {notificationState === "enabled"
                  ? copy.notificationsEnabled
                  : notificationState === "denied"
                    ? copy.notificationsDenied
                    : copy.notificationsUnavailable}
              </output>
            )}
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
