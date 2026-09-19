import type { SupportedLocale } from "../domain/reports";
import { isSupportedLocale } from "../domain/reports";

export type Messages = (typeof messages)["en"];

export const messages = {
  en: {
    brand: "News Verifier",
    eyebrow: "Evidence, not vibes.",
    heroTitle: "Check what a post actually claims.",
    heroBody:
      "Paste a public link or upload a screenshot. We extract its claims and contrast them with traceable evidence.",
    linkMode: "Link",
    imageMode: "Upload screenshot",
    linkLabel: "Public page URL",
    linkPlaceholder: "https://example.com/article",
    imageLabel: "PNG, JPEG or WebP",
    imageSoon: "Screenshot verification is being prepared.",
    submit: "Verify this source",
    submitting: "Creating report…",
    inputNote: "One source at a time · up to 2,000 words",
    privacy: "Privacy policy",
    methodology: "Methodology",
    language: "Language",
    genericError: "We could not start the investigation. Please try again.",
    invalidUrl: "Enter a valid public HTTP or HTTPS URL.",
    visitorQuotaReached:
      "This browser has reached today’s verification limit. Try again tomorrow.",
    globalQuotaReached:
      "Today’s shared verification capacity has been reached. Try again tomorrow.",
    reportTitle: "Investigation report",
    reportQueued: "Waiting for capacity",
    reportExtracting: "Extracting the main content",
    reportReady: "Content prepared",
    reportFailed: "Extraction could not be completed",
    extractionError:
      "We could not extract enough reliable text from this page. Check that it is public and try another source.",
    investigationError:
      "The investigation could not be completed because its research service was unavailable.",
    partialNotice:
      "The source was extracted successfully. Factual research will continue as the investigation engine is enabled.",
    analyzedWords: "Words analyzed",
    extractedWords: "Words extracted",
    truncated: "Only the first 2,000 words were analyzed.",
    source: "Original page",
    createdAt: "Investigation started",
    automatedLimit:
      "This is an automated, dated analysis of evidence—not a declaration of absolute truth.",
    notFound: "This report does not exist or is unavailable.",
    backHome: "Back to verifier",
    privacyTitle: "Privacy policy",
    privacyIntro:
      "We process the submitted page to create an evidence report. Screenshot files are not stored; report data remains available through its unlisted URL.",
    methodologyTitle: "Verification methodology",
    methodologyIntro:
      "Claims are evaluated against retrieved, traceable evidence. Missing evidence is never treated as proof that a claim is false.",
  },
  es: {
    brand: "Verificador de noticias",
    eyebrow: "Evidencia, no intuiciones.",
    heroTitle: "Comprueba qué afirma realmente una publicación.",
    heroBody:
      "Pega un enlace público o sube una captura. Extraemos sus afirmaciones y las contrastamos con evidencia rastreable.",
    linkMode: "Enlace",
    imageMode: "Subir captura",
    linkLabel: "URL de la página pública",
    linkPlaceholder: "https://ejemplo.com/articulo",
    imageLabel: "PNG, JPEG o WebP",
    imageSoon: "La verificación de capturas se está preparando.",
    submit: "Verificar esta fuente",
    submitting: "Creando informe…",
    inputNote: "Una fuente a la vez · hasta 2.000 palabras",
    privacy: "Política de privacidad",
    methodology: "Metodología",
    language: "Idioma",
    genericError: "No pudimos iniciar la investigación. Inténtalo de nuevo.",
    invalidUrl: "Ingresa una URL pública HTTP o HTTPS válida.",
    visitorQuotaReached:
      "Este navegador alcanzó el límite de verificaciones de hoy. Inténtalo mañana.",
    globalQuotaReached:
      "Se alcanzó la capacidad compartida de verificaciones de hoy. Inténtalo mañana.",
    reportTitle: "Informe de investigación",
    reportQueued: "Esperando capacidad",
    reportExtracting: "Extrayendo el contenido principal",
    reportReady: "Contenido preparado",
    reportFailed: "No se pudo completar la extracción",
    extractionError:
      "No pudimos extraer suficiente texto fiable de esta página. Comprueba que sea pública e intenta con otra fuente.",
    investigationError:
      "No se pudo completar la investigación porque el servicio de análisis no estaba disponible.",
    partialNotice:
      "La fuente se extrajo correctamente. La investigación factual continuará cuando se habilite el motor de investigación.",
    analyzedWords: "Palabras analizadas",
    extractedWords: "Palabras extraídas",
    truncated: "Solo se analizaron las primeras 2.000 palabras.",
    source: "Página original",
    createdAt: "Investigación iniciada",
    automatedLimit:
      "Este es un análisis automatizado y fechado de evidencia, no una declaración de verdad absoluta.",
    notFound: "Este informe no existe o no está disponible.",
    backHome: "Volver al verificador",
    privacyTitle: "Política de privacidad",
    privacyIntro:
      "Procesamos la página enviada para crear un informe de evidencia. Las capturas no se almacenan; los datos del informe permanecen disponibles mediante su URL no listada.",
    methodologyTitle: "Metodología de verificación",
    methodologyIntro:
      "Las afirmaciones se evalúan mediante evidencia recuperada y rastreable. La ausencia de evidencia nunca se trata como prueba de falsedad.",
  },
  fr: {
    brand: "Vérificateur d’actualités",
    eyebrow: "Des preuves, pas des impressions.",
    heroTitle: "Vérifiez ce qu’une publication affirme vraiment.",
    heroBody:
      "Collez un lien public ou importez une capture. Nous extrayons ses affirmations et les confrontons à des preuves traçables.",
    linkMode: "Lien",
    imageMode: "Importer une capture",
    linkLabel: "URL de la page publique",
    linkPlaceholder: "https://exemple.com/article",
    imageLabel: "PNG, JPEG ou WebP",
    imageSoon: "La vérification des captures est en préparation.",
    submit: "Vérifier cette source",
    submitting: "Création du rapport…",
    inputNote: "Une source à la fois · jusqu’à 2 000 mots",
    privacy: "Politique de confidentialité",
    methodology: "Méthodologie",
    language: "Langue",
    genericError: "Impossible de lancer l’enquête. Veuillez réessayer.",
    invalidUrl: "Saisissez une URL publique HTTP ou HTTPS valide.",
    visitorQuotaReached:
      "Ce navigateur a atteint la limite de vérifications du jour. Réessayez demain.",
    globalQuotaReached:
      "La capacité partagée de vérification du jour est atteinte. Réessayez demain.",
    reportTitle: "Rapport d’enquête",
    reportQueued: "En attente de capacité",
    reportExtracting: "Extraction du contenu principal",
    reportReady: "Contenu préparé",
    reportFailed: "L’extraction n’a pas pu être terminée",
    extractionError:
      "Nous n’avons pas pu extraire assez de texte fiable de cette page. Vérifiez qu’elle est publique et essayez une autre source.",
    investigationError:
      "L’enquête n’a pas pu être terminée car le service d’analyse était indisponible.",
    partialNotice:
      "La source a été extraite. La recherche factuelle continuera lorsque le moteur d’enquête sera activé.",
    analyzedWords: "Mots analysés",
    extractedWords: "Mots extraits",
    truncated: "Seuls les 2 000 premiers mots ont été analysés.",
    source: "Page d’origine",
    createdAt: "Enquête démarrée",
    automatedLimit:
      "Il s’agit d’une analyse automatisée et datée des preuves, et non d’une vérité absolue.",
    notFound: "Ce rapport n’existe pas ou n’est pas disponible.",
    backHome: "Retour au vérificateur",
    privacyTitle: "Politique de confidentialité",
    privacyIntro:
      "Nous traitons la page envoyée pour créer un rapport de preuves. Les captures ne sont pas stockées ; les données du rapport restent accessibles via son URL non répertoriée.",
    methodologyTitle: "Méthodologie de vérification",
    methodologyIntro:
      "Les affirmations sont évaluées à partir de preuves récupérées et traçables. L’absence de preuve n’est jamais considérée comme une preuve de fausseté.",
  },
  pt: {
    brand: "Verificador de notícias",
    eyebrow: "Evidências, não palpites.",
    heroTitle: "Confira o que uma publicação realmente afirma.",
    heroBody:
      "Cole um link público ou envie uma captura. Extraímos suas afirmações e as comparamos com evidências rastreáveis.",
    linkMode: "Link",
    imageMode: "Enviar captura",
    linkLabel: "URL da página pública",
    linkPlaceholder: "https://exemplo.com/artigo",
    imageLabel: "PNG, JPEG ou WebP",
    imageSoon: "A verificação de capturas está sendo preparada.",
    submit: "Verificar esta fonte",
    submitting: "Criando relatório…",
    inputNote: "Uma fonte por vez · até 2.000 palavras",
    privacy: "Política de privacidade",
    methodology: "Metodologia",
    language: "Idioma",
    genericError: "Não foi possível iniciar a investigação. Tente novamente.",
    invalidUrl: "Insira uma URL pública HTTP ou HTTPS válida.",
    visitorQuotaReached:
      "Este navegador atingiu o limite de verificações de hoje. Tente novamente amanhã.",
    globalQuotaReached:
      "A capacidade compartilhada de verificações de hoje foi atingida. Tente novamente amanhã.",
    reportTitle: "Relatório da investigação",
    reportQueued: "Aguardando capacidade",
    reportExtracting: "Extraindo o conteúdo principal",
    reportReady: "Conteúdo preparado",
    reportFailed: "Não foi possível concluir a extração",
    extractionError:
      "Não foi possível extrair texto confiável suficiente desta página. Verifique se ela é pública e tente outra fonte.",
    investigationError:
      "Não foi possível concluir a investigação porque o serviço de análise estava indisponível.",
    partialNotice:
      "A fonte foi extraída com sucesso. A pesquisa factual continuará quando o mecanismo de investigação estiver ativo.",
    analyzedWords: "Palavras analisadas",
    extractedWords: "Palavras extraídas",
    truncated: "Apenas as primeiras 2.000 palavras foram analisadas.",
    source: "Página original",
    createdAt: "Investigação iniciada",
    automatedLimit:
      "Esta é uma análise automatizada e datada de evidências, não uma declaração de verdade absoluta.",
    notFound: "Este relatório não existe ou não está disponível.",
    backHome: "Voltar ao verificador",
    privacyTitle: "Política de privacidade",
    privacyIntro:
      "Processamos a página enviada para criar um relatório de evidências. As capturas não são armazenadas; os dados do relatório permanecem disponíveis por sua URL não listada.",
    methodologyTitle: "Metodologia de verificação",
    methodologyIntro:
      "As afirmações são avaliadas com evidências recuperadas e rastreáveis. A ausência de evidência nunca é tratada como prova de falsidade.",
  },
} as const;

export function resolveLocale(
  value: string | null | undefined,
): SupportedLocale {
  const candidate = value
    ?.trim()
    .toLowerCase()
    .split(/[-_,;]/u)[0];
  return isSupportedLocale(candidate) ? candidate : "en";
}

export function resolveAcceptedLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) return "en" as const;

  for (const entry of acceptLanguage.split(",")) {
    const locale = entry.split(";")[0];
    const resolved = resolveLocale(locale);
    if (resolved !== "en" || locale.trim().toLowerCase().startsWith("en")) {
      return resolved;
    }
  }

  return "en" as const;
}
