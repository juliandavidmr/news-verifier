"use client";

import {
  Alerta,
  Cancelar,
  ChevronAbajo,
  CircleCheck,
  EnlaceExterno,
  Informacion,
  Interrogacion,
  RelojArena,
  Sincronizar,
} from "@mteherandev/colombia-icons-react";
import { useEffect, useMemo, useState } from "react";
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
    conclusiveSummary:
      "The report reached an overall conclusion because enough weighted evidence was found and every primary claim has a conclusion. This does not mean every statement is true; review each claim and source below.",
    inconclusiveSummary:
      "The report remains inconclusive because the available evidence does not cover enough of the source for an overall result. Claim-level findings are still shown below, while unresolved claims stay explicitly excluded.",
    partialSummary:
      "This is a partial result because the investigation ended before every selected claim could be evaluated. The findings below remain auditable, but they do not represent the whole source.",
    resultExplanation: "What this result means",
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
    showMoreClaims: "Show {count} more uninvestigated claims",
    showFewerClaims: "Hide additional uninvestigated claims",
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
    conclusiveSummary:
      "El informe alcanzó un resultado general porque encontró suficiente evidencia ponderada y todas las afirmaciones principales tienen una conclusión. Esto no significa que cada frase sea verdadera; revisa cada afirmación y sus fuentes.",
    inconclusiveSummary:
      "El informe permanece inconcluso porque la evidencia disponible no cubre suficiente contenido para sostener un resultado general. Los hallazgos por afirmación aparecen abajo y lo no resuelto queda excluido explícitamente.",
    partialSummary:
      "Este es un resultado parcial porque la investigación terminó antes de evaluar todas las afirmaciones seleccionadas. Los hallazgos disponibles siguen siendo auditables, pero no representan toda la fuente.",
    resultExplanation: "Qué significa este resultado",
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
    showMoreClaims: "Mostrar {count} afirmaciones no investigadas más",
    showFewerClaims: "Ocultar afirmaciones no investigadas adicionales",
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
    conclusiveSummary:
      "Le rapport aboutit à un résultat global car les preuves pondérées sont suffisantes et chaque affirmation principale a une conclusion. Cela ne signifie pas que chaque phrase est vraie ; examinez chaque affirmation et ses sources.",
    inconclusiveSummary:
      "Le rapport reste non concluant car les preuves disponibles ne couvrent pas assez la source pour établir un résultat global. Les constats par affirmation restent visibles et les points non résolus sont explicitement exclus.",
    partialSummary:
      "Ce résultat est partiel car l’enquête s’est terminée avant l’évaluation de toutes les affirmations sélectionnées. Les constats disponibles restent auditables, mais ne représentent pas toute la source.",
    resultExplanation: "Ce que signifie ce résultat",
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
    showMoreClaims: "Afficher {count} affirmations non étudiées de plus",
    showFewerClaims: "Masquer les affirmations non étudiées supplémentaires",
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
    conclusiveSummary:
      "O relatório chegou a um resultado geral porque encontrou evidências ponderadas suficientes e todas as afirmações principais têm uma conclusão. Isso não significa que cada frase seja verdadeira; revise cada afirmação e suas fontes.",
    inconclusiveSummary:
      "O relatório permanece inconclusivo porque as evidências disponíveis não cobrem conteúdo suficiente para sustentar um resultado geral. Os achados por afirmação aparecem abaixo e os pontos não resolvidos ficam explicitamente excluídos.",
    partialSummary:
      "Este é um resultado parcial porque a investigação terminou antes de avaliar todas as afirmações selecionadas. Os achados disponíveis continuam auditáveis, mas não representam toda a fonte.",
    resultExplanation: "O que este resultado significa",
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
    showMoreClaims: "Mostrar mais {count} afirmações não investigadas",
    showFewerClaims: "Ocultar afirmações não investigadas adicionais",
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

export function orderClaimsForDisplay(claims: PublicReportClaim[]) {
  return [...claims].sort((left, right) => {
    const leftPending = left.verdict === null ? 1 : 0;
    const rightPending = right.verdict === null ? 1 : 0;
    return leftPending - rightPending || left.ordinal - right.ordinal;
  });
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
  const orderedClaims = useMemo(
    () => orderClaimsForDisplay(details.claims),
    [details.claims],
  );
  const investigatedClaims = orderedClaims.filter(
    (claim) => claim.verdict !== null,
  );
  const uninvestigatedClaims = orderedClaims.filter(
    (claim) => claim.verdict === null,
  );
  const initialClaims = [
    ...investigatedClaims,
    ...uninvestigatedClaims.slice(0, 3),
  ];
  const [selectedId, setSelectedId] = useState(initialClaims[0]?.id ?? null);
  const [showAllUninvestigated, setShowAllUninvestigated] = useState(false);
  useEffect(() => {
    if (!orderedClaims.some((claim) => claim.id === selectedId)) {
      setSelectedId(orderedClaims[0]?.id ?? null);
    }
  }, [orderedClaims, selectedId]);
  const selected =
    orderedClaims.find((claim) => claim.id === selectedId) ?? orderedClaims[0];
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
  const outcomeSummary =
    details.outcome === "partial"
      ? copy.partialSummary
      : details.outcome === "conclusive"
        ? copy.conclusiveSummary
        : copy.inconclusiveSummary;
  const hiddenUninvestigated = Math.max(uninvestigatedClaims.length - 3, 0);

  const renderClaim = (claim: PublicReportClaim) => {
    const verdict = claimVerdict(claim);
    return (
      <li key={claim.id}>
        <button
          type="button"
          className={`claim-passage verdict-${verdict} ${selected?.id === claim.id ? "selected" : ""}`}
          aria-pressed={selected?.id === claim.id}
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
  };

  return (
    <>
      <section className="report-outcome-summary" aria-label={outcome}>
        <span>{copy.resultExplanation}</span>
        <h2>{outcome}</h2>
        <p>{outcomeSummary}</p>
        {details.outcome !== "conclusive" ? (
          <p className="result-reason">{absenceReason}</p>
        ) : null}
      </section>

      {details.claims.length > 0 && selected ? (
        <section className="report-reader-grid">
          <div className="passage-column">
            <h2>{copy.passages}</h2>
            <ol className="claim-passage-list">
              {investigatedClaims.map(renderClaim)}
              {uninvestigatedClaims.slice(0, 3).map(renderClaim)}
            </ol>
            {hiddenUninvestigated > 0 ? (
              <>
                <div
                  className={`pending-claims-overflow ${showAllUninvestigated ? "expanded" : ""}`}
                  aria-hidden={!showAllUninvestigated}
                >
                  <div>
                    <ol className="claim-passage-list pending-claim-list">
                      {uninvestigatedClaims.slice(3).map(renderClaim)}
                    </ol>
                  </div>
                </div>
                <button
                  className="pending-claims-toggle"
                  type="button"
                  aria-expanded={showAllUninvestigated}
                  onClick={() =>
                    setShowAllUninvestigated((current) => !current)
                  }
                >
                  {showAllUninvestigated
                    ? copy.showFewerClaims
                    : copy.showMoreClaims.replace(
                        "{count}",
                        String(hiddenUninvestigated),
                      )}
                  <ChevronAbajo aria-hidden="true" size={18} />
                </button>
              </>
            ) : null}
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

      <section className="report-metrics-footer" aria-label={copy.formula}>
        <dl>
          <div>
            <dt>{copy.coverage}</dt>
            <dd>
              {details.evidenceCoverage === null
                ? "—"
                : `${details.evidenceCoverage}%`}
            </dd>
          </div>
          <div>
            <dt>{copy.supportIndex}</dt>
            <dd>
              {details.supportIndex === null
                ? copy.unavailable
                : `${details.supportIndex}%`}
            </dd>
          </div>
        </dl>
        {details.supportIndex === null ? <p>{absenceReason}</p> : null}
      </section>

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
