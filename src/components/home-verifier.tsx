"use client";

import {
  EnlaceExterno,
  FlechaDerecha,
  Imagen,
  Sincronizar,
  Subir,
} from "@mteherandev/colombia-icons-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { SupportedLocale } from "../domain/reports";
import { messages } from "../lib/i18n";
import { BrandLink } from "./brand-link";

type InputMode = "url" | "image";

export function HomeVerifier({
  initialLocale,
}: {
  initialLocale: SupportedLocale;
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
  const SubmitIcon = submitting ? Sincronizar : FlechaDerecha;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeLocale(nextLocale: SupportedLocale) {
    setLocale(nextLocale);
    // biome-ignore lint/suspicious/noDocumentCookie: Safari support is required and Cookie Store is not universal.
    document.cookie = `nv_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response =
        mode === "image" && image
          ? await fetch("/api/reports", {
              method: "POST",
              headers: {
                "content-type": image.type,
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
        <BrandLink label={copy.brand} />
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
            {submitting ? copy.submitting : copy.submit}
            <span
              className={submitting ? "button-icon icon-spin" : "button-icon"}
              aria-hidden="true"
            >
              <SubmitIcon size={20} />
            </span>
          </button>
          <p className="input-note">{copy.inputNote}</p>
        </form>
      </section>

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

      <footer className="footer">
        <nav>
          <a href="/privacy">{copy.privacy}</a>
          <a href="/methodology">{copy.methodology}</a>
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
