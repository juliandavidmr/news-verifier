import { FlechaIzquierda } from "@mteherandev/colombia-icons-react";
import { BrandLink } from "../../components/brand-link";
import { messages } from "../../lib/i18n";
import { privacyPolicy } from "../../lib/privacy-policy";
import { getRequestLocale } from "../../server/request-locale";

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const copy = messages[locale];
  const policy = privacyPolicy[locale];

  return (
    <main className="legal-shell">
      <BrandLink label={copy.brand} />
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
      <a className="legal-back" href="/">
        <FlechaIzquierda size={18} aria-hidden="true" />
        {copy.backHome}
      </a>
    </main>
  );
}
