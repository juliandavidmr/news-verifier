import { messages } from "../../lib/i18n";
import { getRequestLocale } from "../../server/request-locale";

export default async function MethodologyPage() {
  const locale = await getRequestLocale();
  const copy = messages[locale];

  return (
    <main className="legal-shell">
      <a className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          ✓
        </span>
        {copy.brand}
      </a>
      <p className="kicker">{copy.methodology}</p>
      <h1>{copy.methodologyTitle}</h1>
      <p>{copy.methodologyIntro}</p>
      <a className="legal-back" href="/">
        ← {copy.backHome}
      </a>
    </main>
  );
}
