"use client";

import {
  Campana,
  Compartir,
  EnlaceExterno,
  Sincronizar,
} from "@mteherandev/colombia-icons-react";
import { useEffect, useRef, useState } from "react";
import type { ReportEvent, SupportedLocale } from "../domain/reports";
import { isTerminalStatus } from "../domain/reports";
import { messages } from "../lib/i18n";
import { localizedPath } from "../lib/site";
import type { PublicReportDetails } from "../server/reports/report-reader";
import type { PublicReport } from "../server/reports/repository";
import { BrandLink } from "./brand-link";
import {
  advanceEventCursor,
  initialPollDelay,
  retryDelay,
  shouldAnnounceReady,
} from "./report-live-state";
import { ReportReader } from "./report-reader";

function statusLabel(report: PublicReport, locale: SupportedLocale) {
  const copy = messages[locale];
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
type ShareState = "idle" | "shared" | "copied" | "error";

export function ReportLiveView({
  initialReport,
  initialDetails,
}: {
  initialReport: PublicReport;
  initialDetails: PublicReportDetails | null;
}) {
  const [report, setReport] = useState(initialReport);
  const [details, setDetails] = useState(initialDetails);
  const [interfaceLocale, setInterfaceLocale] = useState(
    initialReport.reportLocale,
  );
  const [connectionInterrupted, setConnectionInterrupted] = useState(false);
  const [notificationState, setNotificationState] =
    useState<NotificationState>("idle");
  const [shareState, setShareState] = useState<ShareState>("idle");
  const reportRef = useRef(initialReport);
  const sequenceRef = useRef(0);
  const notificationArmedRef = useRef(false);
  const notificationSentRef = useRef(false);
  const previousStatusRef = useRef(initialReport.status);
  const copy = messages[interfaceLocale];

  function changeLocale(nextLocale: SupportedLocale) {
    setInterfaceLocale(nextLocale);
    // biome-ignore lint/suspicious/noDocumentCookie: Safari support is required and Cookie Store is not universal.
    document.cookie = `nv_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  useEffect(() => {
    document.documentElement.lang = interfaceLocale;
  }, [interfaceLocale]);

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

  const shareReport = async () => {
    const shareData = {
      title: report.extractedTitle ?? copy.reportTitle,
      text: copy.shareText,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareState("shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  };

  const ready = report.status === "partial" || report.status === "completed";

  return (
    <main className="report-shell">
      <header className="topbar report-topbar">
        <BrandLink label={copy.brand} href={localizedPath(interfaceLocale)} />
        <span className={`status-chip ${report.status}`}>
          {statusLabel(report, interfaceLocale)}
        </span>
      </header>

      <section className="report-hero">
        <p className="kicker">{copy.reportTitle}</p>
        <h1>{report.extractedTitle ?? statusLabel(report, interfaceLocale)}</h1>
        <p className="report-date">
          {copy.createdAt}:{" "}
          <time dateTime={report.createdAt} suppressHydrationWarning>
            {new Intl.DateTimeFormat(interfaceLocale, {
              dateStyle: "long",
              timeStyle: "short",
            }).format(new Date(report.createdAt))}
          </time>
        </p>
        <div className="share-report-action">
          <button type="button" onClick={shareReport}>
            <Compartir size={20} aria-hidden="true" />
            {shareState === "shared"
              ? copy.reportShared
              : shareState === "copied"
                ? copy.reportLinkCopied
                : copy.shareReport}
          </button>
          {shareState === "error" ? (
            <p role="alert">{copy.shareError}</p>
          ) : null}
        </div>
      </section>

      {!isTerminalStatus(report.status) ? (
        <section className="progress-card" aria-live="polite">
          <span className="activity-icon" aria-hidden="true">
            <span className="icon-spin">
              <Sincronizar size={20} />
            </span>
          </span>
          <div className="progress-copy">
            <strong>{statusLabel(report, interfaceLocale)}</strong>
            <p>
              {connectionInterrupted ? copy.reconnecting : copy.automatedLimit}
            </p>
            {notificationState === "idle" ? (
              <button
                className="notify-button"
                type="button"
                onClick={requestNotification}
              >
                <Campana size={18} aria-hidden="true" />
                {copy.notifyWhenReady}
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
        <ReportReader locale={interfaceLocale} details={details} />
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
            {new URL(report.sourceUrl).hostname}
            <EnlaceExterno size={17} aria-hidden="true" />
          </a>
        ) : null}
      </section>

      <p className="report-limit">{copy.automatedLimit}</p>

      <footer className="footer report-footer">
        <nav>
          <a href={localizedPath(interfaceLocale, "/privacy")}>
            {copy.privacy}
          </a>
          <a href={localizedPath(interfaceLocale, "/methodology")}>
            {copy.methodology}
          </a>
        </nav>
        <label className="locale-control">
          <span>{copy.language}</span>
          <select
            value={interfaceLocale}
            onChange={(event) =>
              changeLocale(event.target.value as SupportedLocale)
            }
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="pt">Português</option>
          </select>
        </label>
      </footer>
    </main>
  );
}
