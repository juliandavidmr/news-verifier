"use client";

import {
  Alerta,
  Cancelar,
  CircleCheck,
  EnlaceExterno,
  Informacion,
  Interrogacion,
  RelojArena,
  Sincronizar,
} from "@mteherandev/colombia-icons-react";
import { useEffect, useState } from "react";
import type { SupportedLocale } from "../domain/reports";
import type {
  PublicReportClaim,
  PublicReportDetails,
} from "../server/reports/report-reader";

const readerCopy = {
  en: {
    supportIndex: "Support index",
    coverage: "Evidence coverage",
    unavailable: "Not published",
    completed: "Completed",
    partial: "Partial",
    conclusive: "Conclusive",
    inconclusive: "Inconclusive",
    passages: "Context passages",
    claim: "Claim",
    verdict: "Verdict",
    strength: "Evidence strength",
    explanation: "Explanation",
    evidence: "Evidence records",
    noEvidence: "No validated evidence record is linked to this conclusion.",
    original: "Original excerpt",
    translation: "Translation used",
    consulted: "Consulted",
    published: "Published",
    period: "Reference period",
    scope: "Reference scope",
    formula: "Inspect the calculation",
    formulaBody:
      "Coverage is the concluded claim weight divided by total claim weight. The support index is Σ(weight × contribution) divided by included weight. Supported contributes 100%, misleading 50%, and contradicted 0%.",
    weight: "Weight",
    contribution: "Contribution",
    included: "Included",
    excluded: "Excluded",
    lowCoverage:
      "The index is withheld because weighted coverage is below 60%.",
    primaryMissing:
      "The index is withheld because a primary claim has no conclusion.",
    timeLimit: "Some claims were not investigated before the time limit.",
    platformLimit:
      "Some claims were not investigated because free platform capacity ended.",
    strengths: {
      high: "High",
      medium: "Medium",
      low: "Low",
      none: "Not applicable",
    },
    hierarchy: {
      primary: "Primary",
      expert: "Expert",
      independent: "Independent",
      other: "Other",
    },
    relation: {
      supports: "Supports",
      contradicts: "Contradicts",
      context: "Context",
    },
    verdicts: {
      supported: "Supported",
      contradicted: "Contradicted",
      misleading: "Misleading",
      disputed: "Disputed",
      insufficient_evidence: "Insufficient evidence",
      not_verifiable: "Not verifiable",
      pending: "Not investigated",
    },
  },
  es: {
    supportIndex: "Índice de respaldo",
    coverage: "Cobertura de evidencia",
    unavailable: "No publicado",
    completed: "Completado",
    partial: "Parcial",
    conclusive: "Concluyente",
    inconclusive: "Inconcluso",
    passages: "Pasajes de contexto",
    claim: "Afirmación",
    verdict: "Veredicto",
    strength: "Fuerza de evidencia",
    explanation: "Explicación",
    evidence: "Registros de evidencia",
    noEvidence:
      "No hay un registro de evidencia validado vinculado a esta conclusión.",
    original: "Fragmento original",
    translation: "Traducción utilizada",
    consulted: "Consultada",
    published: "Publicada",
    period: "Periodo de referencia",
    scope: "Ámbito de referencia",
    formula: "Inspeccionar el cálculo",
    formulaBody:
      "La cobertura es el peso de las afirmaciones concluidas dividido por el peso total. El índice es Σ(peso × aporte) dividido por el peso incluido. Respaldada aporta 100 %, engañosa 50 % y contradicha 0 %.",
    weight: "Peso",
    contribution: "Aporte",
    included: "Incluida",
    excluded: "Excluida",
    lowCoverage:
      "El índice no se publica porque la cobertura ponderada es menor al 60 %.",
    primaryMissing:
      "El índice no se publica porque una afirmación principal no tiene conclusión.",
    timeLimit:
      "Algunas afirmaciones no se investigaron antes del límite de tiempo.",
    platformLimit:
      "Algunas afirmaciones no se investigaron porque se agotó la capacidad gratuita.",
    strengths: {
      high: "Alta",
      medium: "Media",
      low: "Baja",
      none: "No aplica",
    },
    hierarchy: {
      primary: "Primaria",
      expert: "Experta",
      independent: "Independiente",
      other: "Otra",
    },
    relation: {
      supports: "Respalda",
      contradicts: "Contradice",
      context: "Contextualiza",
    },
    verdicts: {
      supported: "Respaldada",
      contradicted: "Contradicha",
      misleading: "Engañosa",
      disputed: "En disputa",
      insufficient_evidence: "Sin evidencia suficiente",
      not_verifiable: "No verificable",
      pending: "No investigada",
    },
  },
  fr: {
    supportIndex: "Indice de soutien",
    coverage: "Couverture des preuves",
    unavailable: "Non publié",
    completed: "Terminé",
    partial: "Partiel",
    conclusive: "Concluant",
    inconclusive: "Non concluant",
    passages: "Passages de contexte",
    claim: "Affirmation",
    verdict: "Verdict",
    strength: "Force des preuves",
    explanation: "Explication",
    evidence: "Registres de preuves",
    noEvidence: "Aucun registre de preuve validé n’est lié à cette conclusion.",
    original: "Extrait original",
    translation: "Traduction utilisée",
    consulted: "Consultée",
    published: "Publiée",
    period: "Période de référence",
    scope: "Champ de référence",
    formula: "Inspecter le calcul",
    formulaBody:
      "La couverture est le poids des affirmations conclues divisé par le poids total. L’indice est Σ(poids × contribution) divisé par le poids inclus. Soutenue contribue 100 %, trompeuse 50 % et contredite 0 %.",
    weight: "Poids",
    contribution: "Contribution",
    included: "Incluse",
    excluded: "Exclue",
    lowCoverage:
      "L’indice n’est pas publié car la couverture pondérée est inférieure à 60 %.",
    primaryMissing:
      "L’indice n’est pas publié car une affirmation principale reste sans conclusion.",
    timeLimit:
      "Certaines affirmations n’ont pas été étudiées avant la limite de temps.",
    platformLimit:
      "Certaines affirmations n’ont pas été étudiées faute de capacité gratuite.",
    strengths: {
      high: "Élevée",
      medium: "Moyenne",
      low: "Faible",
      none: "Sans objet",
    },
    hierarchy: {
      primary: "Primaire",
      expert: "Experte",
      independent: "Indépendante",
      other: "Autre",
    },
    relation: {
      supports: "Soutient",
      contradicts: "Contredit",
      context: "Contexte",
    },
    verdicts: {
      supported: "Soutenue",
      contradicted: "Contredite",
      misleading: "Trompeuse",
      disputed: "Contestée",
      insufficient_evidence: "Preuves insuffisantes",
      not_verifiable: "Non vérifiable",
      pending: "Non étudiée",
    },
  },
  pt: {
    supportIndex: "Índice de respaldo",
    coverage: "Cobertura de evidências",
    unavailable: "Não publicado",
    completed: "Concluído",
    partial: "Parcial",
    conclusive: "Conclusivo",
    inconclusive: "Inconclusivo",
    passages: "Trechos de contexto",
    claim: "Afirmação",
    verdict: "Veredito",
    strength: "Força da evidência",
    explanation: "Explicação",
    evidence: "Registros de evidência",
    noEvidence:
      "Nenhum registro de evidência validado está ligado a esta conclusão.",
    original: "Trecho original",
    translation: "Tradução utilizada",
    consulted: "Consultada",
    published: "Publicada",
    period: "Período de referência",
    scope: "Âmbito de referência",
    formula: "Inspecionar o cálculo",
    formulaBody:
      "A cobertura é o peso das afirmações concluídas dividido pelo peso total. O índice é Σ(peso × contribuição) dividido pelo peso incluído. Respaldada contribui 100%, enganosa 50% e contradita 0%.",
    weight: "Peso",
    contribution: "Contribuição",
    included: "Incluída",
    excluded: "Excluída",
    lowCoverage:
      "O índice não é publicado porque a cobertura ponderada está abaixo de 60%.",
    primaryMissing:
      "O índice não é publicado porque uma afirmação principal não tem conclusão.",
    timeLimit:
      "Algumas afirmações não foram investigadas antes do limite de tempo.",
    platformLimit:
      "Algumas afirmações não foram investigadas porque a capacidade gratuita acabou.",
    strengths: {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
      none: "Não se aplica",
    },
    hierarchy: {
      primary: "Primária",
      expert: "Especializada",
      independent: "Independente",
      other: "Outra",
    },
    relation: {
      supports: "Respalda",
      contradicts: "Contradiz",
      context: "Contextualiza",
    },
    verdicts: {
      supported: "Respaldada",
      contradicted: "Contradita",
      misleading: "Enganosa",
      disputed: "Em disputa",
      insufficient_evidence: "Evidência insuficiente",
      not_verifiable: "Não verificável",
      pending: "Não investigada",
    },
  },
} as const;

const verdictIcons = {
  supported: CircleCheck,
  contradicted: Cancelar,
  misleading: Alerta,
  disputed: Sincronizar,
  insufficient_evidence: Interrogacion,
  not_verifiable: Informacion,
  pending: RelojArena,
} as const;

function VerdictIcon({ verdict }: { verdict: keyof typeof verdictIcons }) {
  const Icon = verdictIcons[verdict];
  return (
    <span className="verdict-icon" aria-hidden="true">
      <Icon size={16} />
    </span>
  );
}

function claimVerdict(claim: PublicReportClaim) {
  return claim.verdict ?? "pending";
}

function LocalDate({
  value,
  locale,
}: {
  value: string;
  locale: SupportedLocale;
}) {
  return (
    <time dateTime={value} suppressHydrationWarning>
      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(value),
      )}
    </time>
  );
}

function HighlightedPassage({ claim }: { claim: PublicReportClaim }) {
  const start = claim.contextPassage
    .toLocaleLowerCase()
    .indexOf(claim.statement.toLocaleLowerCase());
  if (start < 0) return <p>{claim.contextPassage}</p>;
  const end = start + claim.statement.length;
  return (
    <p>
      {claim.contextPassage.slice(0, start)}
      <mark>{claim.contextPassage.slice(start, end)}</mark>
      {claim.contextPassage.slice(end)}
    </p>
  );
}

export function ReportReader({
  locale,
  details,
}: {
  locale: SupportedLocale;
  details: PublicReportDetails;
}) {
  const copy = readerCopy[locale];
  const [selectedId, setSelectedId] = useState(details.claims[0]?.id ?? null);
  useEffect(() => {
    if (!details.claims.some((claim) => claim.id === selectedId)) {
      setSelectedId(details.claims[0]?.id ?? null);
    }
  }, [details.claims, selectedId]);
  const selected =
    details.claims.find((claim) => claim.id === selectedId) ??
    details.claims[0];
  const outcome =
    details.outcome === "partial"
      ? copy.partial
      : details.outcome === "conclusive"
        ? copy.conclusive
        : copy.inconclusive;
  const absenceReason = details.partialReason
    ? details.partialReason === "time_limit"
      ? copy.timeLimit
      : copy.platformLimit
    : (details.evidenceCoverage ?? 0) < 60
      ? copy.lowCoverage
      : copy.primaryMissing;

  return (
    <>
      <section className="report-scoreboard" aria-label={outcome}>
        <article>
          <span>{copy.supportIndex}</span>
          <strong>
            {details.supportIndex === null
              ? copy.unavailable
              : `${details.supportIndex}%`}
          </strong>
          {details.supportIndex === null ? <p>{absenceReason}</p> : null}
        </article>
        <article>
          <span>{copy.coverage}</span>
          <strong>
            {details.evidenceCoverage === null
              ? "—"
              : `${details.evidenceCoverage}%`}
          </strong>
          <p>{outcome}</p>
        </article>
      </section>

      {details.claims.length > 0 && selected ? (
        <section className="report-reader-grid">
          <div className="passage-column">
            <h2>{copy.passages}</h2>
            <ol className="claim-passage-list">
              {details.claims.map((claim) => {
                const verdict = claimVerdict(claim);
                return (
                  <li key={claim.id}>
                    <button
                      type="button"
                      className={`claim-passage verdict-${verdict} ${selected.id === claim.id ? "selected" : ""}`}
                      aria-pressed={selected.id === claim.id}
                      onClick={() => setSelectedId(claim.id)}
                    >
                      <span className="claim-number">
                        {copy.claim} {claim.ordinal}
                      </span>
                      <HighlightedPassage claim={claim} />
                      <span className="verdict-label">
                        <VerdictIcon verdict={verdict} />
                        {copy.verdicts[verdict]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <article className="claim-detail" aria-live="polite">
            {(() => {
              const verdict = claimVerdict(selected);
              return (
                <>
                  <p className={`detail-verdict verdict-${verdict}`}>
                    <VerdictIcon verdict={verdict} />
                    {copy.verdicts[verdict]}
                  </p>
                  <h2>{selected.statement}</h2>
                </>
              );
            })()}
            <dl className="claim-metadata">
              <div>
                <dt>{copy.strength}</dt>
                <dd>
                  {selected.evidenceStrength
                    ? copy.strengths[selected.evidenceStrength]
                    : copy.strengths.none}
                </dd>
              </div>
              <div>
                <dt>{copy.period}</dt>
                <dd>{selected.referencePeriod}</dd>
              </div>
              <div>
                <dt>{copy.scope}</dt>
                <dd>{selected.referenceScope}</dd>
              </div>
            </dl>
            {selected.explanation ? (
              <section className="claim-explanation">
                <h3>{copy.explanation}</h3>
                <p>{selected.explanation}</p>
              </section>
            ) : null}
            <section className="evidence-section">
              <h3>{copy.evidence}</h3>
              {selected.evidence.length === 0 ? (
                <p className="empty-evidence">{copy.noEvidence}</p>
              ) : (
                selected.evidence.map((evidence) => (
                  <article className="evidence-record" key={evidence.id}>
                    <div className="evidence-heading">
                      <span>{copy.hierarchy[evidence.hierarchy]}</span>
                      <span>{copy.relation[evidence.relation]}</span>
                    </div>
                    <a
                      href={evidence.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {evidence.title ??
                        new URL(evidence.canonicalUrl).hostname}
                      <EnlaceExterno size={16} aria-hidden="true" />
                    </a>
                    <blockquote>
                      <b>{copy.original}</b>
                      <p lang={evidence.originalLanguage}>
                        {evidence.originalFragment}
                      </p>
                    </blockquote>
                    {evidence.translatedFragment ? (
                      <blockquote className="translation">
                        <b>{copy.translation}</b>
                        <p>{evidence.translatedFragment}</p>
                      </blockquote>
                    ) : null}
                    <p className="evidence-dates">
                      {evidence.publishedAt ? (
                        <>
                          {copy.published}:{" "}
                          <LocalDate
                            value={evidence.publishedAt}
                            locale={locale}
                          />{" "}
                          ·{" "}
                        </>
                      ) : null}
                      {copy.consulted}:{" "}
                      <LocalDate value={evidence.consultedAt} locale={locale} />
                    </p>
                  </article>
                ))
              )}
            </section>
          </article>
        </section>
      ) : null}

      <details className="score-formula">
        <summary>{copy.formula}</summary>
        <p>{copy.formulaBody}</p>
        <table className="formula-table">
          <tbody>
            {details.claims.map((claim) => (
              <tr key={claim.id}>
                <td>
                  {copy.claim} {claim.ordinal}
                </td>
                <td>
                  {copy.weight}: {claim.weight}
                </td>
                <td>
                  {claim.includedInIndex
                    ? `${copy.included} · ${copy.contribution}: ${claim.contribution ?? 0}%`
                    : copy.excluded}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
