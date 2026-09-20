import type { SupportedLocale } from "../domain/reports";

type PolicySection = { title: string; paragraphs: readonly string[] };

type Policy = {
  effectiveDate: string;
  summary: string;
  sections: readonly PolicySection[];
};

export const privacyPolicy: Record<SupportedLocale, Policy> = {
  en: {
    effectiveDate: "Effective September 19, 2026",
    summary:
      "News Verifier is an anonymous, experimental service operated by Julian David. It processes a submitted link or screenshot to produce an automated evidence report at an unlisted URL.",
    sections: [
      {
        title: "Data we process",
        paragraphs: [
          "For a link, the server downloads the public page and extracts its main text. For a screenshot, the image blob and its technical metadata are held only while Tesseract OCR runs; the original image is not stored and is discarded when OCR ends, whether it succeeds or fails.",
          "We persist the analyzed extract (up to 2,000 words), minimal claim context, claims, verdicts, evidence fragments, source links, timestamps and technical audit records. Anyone who has the unlisted report URL can see the public report, but never the full analyzed extract.",
          "A signed anonymous browser identifier supports a one-year cookie. The server stores a pseudonymous derivative for daily limits. A date-bound pseudonymous network signal also limits abuse; it is not used to identify a person or follow them across sites.",
        ],
      },
      {
        title: "Purposes and legal basis",
        paragraphs: [
          "We process the submitted material to provide the report you request, preserve an auditable snapshot, protect free capacity and prevent abuse. Depending on applicable law, this is necessary to provide the requested service and supports the operator’s legitimate interests in security, reliability and accountability.",
          "Do not submit confidential material or personal data that you are not entitled to process. The service does not proactively detect sensitive data before processing.",
        ],
      },
      {
        title: "Providers and transfers",
        paragraphs: [
          "The server uses Vercel for hosting, durable workflows and AI Gateway; Neon for Postgres storage; Exa for evidence search when needed; and the selected free model providers routed by AI Gateway. Fetching a link also contacts that source website. These providers may process technical request data under their own terms and in other countries.",
          "The browser sends the source to our server; model and search requests are made server-side. We do not sell personal data.",
        ],
      },
      {
        title: "Data retention",
        paragraphs: [
          "Screenshot blobs and their original metadata are discarded at the end of OCR. They are never part of the report record.",
          "The analyzed extract, report, claims, evidence records, model audit data and the pseudonymous usage records have no automatic expiry while the service remains operational. Reports are immutable snapshots and their unlisted URLs are intended to remain stable.",
          "The browser cookie expires after one year. The network signal changes every calendar day, although operational and audit records containing pseudonymous derivatives may be retained with the related investigation. The operator can withdraw a report for legal, privacy or abuse reasons without exposing an administrative control publicly.",
        ],
      },
      {
        title: "Automated analysis and limitations",
        paragraphs: [
          "AI systems identify claims, search for evidence and propose verdicts under deterministic evidence rules. They can misunderstand context, miss sources or produce errors. Every report is dated, shows uncertainty and is not a declaration of absolute truth.",
          "The service does not replace medical, legal, financial or other professional advice and does not make decisions about a person with legal or similarly significant effects.",
        ],
      },
      {
        title: "Your choices and contact",
        paragraphs: [
          "Depending on your jurisdiction, you may have rights to access, correct, object to, restrict or request deletion of personal data. There is no self-service deletion in this MVP. Send the report URL and your request to news-verifier.securely376@silomails.com. Do not include additional sensitive data.",
          "The operator is Julian David. This policy may change as the experimental service evolves; material changes will be reflected here with a new effective date.",
        ],
      },
    ],
  },
  es: {
    effectiveDate: "Vigente desde el 19 de septiembre de 2026",
    summary:
      "Verificador de noticias es un servicio experimental y anónimo operado por Julian David. Procesa un enlace o una captura enviados para producir un informe automatizado de evidencia en una URL no listada.",
    sections: [
      {
        title: "Datos que procesamos",
        paragraphs: [
          "Para un enlace, el servidor descarga la página pública y extrae su texto principal. Para una captura, el blob de imagen y sus metadatos técnicos se mantienen solo mientras Tesseract ejecuta el OCR; la imagen original no se almacena y se descarta al terminar el OCR, tanto si funciona como si falla.",
          "Persistimos el Extracto analizado (hasta 2.000 palabras), el contexto mínimo de las afirmaciones, las afirmaciones, los veredictos, los fragmentos de evidencia, los enlaces fuente, las fechas y los registros técnicos de auditoría. Cualquiera con la URL no listada puede ver el informe público, pero nunca el Extracto analizado completo.",
          "Un identificador anónimo firmado del navegador mantiene una cookie durante un año. El servidor guarda un derivado seudónimo para los límites diarios. Una señal de red seudonimizada y ligada a la fecha también limita abusos; no se usa para identificar a una persona ni seguirla entre sitios.",
        ],
      },
      {
        title: "Finalidades y base jurídica",
        paragraphs: [
          "Procesamos el material enviado para prestar el informe solicitado, conservar una instantánea auditable, proteger la capacidad gratuita y prevenir abusos. Según la ley aplicable, este tratamiento es necesario para prestar el servicio solicitado y respalda el interés legítimo del operador en seguridad, fiabilidad y rendición de cuentas.",
          "No envíes material confidencial ni datos personales que no tengas derecho a procesar. El servicio no detecta de forma preventiva datos sensibles antes de procesarlos.",
        ],
      },
      {
        title: "Proveedores y transferencias",
        paragraphs: [
          "El servidor usa Vercel para alojamiento, workflows durables y AI Gateway; Neon para Postgres; Exa para buscar evidencia cuando sea necesario; y los proveedores de modelos gratuitos seleccionados mediante AI Gateway. Obtener un enlace también contacta al sitio de origen. Estos proveedores pueden procesar datos técnicos bajo sus propias condiciones y en otros países.",
          "El navegador envía la fuente a nuestro servidor; las solicitudes a modelos y buscadores se hacen desde el servidor. No vendemos datos personales.",
        ],
      },
      {
        title: "Retención de datos",
        paragraphs: [
          "Los blobs de capturas y sus metadatos originales se descartan al terminar el OCR. Nunca forman parte del registro del informe.",
          "El Extracto analizado, el informe, las afirmaciones, los Registros de evidencia, la auditoría de modelos y los registros seudónimos de uso no caducan automáticamente mientras el servicio siga operativo. Los informes son instantáneas inmutables y sus URL no listadas buscan permanecer estables.",
          "La cookie del navegador vence después de un año. La señal de red cambia cada día calendario, aunque los registros operativos y de auditoría con derivados seudónimos pueden conservarse con la investigación relacionada. El operador puede retirar un informe por motivos legales, de privacidad o abuso sin exponer un control administrativo público.",
        ],
      },
      {
        title: "Análisis automatizado y límites",
        paragraphs: [
          "Sistemas de IA identifican afirmaciones, buscan evidencia y proponen veredictos bajo reglas deterministas de evidencia. Pueden malinterpretar contexto, omitir fuentes o cometer errores. Cada informe está fechado, muestra la incertidumbre y no declara una verdad absoluta.",
          "El servicio no sustituye asesoría médica, jurídica, financiera ni profesional, y no toma decisiones sobre personas con efectos jurídicos o de importancia similar.",
        ],
      },
      {
        title: "Tus opciones y contacto",
        paragraphs: [
          "Según tu jurisdicción, puedes tener derechos de acceso, corrección, oposición, limitación o eliminación de datos personales. Este MVP no tiene eliminación autoservicio. Envía la URL del informe y tu solicitud a news-verifier.securely376@silomails.com. No incluyas datos sensibles adicionales.",
          "El responsable es Julian David. Esta política puede cambiar al evolucionar el servicio experimental; los cambios materiales aparecerán aquí con una nueva fecha de vigencia.",
        ],
      },
    ],
  },
  fr: {
    effectiveDate: "En vigueur depuis le 19 septembre 2026",
    summary:
      "Vérificateur d’actualités est un service expérimental et anonyme exploité par Julian David. Il traite un lien ou une capture afin de produire un rapport automatisé de preuves à une URL non répertoriée.",
    sections: [
      {
        title: "Données traitées",
        paragraphs: [
          "Pour un lien, le serveur télécharge la page publique et en extrait le texte principal. Pour une capture, le blob et ses métadonnées techniques ne sont conservés que pendant l’OCR Tesseract ; l’image originale n’est pas stockée et est supprimée à la fin de l’OCR, qu’il réussisse ou non.",
          "Nous conservons l’extrait analysé (2 000 mots maximum), le contexte minimal, les affirmations, verdicts, fragments de preuves, liens sources, dates et journaux techniques d’audit. Toute personne possédant l’URL non répertoriée peut voir le rapport public, mais jamais l’extrait analysé complet.",
          "Un identifiant anonyme signé utilise un cookie d’un an. Le serveur conserve un dérivé pseudonyme pour les limites quotidiennes. Un signal réseau pseudonymisé lié à la date limite aussi les abus ; il ne sert ni à identifier une personne ni à la suivre entre sites.",
        ],
      },
      {
        title: "Finalités et base juridique",
        paragraphs: [
          "Nous traitons les éléments soumis pour fournir le rapport demandé, garder un instantané auditable, protéger la capacité gratuite et prévenir les abus. Selon la loi applicable, ce traitement est nécessaire au service demandé et soutient l’intérêt légitime de l’opérateur en matière de sécurité, fiabilité et responsabilité.",
          "Ne soumettez pas d’informations confidentielles ni de données personnelles que vous n’êtes pas autorisé à traiter. Le service ne détecte pas préventivement les données sensibles.",
        ],
      },
      {
        title: "Prestataires et transferts",
        paragraphs: [
          "Le serveur utilise Vercel pour l’hébergement, les workflows et AI Gateway ; Neon pour Postgres ; Exa pour rechercher des preuves si nécessaire ; et les fournisseurs de modèles gratuits sélectionnés via AI Gateway. La récupération d’un lien contacte aussi le site source. Ces prestataires peuvent traiter des données techniques selon leurs propres conditions et dans d’autres pays.",
          "Le navigateur envoie la source à notre serveur ; les requêtes aux modèles et moteurs de recherche sont effectuées côté serveur. Nous ne vendons pas de données personnelles.",
        ],
      },
      {
        title: "Conservation des données",
        paragraphs: [
          "Les blobs des captures et leurs métadonnées d’origine sont supprimés à la fin de l’OCR et ne font jamais partie du rapport.",
          "L’extrait analysé, le rapport, les affirmations, preuves, audits de modèles et enregistrements d’usage pseudonymes n’expirent pas automatiquement tant que le service reste opérationnel. Les rapports sont des instantanés immuables et leurs URL doivent rester stables.",
          "Le cookie expire après un an. Le signal réseau change chaque jour, bien que les journaux opérationnels et d’audit contenant des dérivés pseudonymes puissent rester liés à l’enquête. L’opérateur peut retirer un rapport pour des raisons juridiques, de confidentialité ou d’abus sans exposer de commande publique.",
        ],
      },
      {
        title: "Analyse automatisée et limites",
        paragraphs: [
          "Des systèmes d’IA identifient les affirmations, recherchent des preuves et proposent des verdicts sous des règles déterministes. Ils peuvent mal comprendre le contexte, manquer des sources ou se tromper. Chaque rapport est daté, montre l’incertitude et ne constitue pas une vérité absolue.",
          "Le service ne remplace aucun conseil médical, juridique, financier ou professionnel et ne prend aucune décision concernant une personne ayant des effets juridiques ou similaires.",
        ],
      },
      {
        title: "Vos choix et contact",
        paragraphs: [
          "Selon votre juridiction, vous pouvez disposer de droits d’accès, rectification, opposition, limitation ou effacement. Ce MVP n’offre pas d’effacement en libre-service. Envoyez l’URL du rapport et votre demande à news-verifier.securely376@silomails.com, sans données sensibles supplémentaires.",
          "L’opérateur est Julian David. Cette politique peut évoluer avec le service expérimental ; les changements importants apparaîtront ici avec une nouvelle date d’entrée en vigueur.",
        ],
      },
    ],
  },
  pt: {
    effectiveDate: "Em vigor desde 19 de setembro de 2026",
    summary:
      "O Verificador de notícias é um serviço experimental e anônimo operado por Julian David. Ele processa um link ou captura enviados para produzir um relatório automatizado de evidências em uma URL não listada.",
    sections: [
      {
        title: "Dados processados",
        paragraphs: [
          "Para um link, o servidor baixa a página pública e extrai o texto principal. Para uma captura, o blob e seus metadados técnicos são mantidos apenas durante o OCR do Tesseract; a imagem original não é armazenada e é descartada ao final do OCR, com sucesso ou falha.",
          "Mantemos o trecho analisado (até 2.000 palavras), o contexto mínimo, afirmações, veredictos, fragmentos de evidência, links, datas e registros técnicos de auditoria. Qualquer pessoa com a URL não listada pode ver o relatório público, mas nunca o trecho analisado completo.",
          "Um identificador anônimo assinado usa um cookie de um ano. O servidor guarda um derivado pseudônimo para limites diários. Um sinal de rede pseudonimizado e vinculado à data também limita abusos; ele não identifica uma pessoa nem a acompanha entre sites.",
        ],
      },
      {
        title: "Finalidades e base legal",
        paragraphs: [
          "Processamos o material enviado para fornecer o relatório solicitado, manter um retrato auditável, proteger a capacidade gratuita e evitar abusos. Conforme a lei aplicável, isso é necessário para o serviço solicitado e sustenta o interesse legítimo do operador em segurança, confiabilidade e prestação de contas.",
          "Não envie material confidencial nem dados pessoais que você não tenha direito de processar. O serviço não detecta preventivamente dados sensíveis.",
        ],
      },
      {
        title: "Provedores e transferências",
        paragraphs: [
          "O servidor usa Vercel para hospedagem, workflows e AI Gateway; Neon para Postgres; Exa para pesquisar evidências quando necessário; e os provedores de modelos gratuitos selecionados pelo AI Gateway. Buscar um link também contata o site de origem. Esses provedores podem processar dados técnicos sob seus próprios termos e em outros países.",
          "O navegador envia a fonte ao nosso servidor; modelos e buscas são acionados pelo servidor. Não vendemos dados pessoais.",
        ],
      },
      {
        title: "Retenção de dados",
        paragraphs: [
          "Os blobs das capturas e seus metadados originais são descartados ao final do OCR e nunca fazem parte do relatório.",
          "O trecho analisado, o relatório, afirmações, registros de evidência, auditoria dos modelos e registros pseudônimos de uso não expiram automaticamente enquanto o serviço estiver operacional. Os relatórios são retratos imutáveis e suas URLs devem permanecer estáveis.",
          "O cookie expira após um ano. O sinal de rede muda a cada dia, embora registros operacionais e de auditoria com derivados pseudônimos possam continuar ligados à investigação. O operador pode retirar um relatório por motivos legais, de privacidade ou abuso sem expor um controle administrativo público.",
        ],
      },
      {
        title: "Análise automatizada e limites",
        paragraphs: [
          "Sistemas de IA identificam afirmações, pesquisam evidências e propõem veredictos sob regras determinísticas. Eles podem interpretar mal o contexto, deixar de encontrar fontes ou errar. Cada relatório é datado, mostra incerteza e não declara verdade absoluta.",
          "O serviço não substitui orientação médica, jurídica, financeira ou profissional e não toma decisões sobre pessoas com efeitos legais ou semelhantes.",
        ],
      },
      {
        title: "Suas opções e contato",
        paragraphs: [
          "Conforme sua jurisdição, você pode ter direitos de acesso, correção, oposição, limitação ou exclusão. Este MVP não oferece exclusão por autosserviço. Envie a URL do relatório e sua solicitação a news-verifier.securely376@silomails.com, sem dados sensíveis adicionais.",
          "O operador é Julian David. Esta política pode mudar com a evolução do serviço experimental; mudanças importantes aparecerão aqui com nova data de vigência.",
        ],
      },
    ],
  },
};
