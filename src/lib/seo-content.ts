import type { SupportedLocale } from "../domain/reports";

type SeoContent = {
  homeTitle: string;
  homeDescription: string;
  howTitle: string;
  howIntro: string;
  steps: readonly { title: string; body: string }[];
  coverageTitle: string;
  coverageIntro: string;
  coverage: readonly { title: string; body: string }[];
  faqTitle: string;
  faq: readonly { question: string; answer: string }[];
  methodologyDescription: string;
  methodologySections: readonly {
    title: string;
    paragraphs: readonly string[];
  }[];
  privacyDescription: string;
};

export const seoContent: Record<SupportedLocale, SeoContent> = {
  en: {
    homeTitle: "Fact-check news, links and screenshots",
    homeDescription:
      "Check factual claims in a public article, social post or screenshot against traceable evidence. Get a dated, claim-by-claim verification report.",
    howTitle: "How the fact-check works",
    howIntro:
      "News Verifier turns a public link or readable screenshot into an auditable evidence report. It evaluates specific factual claims instead of rating a publisher or author.",
    steps: [
      {
        title: "Submit the source",
        body: "Paste a public HTTP or HTTPS page, or upload a clear PNG, JPEG or WebP screenshot.",
      },
      {
        title: "Identify the claims",
        body: "The verifier extracts the main content, separates verifiable statements and preserves the context needed to understand them.",
      },
      {
        title: "Compare evidence",
        body: "Each prioritized claim is checked against retrieved sources, with citations, limitations and uncertainty shown in the report.",
      },
    ],
    coverageTitle: "What the report tells you",
    coverageIntro:
      "The result is a dated snapshot of the evidence found during the investigation, not a claim of permanent or absolute truth.",
    coverage: [
      {
        title: "Claim-by-claim verdicts",
        body: "See whether available evidence supports, contradicts or complicates each factual statement.",
      },
      {
        title: "Traceable sources",
        body: "Open the sources behind each conclusion and read the exact evidence fragment used.",
      },
      {
        title: "Visible uncertainty",
        body: "Missing, conflicting or insufficient evidence stays visible instead of being converted into a confident answer.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        question: "Can I verify a social media screenshot?",
        answer:
          "Yes. Upload a clear screenshot with readable text. The image is processed for text recognition and is not stored after OCR finishes.",
      },
      {
        question: "Does a low score mean the whole article is false?",
        answer:
          "No. The verifier evaluates individual factual claims and reports evidence coverage. It does not judge every sentence, the author’s intent or a publisher’s reputation.",
      },
      {
        question: "Can the verifier guarantee that a claim is true?",
        answer:
          "No. Reports describe how a claim relates to evidence available at a specific time. Sources can be incomplete, disputed or later corrected.",
      },
    ],
    methodologyDescription:
      "Learn how News Verifier extracts claims, validates citations, weighs independent evidence and reports uncertainty in automated fact-checking.",
    methodologySections: [
      {
        title: "Evaluate claims, not reputations",
        paragraphs: [
          "The system isolates concrete factual statements. Opinions, predictions and purely subjective judgments are excluded, and the source being analyzed cannot serve as proof of its own claims.",
        ],
      },
      {
        title: "Retrieve and validate evidence",
        paragraphs: [
          "Search results and snippets are used only to discover sources. A citation counts only when the server retrieves the page and verifies that the quoted fragment exists in its normalized text.",
        ],
      },
      {
        title: "Prefer authority and independence",
        paragraphs: [
          "Authority is judged in relation to the claim. Multiple pages that repeat the same study, press release or dataset count as one line of evidence, not several independent confirmations.",
        ],
      },
      {
        title: "Apply bounded verdicts",
        paragraphs: [
          "A claim can be supported, contradicted, misleading, disputed, insufficiently evidenced or not verifiable. Conclusions apply to the stated time, place and scope of the investigation.",
        ],
      },
      {
        title: "Show uncertainty",
        paragraphs: [
          "A lack of evidence is never treated as proof that a claim is false. Weak, conflicting or incomplete evidence lowers the strength and coverage of the report instead of being hidden.",
        ],
      },
      {
        title: "Keep reports reproducible",
        paragraphs: [
          "Reports are immutable, dated snapshots built from persisted claims and validated evidence records. They identify automated limitations and link every conclusion to its sources.",
        ],
      },
    ],
    privacyDescription:
      "Read how News Verifier processes links, screenshots, anonymous usage signals and unlisted evidence reports.",
  },
  es: {
    homeTitle: "Verifica noticias, enlaces y capturas",
    homeDescription:
      "Comprueba afirmaciones de una noticia, publicación o captura con evidencia rastreable. Obtén un informe fechado, afirmación por afirmación.",
    howTitle: "Cómo funciona la verificación",
    howIntro:
      "Verificador de noticias convierte un enlace público o una captura legible en un informe auditable de evidencia. Evalúa afirmaciones concretas en lugar de calificar al medio o al autor.",
    steps: [
      {
        title: "Envía la fuente",
        body: "Pega una página pública HTTP o HTTPS, o sube una captura clara en PNG, JPEG o WebP.",
      },
      {
        title: "Identifica las afirmaciones",
        body: "El verificador extrae el contenido principal, separa los hechos comprobables y conserva el contexto necesario.",
      },
      {
        title: "Contrasta la evidencia",
        body: "Cada afirmación priorizada se compara con fuentes recuperadas y el informe muestra citas, límites e incertidumbre.",
      },
    ],
    coverageTitle: "Qué te dice el informe",
    coverageIntro:
      "El resultado es una instantánea fechada de la evidencia encontrada, no una declaración de verdad permanente o absoluta.",
    coverage: [
      {
        title: "Veredictos por afirmación",
        body: "Comprueba si la evidencia disponible respalda, contradice o matiza cada afirmación factual.",
      },
      {
        title: "Fuentes rastreables",
        body: "Abre las fuentes de cada conclusión y consulta el fragmento exacto de evidencia utilizado.",
      },
      {
        title: "Incertidumbre visible",
        body: "La evidencia ausente, conflictiva o insuficiente permanece visible y no se transforma en una respuesta segura.",
      },
    ],
    faqTitle: "Preguntas frecuentes",
    faq: [
      {
        question: "¿Puedo verificar una captura de redes sociales?",
        answer:
          "Sí. Sube una captura clara con texto legible. La imagen se procesa para reconocer el texto y no se almacena después de terminar el OCR.",
      },
      {
        question: "¿Un índice bajo significa que todo el artículo es falso?",
        answer:
          "No. El verificador evalúa afirmaciones factuales individuales y la cobertura de evidencia; no juzga cada frase, la intención del autor ni la reputación del medio.",
      },
      {
        question: "¿El verificador garantiza que una afirmación es verdadera?",
        answer:
          "No. El informe describe la relación entre una afirmación y la evidencia disponible en un momento concreto. Las fuentes pueden ser incompletas, disputadas o corregidas después.",
      },
    ],
    methodologyDescription:
      "Conoce cómo el Verificador de noticias extrae afirmaciones, valida citas, pondera evidencia independiente y comunica la incertidumbre.",
    methodologySections: [
      {
        title: "Evaluar afirmaciones, no reputaciones",
        paragraphs: [
          "El sistema aísla afirmaciones factuales concretas. Excluye opiniones, predicciones y juicios subjetivos, y la fuente analizada no puede probar sus propias afirmaciones.",
        ],
      },
      {
        title: "Recuperar y validar evidencia",
        paragraphs: [
          "Los resultados y snippets solo ayudan a descubrir fuentes. Una cita cuenta cuando el servidor recupera la página y verifica el fragmento en su texto normalizado.",
        ],
      },
      {
        title: "Priorizar autoridad e independencia",
        paragraphs: [
          "La autoridad depende de la afirmación. Varias páginas que repiten el mismo estudio, comunicado o dataset forman una sola línea de evidencia.",
        ],
      },
      {
        title: "Aplicar veredictos acotados",
        paragraphs: [
          "Una afirmación puede quedar respaldada, contradicha, engañosa, en disputa, sin evidencia suficiente o no verificable. La conclusión corresponde al periodo, lugar y ámbito indicados.",
        ],
      },
      {
        title: "Mostrar la incertidumbre",
        paragraphs: [
          "La falta de evidencia nunca demuestra falsedad. La evidencia débil, conflictiva o incompleta reduce la fuerza y la cobertura del informe en vez de ocultarse.",
        ],
      },
      {
        title: "Mantener informes reproducibles",
        paragraphs: [
          "Los informes son instantáneas inmutables y fechadas, construidas con afirmaciones y registros de evidencia validados. Cada conclusión enlaza sus fuentes y declara sus límites automatizados.",
        ],
      },
    ],
    privacyDescription:
      "Consulta cómo el Verificador de noticias procesa enlaces, capturas, señales anónimas de uso e informes de evidencia no listados.",
  },
  fr: {
    homeTitle: "Vérifiez des actualités, liens et captures",
    homeDescription:
      "Vérifiez les affirmations d’un article, d’une publication ou d’une capture avec des preuves traçables et un rapport daté, affirmation par affirmation.",
    howTitle: "Comment fonctionne la vérification",
    howIntro:
      "Le Vérificateur d’actualités transforme un lien public ou une capture lisible en rapport de preuves auditable. Il évalue des faits précis plutôt que la réputation d’un média.",
    steps: [
      {
        title: "Soumettez la source",
        body: "Collez une page HTTP ou HTTPS publique, ou importez une capture PNG, JPEG ou WebP lisible.",
      },
      {
        title: "Identifiez les affirmations",
        body: "Le vérificateur extrait le contenu principal, sépare les faits vérifiables et conserve le contexte utile.",
      },
      {
        title: "Comparez les preuves",
        body: "Chaque affirmation prioritaire est comparée à des sources récupérées, avec citations, limites et incertitudes.",
      },
    ],
    coverageTitle: "Ce que le rapport vous apprend",
    coverageIntro:
      "Le résultat est un instantané daté des preuves trouvées, et non une déclaration de vérité absolue ou permanente.",
    coverage: [
      {
        title: "Verdicts par affirmation",
        body: "Voyez si les preuves disponibles soutiennent, contredisent ou nuancent chaque affirmation factuelle.",
      },
      {
        title: "Sources traçables",
        body: "Ouvrez les sources de chaque conclusion et consultez le fragment exact utilisé.",
      },
      {
        title: "Incertitude visible",
        body: "Les preuves absentes, contradictoires ou insuffisantes restent visibles au lieu de devenir une réponse certaine.",
      },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      {
        question: "Puis-je vérifier une capture de réseau social ?",
        answer:
          "Oui. Importez une capture nette au texte lisible. L’image sert à reconnaître le texte et n’est pas conservée après l’OCR.",
      },
      {
        question:
          "Un indice faible signifie-t-il que tout l’article est faux ?",
        answer:
          "Non. Le vérificateur évalue des faits individuels et la couverture des preuves, pas chaque phrase, l’intention de l’auteur ou la réputation du média.",
      },
      {
        question:
          "Le vérificateur peut-il garantir qu’une affirmation est vraie ?",
        answer:
          "Non. Le rapport décrit le lien entre une affirmation et les preuves disponibles à un moment donné. Les sources peuvent être incomplètes, contestées ou corrigées.",
      },
    ],
    methodologyDescription:
      "Découvrez comment le Vérificateur d’actualités extrait les affirmations, valide les citations, compare les sources indépendantes et expose l’incertitude.",
    methodologySections: [
      {
        title: "Évaluer les faits, pas les réputations",
        paragraphs: [
          "Le système isole les affirmations factuelles. Il exclut opinions, prédictions et jugements subjectifs, et la source analysée ne peut pas prouver ses propres affirmations.",
        ],
      },
      {
        title: "Récupérer et valider les preuves",
        paragraphs: [
          "Les résultats de recherche servent uniquement à découvrir des sources. Une citation compte lorsque le serveur récupère la page et vérifie le passage dans son texte normalisé.",
        ],
      },
      {
        title: "Privilégier autorité et indépendance",
        paragraphs: [
          "L’autorité dépend de l’affirmation. Plusieurs pages reprenant la même étude, annonce ou base de données forment une seule ligne de preuve.",
        ],
      },
      {
        title: "Appliquer des verdicts délimités",
        paragraphs: [
          "Une affirmation peut être étayée, contredite, trompeuse, contestée, insuffisamment étayée ou invérifiable. La conclusion dépend de la période, du lieu et du périmètre indiqués.",
        ],
      },
      {
        title: "Rendre l’incertitude visible",
        paragraphs: [
          "L’absence de preuve ne démontre jamais la fausseté. Les preuves faibles, contradictoires ou incomplètes réduisent la force et la couverture du rapport.",
        ],
      },
      {
        title: "Conserver des rapports reproductibles",
        paragraphs: [
          "Les rapports sont des instantanés immuables et datés, fondés sur des affirmations et preuves validées. Chaque conclusion relie ses sources et indique les limites de l’automatisation.",
        ],
      },
    ],
    privacyDescription:
      "Découvrez comment le Vérificateur d’actualités traite les liens, captures, signaux anonymes et rapports de preuves non répertoriés.",
  },
  pt: {
    homeTitle: "Verifique notícias, links e capturas",
    homeDescription:
      "Confira afirmações de notícias, publicações e capturas com evidências rastreáveis e receba um relatório datado, afirmação por afirmação.",
    howTitle: "Como funciona a verificação",
    howIntro:
      "O Verificador de notícias transforma um link público ou captura legível em um relatório auditável. Ele avalia fatos específicos, não a reputação da fonte.",
    steps: [
      {
        title: "Envie a fonte",
        body: "Cole uma página HTTP ou HTTPS pública, ou envie uma captura nítida em PNG, JPEG ou WebP.",
      },
      {
        title: "Identifique as afirmações",
        body: "O verificador extrai o conteúdo principal, separa fatos verificáveis e preserva o contexto necessário.",
      },
      {
        title: "Compare as evidências",
        body: "Cada afirmação prioritária é comparada a fontes recuperadas, com citações, limites e incerteza no relatório.",
      },
    ],
    coverageTitle: "O que o relatório mostra",
    coverageIntro:
      "O resultado é um retrato datado das evidências encontradas, não uma declaração de verdade absoluta ou permanente.",
    coverage: [
      {
        title: "Vereditos por afirmação",
        body: "Veja se as evidências disponíveis apoiam, contradizem ou contextualizam cada afirmação factual.",
      },
      {
        title: "Fontes rastreáveis",
        body: "Abra as fontes de cada conclusão e confira o trecho exato usado como evidência.",
      },
      {
        title: "Incerteza visível",
        body: "Evidências ausentes, conflitantes ou insuficientes continuam visíveis em vez de virarem uma resposta confiante.",
      },
    ],
    faqTitle: "Perguntas frequentes",
    faq: [
      {
        question: "Posso verificar uma captura de rede social?",
        answer:
          "Sim. Envie uma captura nítida com texto legível. A imagem é processada para reconhecer o texto e não é armazenada após o OCR.",
      },
      {
        question: "Um índice baixo significa que todo o artigo é falso?",
        answer:
          "Não. O verificador avalia fatos individuais e a cobertura das evidências; não julga cada frase, a intenção do autor nem a reputação do veículo.",
      },
      {
        question: "O verificador garante que uma afirmação é verdadeira?",
        answer:
          "Não. O relatório descreve a relação entre uma afirmação e as evidências disponíveis em um momento específico. As fontes podem ser incompletas, contestadas ou corrigidas.",
      },
    ],
    methodologyDescription:
      "Saiba como o Verificador de notícias extrai afirmações, valida citações, compara evidências independentes e comunica incerteza.",
    methodologySections: [
      {
        title: "Avaliar fatos, não reputações",
        paragraphs: [
          "O sistema isola afirmações factuais. Opiniões, previsões e julgamentos subjetivos ficam de fora, e a fonte analisada não pode provar as próprias afirmações.",
        ],
      },
      {
        title: "Recuperar e validar evidências",
        paragraphs: [
          "Resultados e snippets servem apenas para descobrir fontes. Uma citação conta quando o servidor recupera a página e confirma o trecho no texto normalizado.",
        ],
      },
      {
        title: "Priorizar autoridade e independência",
        paragraphs: [
          "A autoridade depende da afirmação. Várias páginas que repetem o mesmo estudo, comunicado ou conjunto de dados formam uma só linha de evidência.",
        ],
      },
      {
        title: "Aplicar vereditos delimitados",
        paragraphs: [
          "Uma afirmação pode ser apoiada, contradita, enganosa, contestada, sem evidência suficiente ou não verificável. A conclusão vale para o período, local e escopo indicados.",
        ],
      },
      {
        title: "Mostrar a incerteza",
        paragraphs: [
          "A falta de evidência nunca prova falsidade. Evidências fracas, conflitantes ou incompletas reduzem a força e a cobertura do relatório em vez de serem ocultadas.",
        ],
      },
      {
        title: "Manter relatórios reproduzíveis",
        paragraphs: [
          "Os relatórios são retratos imutáveis e datados, criados a partir de afirmações e evidências validadas. Cada conclusão liga suas fontes e declara os limites da automação.",
        ],
      },
    ],
    privacyDescription:
      "Veja como o Verificador de notícias processa links, capturas, sinais anônimos de uso e relatórios de evidências não listados.",
  },
};
