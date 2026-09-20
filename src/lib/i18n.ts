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
    inputType: "Input type",
    linkLabel: "Public page URL",
    linkPlaceholder: "https://example.com/article",
    imageLabel: "PNG, JPG/JPEG or WebP",
    imageHelp: "Maximum 4 MB · clear, readable text",
    submit: "Verify this source",
    submitting: "Creating report…",
    readingImage: "Reading screenshot…",
    privacy: "Privacy policy",
    methodology: "Methodology",
    language: "Language",
    productPrinciples: "Product principles",
    listingNotice:
      "Completed link reports may appear publicly on this page and in search engines.",
    recentReportsTitle: "Recent reports",
    recentReportsDescription: "Recently completed automated investigations.",
    requestRemoval: "Request removal",
    removalEmailSubject: "Removal request for report",
    removalEmailBody:
      "Please review the removal of this report from public listings and search engines:",
    reportSearchDescription:
      "Automated, dated evidence report with traceable sources and explicit uncertainty.",
    principleEvidence: "Traceable evidence",
    principleClaims: "Claim by claim",
    principleUncertainty: "Honest uncertainty",
    genericError: "We could not start the investigation. Please try again.",
    invalidUrl: "Enter a valid public HTTP or HTTPS URL.",
    visitorQuotaReached:
      "This browser has reached today’s verification limit. Try again tomorrow.",
    globalQuotaReached:
      "Today’s shared verification capacity has been reached. Try again tomorrow.",
    imageTooLarge: "The screenshot must be 4 MB or smaller.",
    invalidImage: "Choose a valid PNG, JPG/JPEG or WebP screenshot.",
    ocrQualityInsufficient:
      "We could not read enough reliable text from this screenshot. Try a clearer image.",
    ocrTimeout:
      "Reading this screenshot took too long. Try a smaller or clearer image.",
    ocrFailed: "We could not read this screenshot. Try another image.",
    reportTitle: "Investigation report",
    reportQueued: "Waiting for capacity",
    reportExtracting: "Extracting the main content",
    reportIdentifying: "Identifying verifiable claims",
    reportResearching: "Researching evidence",
    reportEvaluating: "Evaluating the evidence",
    reportGenerating: "Preparing the report",
    reportReady: "Content prepared",
    reportCompleted: "Investigation completed",
    reportPartial: "Partial investigation",
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
      "This is an automated, dated analysis of evidence—not a declaration of absolute truth or a substitute for medical, legal or financial advice.",
    notifyWhenReady: "Notify me when it’s ready",
    notificationsEnabled:
      "We’ll notify you in this tab when the report is ready.",
    notificationsDenied: "Notifications are blocked in your browser settings.",
    notificationsUnavailable:
      "Notifications are not available in this browser.",
    reportReadyTitle: "Report ready",
    reportReadyNotification: "Your evidence report is ready to review.",
    shareReport: "Share report",
    shareText: "Review this evidence report.",
    reportShared: "Report shared",
    reportLinkCopied: "Report link copied",
    shareError: "The report could not be shared. Try copying the URL.",
    reconnecting: "Connection interrupted. Reconnecting automatically…",
    notFound: "This report does not exist or is unavailable.",
    backHome: "Back to verifier",
    privacyTitle: "Privacy policy",
    privacyIntro:
      "We process submitted pages to create evidence reports. Eligible link reports are public and searchable; screenshot reports remain unlisted and screenshot files are not stored.",
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
    inputType: "Tipo de entrada",
    linkLabel: "URL de la página pública",
    linkPlaceholder: "https://ejemplo.com/articulo",
    imageLabel: "PNG, JPG/JPEG o WebP",
    imageHelp: "Máximo 4 MB · texto claro y legible",
    submit: "Verificar esta fuente",
    submitting: "Creando informe…",
    readingImage: "Leyendo captura…",
    privacy: "Política de privacidad",
    methodology: "Metodología",
    language: "Idioma",
    productPrinciples: "Principios del producto",
    listingNotice:
      "Los informes de enlaces completados pueden aparecer públicamente aquí y en buscadores.",
    recentReportsTitle: "Informes recientes",
    recentReportsDescription:
      "Investigaciones automatizadas completadas recientemente.",
    requestRemoval: "Solicitar retiro",
    removalEmailSubject: "Solicitud de retiro del informe",
    removalEmailBody:
      "Por favor, revisa el retiro de este informe de los listados públicos y buscadores:",
    reportSearchDescription:
      "Informe automatizado y fechado de evidencia con fuentes rastreables e incertidumbre explícita.",
    principleEvidence: "Evidencia rastreable",
    principleClaims: "Afirmación por afirmación",
    principleUncertainty: "Incertidumbre honesta",
    genericError: "No pudimos iniciar la investigación. Inténtalo de nuevo.",
    invalidUrl: "Ingresa una URL pública HTTP o HTTPS válida.",
    visitorQuotaReached:
      "Este navegador alcanzó el límite de verificaciones de hoy. Inténtalo mañana.",
    globalQuotaReached:
      "Se alcanzó la capacidad compartida de verificaciones de hoy. Inténtalo mañana.",
    imageTooLarge: "La captura debe pesar 4 MB o menos.",
    invalidImage: "Elige una captura PNG, JPG/JPEG o WebP válida.",
    ocrQualityInsufficient:
      "No pudimos leer suficiente texto fiable en esta captura. Prueba con una imagen más clara.",
    ocrTimeout:
      "La lectura de esta captura tardó demasiado. Prueba con una imagen más pequeña o clara.",
    ocrFailed: "No pudimos leer esta captura. Prueba con otra imagen.",
    reportTitle: "Informe de investigación",
    reportQueued: "Esperando capacidad",
    reportExtracting: "Extrayendo el contenido principal",
    reportIdentifying: "Identificando afirmaciones verificables",
    reportResearching: "Buscando evidencia",
    reportEvaluating: "Evaluando la evidencia",
    reportGenerating: "Preparando el informe",
    reportReady: "Contenido preparado",
    reportCompleted: "Investigación completada",
    reportPartial: "Investigación parcial",
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
      "Este es un análisis automatizado y fechado de evidencia, no una declaración de verdad absoluta ni un sustituto de asesoría médica, jurídica o financiera.",
    notifyWhenReady: "Avisarme cuando termine",
    notificationsEnabled:
      "Te avisaremos en esta pestaña cuando el informe esté listo.",
    notificationsDenied:
      "Las notificaciones están bloqueadas en la configuración del navegador.",
    notificationsUnavailable:
      "Las notificaciones no están disponibles en este navegador.",
    reportReadyTitle: "Informe listo",
    reportReadyNotification:
      "Tu informe de evidencia ya está listo para revisar.",
    shareReport: "Compartir informe",
    shareText: "Revisa este informe de evidencia.",
    reportShared: "Informe compartido",
    reportLinkCopied: "Enlace del informe copiado",
    shareError: "No se pudo compartir el informe. Prueba copiando la URL.",
    reconnecting: "Se interrumpió la conexión. Reconectando automáticamente…",
    notFound: "Este informe no existe o no está disponible.",
    backHome: "Volver al verificador",
    privacyTitle: "Política de privacidad",
    privacyIntro:
      "Procesamos las páginas enviadas para crear informes de evidencia. Los informes elegibles de enlaces son públicos y aparecen en buscadores; los de capturas permanecen no listados y sus archivos no se almacenan.",
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
    inputType: "Type d’entrée",
    linkLabel: "URL de la page publique",
    linkPlaceholder: "https://exemple.com/article",
    imageLabel: "PNG, JPG/JPEG ou WebP",
    imageHelp: "4 Mo maximum · texte clair et lisible",
    submit: "Vérifier cette source",
    submitting: "Création du rapport…",
    readingImage: "Lecture de la capture…",
    privacy: "Politique de confidentialité",
    methodology: "Méthodologie",
    language: "Langue",
    productPrinciples: "Principes du produit",
    listingNotice:
      "Les rapports de liens terminés peuvent apparaître publiquement ici et dans les moteurs de recherche.",
    recentReportsTitle: "Rapports récents",
    recentReportsDescription: "Enquêtes automatisées récemment terminées.",
    requestRemoval: "Demander le retrait",
    removalEmailSubject: "Demande de retrait du rapport",
    removalEmailBody:
      "Veuillez examiner le retrait de ce rapport des listes publiques et des moteurs de recherche :",
    reportSearchDescription:
      "Rapport de preuves automatisé et daté, avec sources traçables et incertitude explicite.",
    principleEvidence: "Preuves traçables",
    principleClaims: "Affirmation par affirmation",
    principleUncertainty: "Incertitude assumée",
    genericError: "Impossible de lancer l’enquête. Veuillez réessayer.",
    invalidUrl: "Saisissez une URL publique HTTP ou HTTPS valide.",
    visitorQuotaReached:
      "Ce navigateur a atteint la limite de vérifications du jour. Réessayez demain.",
    globalQuotaReached:
      "La capacité partagée de vérification du jour est atteinte. Réessayez demain.",
    imageTooLarge: "La capture doit peser 4 Mo ou moins.",
    invalidImage: "Choisissez une capture PNG, JPG/JPEG ou WebP valide.",
    ocrQualityInsufficient:
      "Nous n’avons pas pu lire assez de texte fiable sur cette capture. Essayez une image plus nette.",
    ocrTimeout:
      "La lecture de cette capture a pris trop de temps. Essayez une image plus petite ou plus nette.",
    ocrFailed:
      "Nous n’avons pas pu lire cette capture. Essayez une autre image.",
    reportTitle: "Rapport d’enquête",
    reportQueued: "En attente de capacité",
    reportExtracting: "Extraction du contenu principal",
    reportIdentifying: "Identification des affirmations vérifiables",
    reportResearching: "Recherche de preuves",
    reportEvaluating: "Évaluation des preuves",
    reportGenerating: "Préparation du rapport",
    reportReady: "Contenu préparé",
    reportCompleted: "Enquête terminée",
    reportPartial: "Enquête partielle",
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
      "Il s’agit d’une analyse automatisée et datée des preuves, et non d’une vérité absolue ni d’un conseil médical, juridique ou financier.",
    notifyWhenReady: "Me prévenir quand il sera prêt",
    notificationsEnabled:
      "Nous vous préviendrons dans cet onglet lorsque le rapport sera prêt.",
    notificationsDenied:
      "Les notifications sont bloquées dans les réglages du navigateur.",
    notificationsUnavailable:
      "Les notifications ne sont pas disponibles dans ce navigateur.",
    reportReadyTitle: "Rapport prêt",
    reportReadyNotification:
      "Votre rapport de preuves est prêt à être consulté.",
    shareReport: "Partager le rapport",
    shareText: "Consultez ce rapport de preuves.",
    reportShared: "Rapport partagé",
    reportLinkCopied: "Lien du rapport copié",
    shareError: "Le rapport n’a pas pu être partagé. Essayez de copier l’URL.",
    reconnecting: "Connexion interrompue. Reconnexion automatique…",
    notFound: "Ce rapport n’existe pas ou n’est pas disponible.",
    backHome: "Retour au vérificateur",
    privacyTitle: "Politique de confidentialité",
    privacyIntro:
      "Nous traitons les pages envoyées pour créer des rapports de preuves. Les rapports admissibles issus de liens sont publics et indexables ; ceux issus de captures restent non répertoriés et les fichiers ne sont pas stockés.",
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
    inputType: "Tipo de entrada",
    linkLabel: "URL da página pública",
    linkPlaceholder: "https://exemplo.com/artigo",
    imageLabel: "PNG, JPG/JPEG ou WebP",
    imageHelp: "Máximo de 4 MB · texto claro e legível",
    submit: "Verificar esta fonte",
    submitting: "Criando relatório…",
    readingImage: "Lendo captura…",
    privacy: "Política de privacidade",
    methodology: "Metodologia",
    language: "Idioma",
    productPrinciples: "Princípios do produto",
    listingNotice:
      "Relatórios de links concluídos podem aparecer publicamente aqui e nos mecanismos de busca.",
    recentReportsTitle: "Relatórios recentes",
    recentReportsDescription:
      "Investigações automatizadas concluídas recentemente.",
    requestRemoval: "Solicitar retirada",
    removalEmailSubject: "Solicitação de retirada do relatório",
    removalEmailBody:
      "Analise a retirada deste relatório das listagens públicas e dos mecanismos de busca:",
    reportSearchDescription:
      "Relatório automatizado e datado de evidências com fontes rastreáveis e incerteza explícita.",
    principleEvidence: "Evidências rastreáveis",
    principleClaims: "Afirmação por afirmação",
    principleUncertainty: "Incerteza honesta",
    genericError: "Não foi possível iniciar a investigação. Tente novamente.",
    invalidUrl: "Insira uma URL pública HTTP ou HTTPS válida.",
    visitorQuotaReached:
      "Este navegador atingiu o limite de verificações de hoje. Tente novamente amanhã.",
    globalQuotaReached:
      "A capacidade compartilhada de verificações de hoje foi atingida. Tente novamente amanhã.",
    imageTooLarge: "A captura deve ter no máximo 4 MB.",
    invalidImage: "Escolha uma captura PNG, JPG/JPEG ou WebP válida.",
    ocrQualityInsufficient:
      "Não foi possível ler texto confiável suficiente nesta captura. Tente uma imagem mais nítida.",
    ocrTimeout:
      "A leitura desta captura demorou demais. Tente uma imagem menor ou mais nítida.",
    ocrFailed: "Não foi possível ler esta captura. Tente outra imagem.",
    reportTitle: "Relatório da investigação",
    reportQueued: "Aguardando capacidade",
    reportExtracting: "Extraindo o conteúdo principal",
    reportIdentifying: "Identificando afirmações verificáveis",
    reportResearching: "Pesquisando evidências",
    reportEvaluating: "Avaliando as evidências",
    reportGenerating: "Preparando o relatório",
    reportReady: "Conteúdo preparado",
    reportCompleted: "Investigação concluída",
    reportPartial: "Investigação parcial",
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
      "Esta é uma análise automatizada e datada de evidências, não uma declaração de verdade absoluta nem orientação médica, jurídica ou financeira.",
    notifyWhenReady: "Avisar quando estiver pronto",
    notificationsEnabled:
      "Avisaremos nesta aba quando o relatório estiver pronto.",
    notificationsDenied:
      "As notificações estão bloqueadas nas configurações do navegador.",
    notificationsUnavailable:
      "As notificações não estão disponíveis neste navegador.",
    reportReadyTitle: "Relatório pronto",
    reportReadyNotification:
      "Seu relatório de evidências está pronto para revisão.",
    shareReport: "Compartilhar relatório",
    shareText: "Revise este relatório de evidências.",
    reportShared: "Relatório compartilhado",
    reportLinkCopied: "Link do relatório copiado",
    shareError:
      "Não foi possível compartilhar o relatório. Tente copiar a URL.",
    reconnecting: "Conexão interrompida. Reconectando automaticamente…",
    notFound: "Este relatório não existe ou não está disponível.",
    backHome: "Voltar ao verificador",
    privacyTitle: "Política de privacidade",
    privacyIntro:
      "Processamos páginas enviadas para criar relatórios de evidências. Relatórios elegíveis de links são públicos e pesquisáveis; relatórios de capturas permanecem não listados e seus arquivos não são armazenados.",
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
