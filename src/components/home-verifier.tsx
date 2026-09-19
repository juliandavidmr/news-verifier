"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { SupportedLocale } from "../domain/reports";
import { messages } from "../lib/i18n";

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
    if (mode !== "url") return;
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
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
        <a className="brand" href="/" aria-label={copy.brand}>
          <span className="brand-mark" aria-hidden="true">
            ✓
          </span>
          {copy.brand}
        </a>
        <span className="topbar-note">{copy.eyebrow}</span>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="kicker">{copy.eyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className="hero-body">{copy.heroBody}</p>
        </div>

        <form className="verify-card" onSubmit={submit}>
          <fieldset className="mode-switch" aria-label="Input type">
            <button
              className={mode === "url" ? "mode-button active" : "mode-button"}
              type="button"
              aria-pressed={mode === "url"}
              onClick={() => setMode("url")}
            >
              <span aria-hidden="true">↗</span>
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
              <span aria-hidden="true">▣</span>
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
                ＋
              </span>
              <strong>{copy.imageMode}</strong>
              <span>{copy.imageLabel}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
              {image ? (
                <small>{image.name}</small>
              ) : (
                <small>{copy.imageSoon}</small>
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
            disabled={mode === "image" || submitting}
          >
            {submitting ? copy.submitting : copy.submit}
            <span aria-hidden="true">→</span>
          </button>
          <p className="input-note">{copy.inputNote}</p>
        </form>
      </section>

      <section className="principles" aria-label="Product principles">
        <article>
          <span>01</span>
          <strong>Traceable evidence</strong>
        </article>
        <article>
          <span>02</span>
          <strong>Claim by claim</strong>
        </article>
        <article>
          <span>03</span>
          <strong>Honest uncertainty</strong>
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
