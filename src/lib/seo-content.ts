import type { SupportedLocale } from "../domain/reports";

type SeoContent = {
  homeTitle: string;
  homeDescription: string;
  howTitle: string;
  howIntro: string;
  steps: readonly { title: string; body: string }[];
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
    homeTitle: "Analyze claims in news, links and screenshots",
    homeDescription:
      "Analyze the main claims in a public article, post or screenshot. Get an automated, dated report with sources you can open and limits you can see.",
    howTitle: "From publication to evidence report",
    howIntro:
      "The verifier examines concrete claims, not the reputation of the publisher or author. The result is an automated, dated report you can inspect.",
    steps: [
      {
        title: "Add the publication",
        body: "Paste the link to a public page or upload a clear PNG, JPG or WebP screenshot.",
      },
      {
        title: "Separate and compare claims",
        body: "The verifier identifies the main checkable statements and compares them with independent sources it can validate.",
      },
      {
        title: "Review the report",
        body: "See what supports, contradicts or complicates each claim, open the sources and identify what the evidence cannot establish.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        question: "Can I analyze a social media screenshot?",
        answer:
          "Yes. Upload a clear screenshot with readable text. The image is processed for text recognition and is not stored after OCR finishes.",
      },
      {
        question: "Does a low support index mean the whole article is false?",
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
    homeTitle: "Analiza afirmaciones en noticias, enlaces y capturas",
    homeDescription:
      "Analiza las afirmaciones principales de una noticia, publicación o captura. Recibe un informe automatizado y fechado con fuentes que puedes abrir y límites visibles.",
    howTitle: "De la publicación al informe de evidencia",
    howIntro:
      "El verificador examina afirmaciones concretas, no la reputación del medio o del autor. El resultado es un informe automatizado y fechado que puedes revisar.",
    steps: [
      {
        title: "Añade la publicación",
        body: "Pega el enlace de una página pública o sube una captura clara en PNG, JPG o WebP.",
      },
      {
        title: "Separa y contrasta las afirmaciones",
        body: "El verificador identifica los hechos principales que se pueden comprobar y los compara con fuentes independientes que puede validar.",
      },
      {
        title: "Revisa el informe",
        body: "Descubre qué respalda, contradice o matiza cada afirmación, abre las fuentes y reconoce lo que la evidencia no permite concluir.",
      },
    ],
    faqTitle: "Preguntas frecuentes",
    faq: [
      {
        question: "¿Puedo analizar una captura de redes sociales?",
        answer:
          "Sí. Sube una captura clara con texto legible. La imagen se usa para reconocer el texto y no se almacena después de leerla.",
      },
      {
        question:
          "¿Un índice de respaldo bajo significa que toda la publicación es falsa?",
        answer:
          "No. El índice resume cuánto respaldo encontró el informe entre las afirmaciones evaluadas. No juzga cada frase, la intención del autor ni la reputación del medio.",
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
    homeTitle: "Analysez les affirmations d’actualités, liens et captures",
    homeDescription:
      "Analysez les principales affirmations d’un article, d’une publication ou d’une capture. Obtenez un rapport automatisé et daté avec des sources consultables et des limites visibles.",
    howTitle: "De la publication au rapport de preuves",
    howIntro:
      "Le vérificateur examine des affirmations précises, pas la réputation du média ou de l’auteur. Le résultat est un rapport automatisé et daté que vous pouvez consulter.",
    steps: [
      {
        title: "Ajoutez la publication",
        body: "Collez le lien d’une page publique ou importez une capture PNG, JPG ou WebP lisible.",
      },
      {
        title: "Isolez et comparez les affirmations",
        body: "Le vérificateur repère les principaux faits vérifiables et les compare à des sources indépendantes qu’il peut valider.",
      },
      {
        title: "Consultez le rapport",
        body: "Voyez ce qui étaye, contredit ou nuance chaque affirmation, ouvrez les sources et repérez ce que les preuves ne permettent pas de conclure.",
      },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      {
        question: "Puis-je analyser une capture de réseau social ?",
        answer:
          "Oui. Importez une capture nette au texte lisible. L’image sert à reconnaître le texte et n’est pas conservée après sa lecture.",
      },
      {
        question:
          "Un indice de soutien faible signifie-t-il que toute la publication est fausse ?",
        answer:
          "Non. L’indice résume le soutien trouvé parmi les affirmations évaluées. Il ne juge pas chaque phrase, l’intention de l’auteur ou la réputation du média.",
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
    homeTitle: "Analise afirmações em notícias, links e capturas",
    homeDescription:
      "Analise as principais afirmações de notícias, publicações e capturas. Receba um relatório automatizado e datado com fontes que você pode abrir e limites visíveis.",
    howTitle: "Da publicação ao relatório de evidências",
    howIntro:
      "O verificador examina afirmações concretas, não a reputação do veículo ou do autor. O resultado é um relatório automatizado e datado que você pode revisar.",
    steps: [
      {
        title: "Adicione a publicação",
        body: "Cole o link de uma página pública ou envie uma captura nítida em PNG, JPG ou WebP.",
      },
      {
        title: "Separe e compare as afirmações",
        body: "O verificador identifica os principais fatos verificáveis e os compara com fontes independentes que consegue validar.",
      },
      {
        title: "Revise o relatório",
        body: "Veja o que apoia, contradiz ou contextualiza cada afirmação, abra as fontes e reconheça o que as evidências não permitem concluir.",
      },
    ],
    faqTitle: "Perguntas frequentes",
    faq: [
      {
        question: "Posso analisar uma captura de rede social?",
        answer:
          "Sim. Envie uma captura nítida com texto legível. A imagem é usada para reconhecer o texto e não é armazenada depois da leitura.",
      },
      {
        question:
          "Um índice de respaldo baixo significa que toda a publicação é falsa?",
        answer:
          "Não. O índice resume o respaldo encontrado entre as afirmações avaliadas. Ele não julga cada frase, a intenção do autor nem a reputação do veículo.",
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
