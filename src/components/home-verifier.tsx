"use client";

import {
  EnlaceExterno,
  FlechaDerecha,
  Imagen,
  Sincronizar,
  Subir,
} from "@mteherandev/colombia-icons-react";
import { useRouter } from "next/navigation";
import { type ReactNode, type SubmitEvent, useRef, useState } from "react";
import type { SupportedLocale } from "../domain/reports";
import { messages } from "../lib/i18n";
import { imageUploadMime } from "../lib/image-mime";
import { seoContent } from "../lib/seo-content";
import { localizedPath } from "../lib/site";
import { BrandLink } from "./brand-link";
import { type ImageOcrPoll, imageOcrOutcome } from "./image-ocr-state";

type InputMode = "url" | "image";

const ocrPollIntervalMs = 500;
const ocrWaitLimitMs = 65_000;

async function waitForImageOcr(shortId: string) {
  const deadline = Date.now() + ocrWaitLimitMs;
  let afterSequence = 0;

  while (Date.now() < deadline) {
    const response = await fetch(
      `/api/reports/${shortId}/events?after=${afterSequence}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, ocrPollIntervalMs),
      );
      continue;
    }
    const result = (await response.json()) as ImageOcrPoll;
    for (const event of result.events) {
      afterSequence = Math.max(afterSequence, event.sequence);
    }
    const outcome = imageOcrOutcome(result);
    if (outcome.state === "ready") return { ready: true } as const;
    if (outcome.state === "failed") {
      return {
        ready: false,
        code: outcome.code,
      } as const;
    }
    await new Promise((resolve) =>
      window.setTimeout(resolve, ocrPollIntervalMs),
    );
  }

  return { ready: false, code: "ocr_timeout" } as const;
}

export function HomeVerifier({
  initialLocale,
  recentReportsSection,
}: {
  initialLocale: SupportedLocale;
  recentReportsSection: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState(initialLocale);
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const copy = messages[locale];
  const seo = seoContent[locale];
  const SubmitIcon = submitting ? Sincronizar : FlechaDerecha;

  function changeLocale(nextLocale: SupportedLocale) {
    setLocale(nextLocale);
    // biome-ignore lint/suspicious/noDocumentCookie: Safari support is required and Cookie Store is not universal.
    document.cookie = `nv_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.push(localizedPath(nextLocale));
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response =
        mode === "image" && image
          ? await fetch("/api/reports", {
              method: "POST",
              headers: {
                "content-type": imageUploadMime(image),
                "x-report-locale": locale,
                "x-idempotency-key": idempotencyKey.current,
              },
              body: image,
            })
          : await fetch("/api/reports", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                url,
                reportLocale: locale,
                idempotencyKey: idempotencyKey.current,
              }),
            });
      const result = (await response.json()) as {
        shortId?: string;
        code?: string;
      };
      if (!response.ok || !result.shortId) {
        setError(
          result.code === "invalid_url"
            ? copy.invalidUrl
            : result.code === "visitor_quota_reached"
              ? copy.visitorQuotaReached
              : result.code === "global_quota_reached"
                ? copy.globalQuotaReached
                : result.code === "image_too_large"
                  ? copy.imageTooLarge
                  : result.code === "unsupported_image" ||
                      result.code === "image_type_mismatch" ||
                      result.code === "invalid_image" ||
                      result.code === "image_dimensions_exceeded"
                    ? copy.invalidImage
                    : result.code === "ocr_quality_insufficient"
                      ? copy.ocrQualityInsufficient
                      : result.code === "ocr_timeout"
                        ? copy.ocrTimeout
                        : copy.genericError,
        );
        return;
      }
      if (mode === "image") {
        const ocr = await waitForImageOcr(result.shortId);
        if (!ocr.ready) {
          setError(
            ocr.code === "ocr_quality_insufficient"
              ? copy.ocrQualityInsufficient
              : ocr.code === "ocr_timeout"
                ? copy.ocrTimeout
                : copy.ocrFailed,
          );
          return;
        }
      }
      router.push(`/r/${result.shortId}`);
    } catch {
      setError(copy.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <BrandLink label={copy.brand} href={localizedPath(locale)} />
        <span className="topbar-note">{copy.eyebrow}</span>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="kicker">{copy.eyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className="hero-body">{copy.heroBody}</p>
        </div>

        <form className="verify-card" onSubmit={submit}>
          <fieldset className="mode-switch" aria-label={copy.inputType}>
            <button
              className={mode === "url" ? "mode-button active" : "mode-button"}
              type="button"
              disabled={submitting}
              aria-pressed={mode === "url"}
              onClick={() => setMode("url")}
            >
              <EnlaceExterno size={20} aria-hidden="true" />
              {copy.linkMode}
            </button>
            <button
              className={
                mode === "image"
                  ? "mode-button active image"
                  : "mode-button image"
              }
              type="button"
              disabled={submitting}
              aria-pressed={mode === "image"}
              onClick={() => setMode("image")}
            >
              <Imagen size={20} aria-hidden="true" />
              {copy.imageMode}
            </button>
          </fieldset>

          {mode === "url" ? (
            <label className="field-label">
              <span>{copy.linkLabel}</span>
              <input
                type="url"
                name="url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  idempotencyKey.current = crypto.randomUUID();
                }}
                placeholder={copy.linkPlaceholder}
                autoComplete="url"
                required
              />
            </label>
          ) : (
            <label className="upload-dropzone">
              <span className="upload-icon" aria-hidden="true">
                <Subir size={26} />
              </span>
              <strong>{copy.imageMode}</strong>
              <span>{copy.imageLabel}</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                required
                onChange={(event) => {
                  setImage(event.target.files?.[0] ?? null);
                  idempotencyKey.current = crypto.randomUUID();
                }}
              />
              {image ? (
                <small>{image.name}</small>
              ) : (
                <small>{copy.imageHelp}</small>
              )}
            </label>
          )}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="submit-button"
            type="submit"
            disabled={submitting || (mode === "image" ? !image : !url)}
          >
            {submitting
              ? mode === "image"
                ? copy.readingImage
                : copy.submitting
              : copy.submit}
            <span
              className={submitting ? "button-icon icon-spin" : "button-icon"}
              aria-hidden="true"
            >
              <SubmitIcon size={20} />
            </span>
          </button>
          {mode === "url" ? (
            <p className="listing-notice">{copy.listingNotice}</p>
          ) : null}
        </form>
      </section>

      {recentReportsSection}

      <section className="principles" aria-label={copy.productPrinciples}>
        <article>
          <span>01</span>
          <strong>{copy.principleEvidence}</strong>
        </article>
        <article>
          <span>02</span>
          <strong>{copy.principleClaims}</strong>
        </article>
        <article>
          <span>03</span>
          <strong>{copy.principleUncertainty}</strong>
        </article>
      </section>

      <section className="seo-section" aria-labelledby="how-it-works">
        <div className="section-heading">
          <p className="kicker">{copy.methodology}</p>
          <h2 id="how-it-works">{seo.howTitle}</h2>
          <p>{seo.howIntro}</p>
        </div>
        <ol className="explanation-grid">
          {seo.steps.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="seo-section seo-section-accent"
        aria-labelledby="report-includes"
      >
        <div className="section-heading">
          <h2 id="report-includes">{seo.coverageTitle}</h2>
          <p>{seo.coverageIntro}</p>
        </div>
        <div className="coverage-grid">
          {seo.coverage.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="seo-section faq-section"
        aria-labelledby="frequent-questions"
      >
        <div className="section-heading">
          <h2 id="frequent-questions">{seo.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {seo.faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="footer">
        <nav>
          <a href={localizedPath(locale, "/privacy")}>{copy.privacy}</a>
          <a href={localizedPath(locale, "/methodology")}>{copy.methodology}</a>
        </nav>
        <label className="locale-control">
          <span>{copy.language}</span>
          <select
            value={locale}
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
