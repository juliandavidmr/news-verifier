import { FlechaIzquierda } from "@mteherandev/colombia-icons-react";
import { BrandLink } from "../../components/brand-link";
import { messages } from "../../lib/i18n";
import { getRequestLocale } from "../../server/request-locale";

export default async function MethodologyPage() {
  const locale = await getRequestLocale();
  const copy = messages[locale];

  return (
    <main className="legal-shell">
      <BrandLink label={copy.brand} />
      <p className="kicker">{copy.methodology}</p>
      <h1>{copy.methodologyTitle}</h1>
      <p>{copy.methodologyIntro}</p>
      <a className="legal-back" href="/">
        <FlechaIzquierda size={18} aria-hidden="true" />
        {copy.backHome}
      </a>
    </main>
  );
}
