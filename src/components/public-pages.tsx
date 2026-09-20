import { FlechaIzquierda } from "@mteherandev/colombia-icons-react";
import type { SupportedLocale } from "../domain/reports";
import { messages } from "../lib/i18n";
import { privacyPolicy } from "../lib/privacy-policy";
import { seoContent } from "../lib/seo-content";
import { localizedPath, siteName, siteUrl } from "../lib/site";
import { BrandLink } from "./brand-link";
import { HomeVerifier } from "./home-verifier";

function JsonLd({ value }: { value: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Static application copy is serialized and HTML opening brackets are escaped.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value).replace(/</gu, "\\u003c"),
      }}
    />
  );
}

export function PublicHomePage({ locale }: { locale: SupportedLocale }) {
  const seo = seoContent[locale];
  const url = new URL(localizedPath(locale), siteUrl).toString();

  return (
    <>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: messages[locale].brand,
          alternateName: siteName,
          url,
          description: seo.homeDescription,
          applicationCategory: "ReferenceApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript and a modern web browser",
          inLanguage: locale,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <HomeVerifier initialLocale={locale} />
    </>
  );
}

export function PublicMethodologyPage({ locale }: { locale: SupportedLocale }) {
  const copy = messages[locale];
  const seo = seoContent[locale];
  const url = new URL(
    localizedPath(locale, "/methodology"),
    siteUrl,
  ).toString();

  return (
    <main className="legal-shell methodology-shell">
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: copy.methodologyTitle,
          description: seo.methodologyDescription,
          url,
          inLanguage: locale,
          isPartOf: {
            "@type": "WebSite",
            name: siteName,
            url: siteUrl.toString(),
          },
        }}
      />
      <header className="topbar">
        <BrandLink label={copy.brand} href={localizedPath(locale)} />
        <span className="topbar-note">{copy.eyebrow}</span>
      </header>
      <p className="kicker">{copy.methodology}</p>
      <h1>{copy.methodologyTitle}</h1>
      <p className="legal-lede">{copy.methodologyIntro}</p>
      <div className="legal-sections methodology-sections">
        {seo.methodologySections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
      <a className="legal-back" href={localizedPath(locale)}>
        <FlechaIzquierda size={18} aria-hidden="true" />
        {copy.backHome}
      </a>
    </main>
  );
}

export function PublicPrivacyPage({ locale }: { locale: SupportedLocale }) {
  const copy = messages[locale];
  const policy = privacyPolicy[locale];

  return (
    <main className="legal-shell">
      <header className="topbar">
        <BrandLink label={copy.brand} href={localizedPath(locale)} />
        <span className="topbar-note">{copy.eyebrow}</span>
      </header>
      <p className="kicker">{copy.privacy}</p>
      <h1>{copy.privacyTitle}</h1>
      <p className="legal-effective">{policy.effectiveDate}</p>
      <p>{policy.summary}</p>
      <div className="legal-sections">
        {policy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
      <a className="legal-back" href={localizedPath(locale)}>
        <FlechaIzquierda size={18} aria-hidden="true" />
        {copy.backHome}
      </a>
    </main>
  );
}
