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
  PublicEvidenceRecord,
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
    reviewedClaims: "Claims reviewed",
    evaluationDetails: "Evaluation details",
    why: "Why",
    sourcesConsulted: "Sources consulted",
    showOriginal: "Show original excerpt",
    showTranslation: "Show translation",
    expandEvidence: "Show source excerpt",
    collapseEvidence: "Hide source excerpt",
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
    concludedWeight: "Concluded claim weight",
    totalWeight: "Total claim weight",
    weightedContribution: "Σ (weight × contribution)",
    includedWeight: "Included claim weight",
    contributionScale:
      "Contributions: supported 100% · misleading 50% · contradicted 0%",
    weight: "Weight",
    contribution: "Contribution",
    included: "Included",
    excluded: "Excluded",
    excludedReasons: {
      disputed: "Excluded because the evidence remains disputed",
      insufficient_evidence: "Excluded because evidence is insufficient",
      not_verifiable: "Excluded because it is not verifiable",
      pending: "Excluded because it was not investigated",
      other: "Excluded because it has no conclusive verdict",
    },
    showMoreClaims: "Show {count} more uninvestigated claims",
    showFewerClaims: "Hide additional uninvestigated claims",
    lowCoverage:
      "The index is withheld because weighted coverage is below 60%.",
    primaryMissing:
      "The index is withheld because a primary claim has no conclusion.",
    timeLimit: "Some claims were not investigated before the time limit.",
    platformLimit:
      "Some claims were not investigated because external platform capacity was unavailable.",
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
    reviewedClaims: "Afirmaciones revisadas",
    evaluationDetails: "Detalles de la evaluación",
    why: "Por qué",
    sourcesConsulted: "Fuentes consultadas",
    showOriginal: "Mostrar fragmento original",
    showTranslation: "Mostrar traducción",
    expandEvidence: "Mostrar fragmento de la fuente",
    collapseEvidence: "Ocultar fragmento de la fuente",
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
    concludedWeight: "Peso de afirmaciones concluidas",
    totalWeight: "Peso total de afirmaciones",
    weightedContribution: "Σ (peso × aporte)",
    includedWeight: "Peso de afirmaciones incluidas",
    contributionScale:
      "Aportes: respaldada 100 % · engañosa 50 % · contradicha 0 %",
    weight: "Peso",
    contribution: "Aporte",
    included: "Incluida",
    excluded: "Excluida",
    excludedReasons: {
      disputed: "Excluida porque la evidencia permanece en disputa",
      insufficient_evidence: "Excluida porque no hay evidencia suficiente",
      not_verifiable: "Excluida porque no es verificable",
      pending: "Excluida porque no fue investigada",
      other: "Excluida porque no tiene un veredicto concluyente",
    },
    showMoreClaims: "Mostrar {count} afirmaciones no investigadas más",
    showFewerClaims: "Ocultar afirmaciones no investigadas adicionales",
    lowCoverage:
      "El índice no se publica porque la cobertura ponderada es menor al 60 %.",
    primaryMissing:
      "El índice no se publica porque una afirmación principal no tiene conclusión.",
    timeLimit:
      "Algunas afirmaciones no se investigaron antes del límite de tiempo.",
    platformLimit:
      "Algunas afirmaciones no se investigaron porque la capacidad de la plataforma externa no estaba disponible.",
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
    reviewedClaims: "Affirmations examinées",
    evaluationDetails: "Détails de l’évaluation",
    why: "Pourquoi",
    sourcesConsulted: "Sources consultées",
    showOriginal: "Afficher l’extrait original",
    showTranslation: "Afficher la traduction",
    expandEvidence: "Afficher l’extrait de la source",
    collapseEvidence: "Masquer l’extrait de la source",
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
    concludedWeight: "Poids des affirmations conclues",
    totalWeight: "Poids total des affirmations",
    weightedContribution: "Σ (poids × contribution)",
    includedWeight: "Poids des affirmations incluses",
    contributionScale:
      "Contributions : soutenue 100 % · trompeuse 50 % · contredite 0 %",
    weight: "Poids",
    contribution: "Contribution",
    included: "Incluse",
    excluded: "Exclue",
    excludedReasons: {
      disputed: "Exclue car les preuves restent contestées",
      insufficient_evidence: "Exclue car les preuves sont insuffisantes",
      not_verifiable: "Exclue car elle n’est pas vérifiable",
      pending: "Exclue car elle n’a pas été étudiée",
      other: "Exclue faute de verdict concluant",
    },
    showMoreClaims: "Afficher {count} affirmations non étudiées de plus",
    showFewerClaims: "Masquer les affirmations non étudiées supplémentaires",
    lowCoverage:
      "L’indice n’est pas publié car la couverture pondérée est inférieure à 60 %.",
    primaryMissing:
      "L’indice n’est pas publié car une affirmation principale reste sans conclusion.",
    timeLimit:
      "Certaines affirmations n’ont pas été étudiées avant la limite de temps.",
    platformLimit:
      "Certaines affirmations n’ont pas été étudiées faute de capacité disponible sur la plateforme externe.",
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
    reviewedClaims: "Afirmações revisadas",
    evaluationDetails: "Detalhes da avaliação",
    why: "Por quê",
    sourcesConsulted: "Fontes consultadas",
    showOriginal: "Mostrar trecho original",
    showTranslation: "Mostrar tradução",
    expandEvidence: "Mostrar trecho da fonte",
    collapseEvidence: "Ocultar trecho da fonte",
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
    concludedWeight: "Peso das afirmações concluídas",
    totalWeight: "Peso total das afirmações",
    weightedContribution: "Σ (peso × contribuição)",
    includedWeight: "Peso das afirmações incluídas",
    contributionScale:
      "Contribuições: respaldada 100% · enganosa 50% · contradita 0%",
    weight: "Peso",
    contribution: "Contribuição",
    included: "Incluída",
    excluded: "Excluída",
    excludedReasons: {
      disputed: "Excluída porque as evidências seguem em disputa",
      insufficient_evidence: "Excluída porque as evidências são insuficientes",
      not_verifiable: "Excluída porque não é verificável",
      pending: "Excluída porque não foi investigada",
      other: "Excluída porque não há veredito conclusivo",
    },
    showMoreClaims: "Mostrar mais {count} afirmações não investigadas",
    showFewerClaims: "Ocultar afirmações não investigadas adicionais",
    lowCoverage:
      "O índice não é publicado porque a cobertura ponderada está abaixo de 60%.",
    primaryMissing:
      "O índice não é publicado porque uma afirmação principal não tem conclusão.",
    timeLimit:
      "Algumas afirmações não foram investigadas antes do limite de tempo.",
    platformLimit:
      "Algumas afirmações não foram investigadas porque a capacidade da plataforma externa não estava disponível.",
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

function claimAnchorId(claim: PublicReportClaim) {
  return `claim-${claim.id}`;
}

function claimPreview(statement: string, maximumLength = 120) {
  const normalized = statement.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximumLength) return normalized;
  return `${normalized.slice(0, maximumLength - 1).trimEnd()}…`;
}

function normalizedEvidenceText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function evidenceHasUsefulTranslation(
  evidence: Pick<
    PublicEvidenceRecord,
    "originalFragment" | "translatedFragment"
  >,
) {
  return Boolean(
    evidence.translatedFragment &&
      normalizedEvidenceText(evidence.translatedFragment) !==
        normalizedEvidenceText(evidence.originalFragment),
  );
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
  const [expandedClaimIds, setExpandedClaimIds] = useState<Set<string>>(
    () => new Set(initialClaims[0] ? [initialClaims[0].id] : []),
  );
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Set<string>>(
    () =>
      new Set(
        initialClaims[0]?.evidence[0] ? [initialClaims[0].evidence[0].id] : [],
      ),
  );
  const [originalEvidenceIds, setOriginalEvidenceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showAllUninvestigated, setShowAllUninvestigated] = useState(false);
  useEffect(() => {
    const currentClaimIds = new Set(orderedClaims.map((claim) => claim.id));
    const currentEvidenceIds = new Set(
      orderedClaims.flatMap((claim) =>
        claim.evidence.map((evidence) => evidence.id),
      ),
    );
    setExpandedClaimIds(
      (current) =>
        new Set([...current].filter((id) => currentClaimIds.has(id))),
    );
    setExpandedEvidenceIds(
      (current) =>
        new Set([...current].filter((id) => currentEvidenceIds.has(id))),
    );
  }, [orderedClaims]);
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
    const expanded = expandedClaimIds.has(claim.id);
    const detailsId = `${claimAnchorId(claim)}-details`;
    const strength = claim.evidenceStrength
      ? copy.strengths[claim.evidenceStrength]
      : copy.strengths.none;
    return (
      <li
        className="claim-accordion-item"
        id={claimAnchorId(claim)}
        key={claim.id}
      >
        <button
          type="button"
          className="claim-summary"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => {
            setExpandedClaimIds((current) => {
              const next = new Set(current);
              if (expanded) next.delete(claim.id);
              else next.add(claim.id);
              return next;
            });
            if (!expanded && claim.evidence[0]) {
              setExpandedEvidenceIds((current) =>
                new Set(current).add(claim.evidence[0].id),
              );
            }
          }}
        >
          <span className="claim-summary-copy">
            <span className="claim-number">
              {copy.claim} {claim.ordinal}
            </span>
            <span className="claim-statement">{claim.statement}</span>
            <span className="claim-summary-result">
              <span className={`verdict-label verdict-${verdict}`}>
                <VerdictIcon verdict={verdict} />
                {copy.verdicts[verdict]}
              </span>
              <span className="claim-strength-inline">
                {copy.strength}: {strength}
              </span>
            </span>
          </span>
          <span className="claim-summary-chevron">
            <ChevronAbajo
              className="claim-chevron-icon"
              aria-hidden="true"
              size={24}
            />
          </span>
        </button>
        {expanded ? (
          <div className="claim-accordion-detail" id={detailsId}>
            <section className="claim-evaluation-details">
              <h3>{copy.evaluationDetails}</h3>
              <dl className="claim-metadata">
                <div>
                  <dt>{copy.strength}</dt>
                  <dd>{strength}</dd>
                </div>
                <div>
                  <dt>{copy.period}</dt>
                  <dd>{claim.referencePeriod}</dd>
                </div>
                <div>
                  <dt>{copy.scope}</dt>
                  <dd>{claim.referenceScope}</dd>
                </div>
              </dl>
            </section>
            {claim.explanation ? (
              <section className="claim-explanation">
                <h3>{copy.why}</h3>
                <p>{claim.explanation}</p>
              </section>
            ) : null}
            <section className="evidence-section">
              <h3>{copy.sourcesConsulted}</h3>
              {claim.evidence.length === 0 ? (
                <p className="empty-evidence">{copy.noEvidence}</p>
              ) : (
                <div className="evidence-list">
                  {claim.evidence.map((evidence) => {
                    const evidenceExpanded = expandedEvidenceIds.has(
                      evidence.id,
                    );
                    const hasTranslation =
                      evidenceHasUsefulTranslation(evidence);
                    const showingOriginal =
                      !hasTranslation || originalEvidenceIds.has(evidence.id);
                    const excerpt = showingOriginal
                      ? evidence.originalFragment
                      : evidence.translatedFragment;
                    const excerptId = `evidence-${evidence.id}-excerpt`;
                    const sourceName =
                      evidence.title ?? new URL(evidence.canonicalUrl).hostname;
                    return (
                      <article className="evidence-record" key={evidence.id}>
                        <div className="evidence-record-summary">
                          <div>
                            <div className="evidence-heading">
                              <span>{copy.hierarchy[evidence.hierarchy]}</span>
                              <span>{copy.relation[evidence.relation]}</span>
                            </div>
                            <a
                              href={evidence.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {sourceName}
                              <EnlaceExterno size={16} aria-hidden="true" />
                            </a>
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
                              <LocalDate
                                value={evidence.consultedAt}
                                locale={locale}
                              />
                            </p>
                          </div>
                          <button
                            className="evidence-record-toggle"
                            type="button"
                            aria-expanded={evidenceExpanded}
                            aria-controls={excerptId}
                            aria-label={`${evidenceExpanded ? copy.collapseEvidence : copy.expandEvidence}: ${sourceName}`}
                            onClick={() => {
                              setExpandedEvidenceIds((current) => {
                                const next = new Set(current);
                                if (evidenceExpanded) next.delete(evidence.id);
                                else next.add(evidence.id);
                                return next;
                              });
                            }}
                          >
                            <ChevronAbajo
                              className="evidence-chevron-icon"
                              aria-hidden="true"
                              size={22}
                            />
                          </button>
                        </div>
                        {evidenceExpanded ? (
                          <div
                            className="evidence-record-detail"
                            id={excerptId}
                          >
                            <blockquote
                              className={showingOriginal ? "" : "translation"}
                            >
                              <b>
                                {showingOriginal
                                  ? copy.original
                                  : copy.translation}
                              </b>
                              <p
                                className="evidence-excerpt-text"
                                lang={
                                  showingOriginal
                                    ? evidence.originalLanguage
                                    : undefined
                                }
                              >
                                {excerpt}
                              </p>
                            </blockquote>
                            {hasTranslation ? (
                              <button
                                className="evidence-language-toggle"
                                type="button"
                                onClick={() =>
                                  setOriginalEvidenceIds((current) => {
                                    const next = new Set(current);
                                    if (showingOriginal)
                                      next.delete(evidence.id);
                                    else next.add(evidence.id);
                                    return next;
                                  })
                                }
                              >
                                {showingOriginal
                                  ? copy.showTranslation
                                  : copy.showOriginal}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
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
          <section className="outcome-evaluation-details">
            <h3>{copy.evaluationDetails}</h3>
            <p className="result-reason">{absenceReason}</p>
          </section>
        ) : null}
      </section>

      {details.claims.length > 0 ? (
        <section className="report-claims">
          <h2>
            {copy.reviewedClaims}{" "}
            <span className="report-claims-count">
              ({details.claims.length})
            </span>
          </h2>
          <ol className="claim-accordion-list">
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
                  <ol className="claim-accordion-list pending-claim-list">
                    {uninvestigatedClaims.slice(3).map(renderClaim)}
                  </ol>
                </div>
              </div>
              <button
                className="pending-claims-toggle"
                type="button"
                aria-expanded={showAllUninvestigated}
                onClick={() => setShowAllUninvestigated((current) => !current)}
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
        <div className="formula-explanation">
          <div className="formula-definition">
            <span>{copy.coverage}</span>
            <p className="formula-expression">
              <span>{copy.concludedWeight}</span>
              <span aria-hidden="true" className="formula-divider" />
              <span>{copy.totalWeight}</span>
            </p>
          </div>
          <div className="formula-definition">
            <span>{copy.supportIndex}</span>
            <p className="formula-expression">
              <span>{copy.weightedContribution}</span>
              <span aria-hidden="true" className="formula-divider" />
              <span>{copy.includedWeight}</span>
            </p>
          </div>
          <p className="contribution-scale">{copy.contributionScale}</p>
        </div>
        <table className="formula-table">
          <tbody>
            {details.claims.map((claim) => {
              const verdict = claimVerdict(claim);
              const exclusionReason =
                verdict === "disputed" ||
                verdict === "insufficient_evidence" ||
                verdict === "not_verifiable" ||
                verdict === "pending"
                  ? copy.excludedReasons[verdict]
                  : copy.excludedReasons.other;
              const preview = claimPreview(claim.statement);
              return (
                <tr key={claim.id}>
                  <td>
                    <a
                      aria-label={`${copy.claim} ${claim.ordinal}: ${preview}`}
                      className="formula-claim-link"
                      data-tooltip={preview}
                      href={`#${claimAnchorId(claim)}`}
                      onClick={() => {
                        setExpandedClaimIds((current) =>
                          new Set(current).add(claim.id),
                        );
                        if (claim.evidence[0]) {
                          setExpandedEvidenceIds((current) =>
                            new Set(current).add(claim.evidence[0].id),
                          );
                        }
                        if (uninvestigatedClaims.indexOf(claim) >= 3) {
                          setShowAllUninvestigated(true);
                        }
                      }}
                    >
                      {copy.claim} {claim.ordinal}
                    </a>
                  </td>
                  <td>
                    {copy.weight}: {claim.weight}
                  </td>
                  <td>
                    {claim.includedInIndex
                      ? `${copy.included} · ${copy.contribution}: ${claim.contribution ?? 0}%`
                      : exclusionReason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </>
  );
}
