# Opciones para el motor de investigación con IA

**Estado:** investigación técnica para decidir arquitectura  
**Verificado:** 18 de septiembre de 2026  
**Alcance:** JEV/TypeSafe AI, Vercel Eve y una alternativa ajustada al Verificador de noticias.

## Conclusión ejecutiva

> **Decisión posterior a esta investigación (actualizada el 19 de septiembre de 2026):** se seleccionó Vercel AI Gateway como puerta de enlace de inferencia, con un pool ordenado de modelos gratuitos previamente aprobados mediante el corpus multilingüe, sin fallback pago ni recarga automática. `inclusionai/ling-3.0-flash-vl-free` es el candidato primario inicial. Los límites externos de elegibilidad, tasa, periodo, crédito y disponibilidad prevalecen sobre los cupos internos. Exa Search se consumirá inicialmente mediante `gateway.tools.exaSearch()` con un presupuesto duro y no mediante su credencial directa. Las referencias posteriores a Workers AI y a la integración directa de Exa se conservan como parte de la comparación investigada, no como la arquitectura aprobada.

JEV y Eve no son alternativas equivalentes:

- **JEV es un modelo de decisión estructurada.** Recibe texto y preguntas tipadas, y devuelve decisiones y probabilidades. No busca en internet, no extrae contenido, no produce explicaciones ni administra ejecuciones largas.
- **Eve es un framework de agentes.** Aporta sesiones durables, herramientas, búsqueda web, subagentes, estado y despliegue; el modelo y la búsqueda siguen siendo servicios externos con sus propios costos y límites.

Para este producto, la mejor base no es ninguno de los dos por sí solo. La recomendación es una **pipeline de investigación propia, acotada y durable**, implementada con **Vercel Workflow SDK + AI SDK Core**, un adaptador intercambiable de inferencia y un adaptador intercambiable de búsqueda. Esta forma encaja mejor con los estados aprobados, el presupuesto estricto de cinco minutos, el informe parcial, la trazabilidad de cada Fuente de evidencia y el Índice de respaldo reproducible.

Para el primer prototipo gratuito:

- **Inferencia:** un modelo fijado y disponible en el free tier de Cloudflare Workers AI, con Vercel AI Gateway u OpenRouter Free como alternativas de contingencia, no como dependencias lógicas del dominio.
- **Búsqueda:** Exa Search/Contents como primera opción por su crédito recurrente sin tarjeta y por devolver texto y fragmentos; Brave Search es una alternativa válida.
- **Orquestación:** Vercel Workflow, con AI SDK Core para salidas estructuradas y portabilidad entre modelos; sin Eve en el MVP.
- **JEV:** reservarlo como experimento posterior para clasificar evidencia o asignar veredictos, no como motor completo.

Esto no convierte el producto en gratuito a escala. Los free tiers son capacidad de prototipo y pueden agotarse o fallar; los cupos global e individual ya aprobados deben impedir que el servicio prometa más capacidad de la disponible.

## La decisión real

La aplicación necesita resolver cinco responsabilidades diferentes:

1. Extraer el Contenido analizado de una URL o reconocerlo mediante OCR.
2. Identificar y priorizar Afirmaciones verificables.
3. Descubrir, recuperar y clasificar Fuentes de evidencia.
4. Contrastar cada afirmación con fragmentos concretos y asignar un Veredicto.
5. Persistir progreso, evidencia e Informe, incluso ante recargas, fallos o agotamiento del tiempo.

JEV cubre principalmente una parte de los puntos 2 y 4. Eve puede coordinar del 2 al 5, pero no aporta por sí mismo un modelo gratuito ni una política de evidencia. Una pipeline propia define exactamente las cinco fases y conserva control explícito sobre sus contratos.

## Hechos confirmados

### JEV / TypeSafe AI

**Rol.** TypeSafe describe JEV como su primer modelo “System One”: evalúa un `state` contra preguntas tipadas y devuelve valores estructurados y probabilidades, en lugar de generar texto libre. Sus primitivas públicas son `Choice`, `Score` y `Noul` ([documentación de introducción](https://docs.typesafe.ai/introduction), [referencia de la API](https://docs.typesafe.ai/api)).

**Capacidad.** JEV acepta solamente texto —cadenas, objetos JSON o arreglos de texto— y no acepta imágenes, audio ni video. Tampoco escribe explicaciones o informes; TypeSafe indica que las tareas que exigen razonamiento prolongado deben descomponerse en preguntas atómicas y combinarse en código ([System One](https://docs.typesafe.ai/concepts/system-one)).

**Contexto y lenguas.** La versión documentada, JEV 1.13, admite 64.000 tokens por solicitud, con un límite adicional de 32.000 tokens para `state` más la pregunta más larga. El inglés es su idioma principal de entrenamiento; otros idiomas son aceptados, pero TypeSafe advierte que no tienen la misma precisión ([modelos](https://docs.typesafe.ai/models)). Esto importa porque el producto acepta Contenido analizado en cualquier idioma.

**Madurez.** TypeSafe anunció JEV en acceso temprano el 15 de septiembre de 2026. Hay API HTTP y SDK oficiales para JavaScript/TypeScript y Python, pero sigue siendo una oferta muy reciente y sus límites pueden cambiar sin aviso ([anuncio oficial](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [modelos y límites](https://docs.typesafe.ai/models)).

**Precio y free tier.** El precio publicado de JEV 1.13 es **USD 0,042 por millón de tokens de entrada**; la salida no se cobra. No se encontró un free tier recurrente documentado en las páginas oficiales consultadas ([modelos](https://docs.typesafe.ai/models)). Aunque el costo unitario es bajo, JEV no cumple literalmente el requisito de usar solo modelos con free tier.

**Browsing y citas.** La API publicada recibe `state`, `model` y `questions`, y devuelve `answers` y uso de tokens. No documenta búsqueda web, recuperación de páginas ni citas ([referencia de la API](https://docs.typesafe.ai/api)). Por tanto, otra capa tendría que buscar, descargar y preparar toda la evidencia antes de llamar a JEV.

**Límite de la promesa de “cero alucinaciones”.** TypeSafe garantiza que la salida respeta el tipo definido, pero su propia documentación aclara que la calibración se mide sobre conjuntos de predicciones y no garantiza que una respuesta individual sea correcta ([System One](https://docs.typesafe.ai/concepts/system-one)). Para este producto, la ausencia de errores de esquema no equivale a veracidad factual.

**Lock-in.** El SDK es de código abierto y la API es pequeña, pero el modelo y sus probabilidades calibradas son un servicio propietario. El riesgo puede limitarse encapsulándolo detrás de una interfaz de `EvidenceJudge`.

### Vercel Eve

**Rol.** Eve es un framework TypeScript “filesystem-first” para agentes durables. Organiza instrucciones, herramientas, skills, canales, programaciones y subagentes, y se distribuye con licencia Apache 2.0 ([repositorio oficial](https://github.com/vercel/eve)).

**Durabilidad.** En Eve, las conversaciones se ejecutan como workflows durables. En Vercel usa Vercel Workflow y Vercel Sandbox; también puede desplegarse como servicio Node autoalojado con un “Workflow World” y un backend de sandbox seleccionables ([guía de despliegue](https://github.com/vercel/eve/blob/main/docs/guides/deployment/overview.md), [autoalojamiento](https://github.com/vercel/eve/blob/main/docs/guides/deployment/self-hosting.md)). Esto sí resuelve la necesidad de continuar una Investigación aunque el cliente cierre o recargue la página.

**Browsing.** Eve ofrece `web_search` y `web_fetch`. Para modelos de Vercel AI Gateway, `web_search` usa Exa de forma predeterminada; para proveedores directos usa la búsqueda nativa disponible. `web_fetch` incorpora comprobaciones contra SSRF y permite reemplazar ambas herramientas con implementaciones propias ([herramientas integradas](https://github.com/vercel/eve/blob/main/docs/concepts/built-in-tools.md)).

**Citas.** Eve puede entregar URLs y resultados de búsqueda al modelo, pero no define por sí mismo el contrato de evidencia de este producto: jerarquía, corroboración independiente, fragmento exacto, fecha de consulta, relación con la afirmación y Veredicto. Un agente puede redactar citas, pero el producto tendría que validar y persistir esas relaciones de todos modos.

**Modelos y costo.** Eve no incluye inferencia gratuita. Un identificador de modelo en su configuración usa Vercel AI Gateway; un modelo proporcionado directamente requiere las credenciales del proveedor ([despliegue](https://github.com/vercel/eve/blob/main/docs/guides/deployment/overview.md)). AI Gateway ofrece actualmente USD 5 mensuales de crédito en su free tier, limitado a modelos elegibles y con rate limits inferiores; comprar créditos mueve la cuenta al nivel de pago y elimina el crédito mensual gratuito ([precios de AI Gateway](https://vercel.com/docs/ai-gateway/pricing)). La búsqueda también consume capacidad facturable del proveedor.

**Madurez.** Eve está en beta y Vercel advierte que sus APIs, documentación y comportamiento pueden cambiar antes de disponibilidad general ([README oficial](https://github.com/vercel/eve)). Su base durable, Workflow SDK, sí alcanzó disponibilidad general en abril de 2026 ([anuncio de Workflow GA](https://vercel.com/blog/a-new-programming-model-for-durable-execution)).

**Lock-in.** El código de Eve es abierto y existe una ruta de autoalojamiento. Sin embargo, el camino de menor fricción integra Vercel Workflow, Sandbox, AI Gateway y observabilidad de Vercel. Migrar es posible, pero exige operar sustitutos para workflow, sandbox y almacenamiento.

### Alternativa: pipeline propia sobre Vercel Workflow

**Rol.** Workflow SDK convierte funciones y pasos TypeScript en ejecuciones durables con persistencia, reintentos y observabilidad. Los workflows pueden suspenderse y reanudarse sin mantener una petición HTTP abierta, y cada paso puede ejecutarse de forma aislada ([Workflow SDK](https://vercel.com/blog/a-new-programming-model-for-durable-execution), [producto Vercel Workflows](https://vercel.com/workflows)).

**Madurez y portabilidad.** Workflow SDK está en disponibilidad general y es de código abierto. Su abstracción `World` permite usar la infraestructura administrada de Vercel o implementar otro backend, incluido el ejemplo oficial basado en Postgres ([anuncio de Workflow GA](https://vercel.com/blog/a-new-programming-model-for-durable-execution)).

**Duración.** Vercel publicita los workflows sin límite de tiempo de pared, pagando solo por la ejecución activa. Una Function de Hobby puede durar actualmente 300 segundos, exactamente el presupuesto completo del producto y sin margen para encolar, reintentar ni persistir un cierre; además, una conexión HTTP intermedia puede terminar antes. El workflow separa la Investigación de la petición que crea el informe y permite reanudar pasos ([Workflows](https://vercel.com/workflows), [duración de Functions](https://vercel.com/docs/functions/configuring-functions/duration), [límites generales](https://vercel.com/docs/limits)).

**Free tier de infraestructura.** La página de precios de Vercel incluye actualmente 50.000 eventos de Workflow por mes en Hobby, además de cuotas de Functions, CPU y memoria ([precios de Vercel](https://vercel.com/pricing)). Esto cubre un prototipo, pero no elimina el costo de inferencia, búsqueda, base de datos ni almacenamiento permanente.

**Browsing y citas.** La pipeline no trae búsqueda incorporada, pero esa ausencia es favorable para este caso: obliga a registrar cada consulta, resultado, descarga y fragmento en una estructura propia. El informe puede construirse exclusivamente desde registros de evidencia validados, en vez de confiar en una respuesta narrativa de un agente.

**Lock-in.** El código de negocio queda en funciones TypeScript ordinarias y los modelos y buscadores se conectan mediante adaptadores. AI SDK Core estandariza llamadas y salidas estructuradas entre proveedores ([arquitectura de proveedores](https://ai-sdk.dev/docs/foundations/providers-and-models), [salidas estructuradas](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)). El despliegue administrado crea dependencia operativa de Vercel, pero bastante menos dependencia semántica que colocar todo el proceso dentro de un loop de agente.

## Comparación

| Criterio | JEV / TypeSafe | Vercel Eve | Pipeline propia + Workflow SDK |
|---|---|---|---|
| Qué es | Modelo de decisión tipada | Framework y runtime de agentes | Orquestación durable de un proceso de dominio |
| Extrae URL u OCR | No | Requiere herramientas | Requiere adaptadores explícitos |
| Busca en internet | No | Sí, con herramienta y proveedor | Sí, con proveedor elegido |
| Citas auditables | No nativas | Posibles, pero no son un contrato de dominio | Sí, diseñadas como datos obligatorios |
| Genera informe | No genera texto | Sí | Sí, mediante un paso acotado |
| Durabilidad | No | Sí | Sí |
| Control de cinco minutos | Debe construirlo la app | Posible mediante límites del agente/workflow | Directo: deadlines y presupuesto por paso |
| Informe parcial determinista | Debe construirlo la app | Posible, con personalización | Parte natural del estado persistido |
| Modelo free tier | No documentado | Depende del proveedor | Depende del proveedor; intercambiable |
| Madurez actual | Acceso temprano | Beta | Workflow SDK GA; la pipeline es código propio |
| Encaje multilingüe | Acepta otros idiomas, pero inglés es el mejor | Depende del modelo | Depende del modelo y se puede enrutar por idioma |
| Riesgo de costo impredecible | Bajo por llamada; sin free tier | Medio/alto si el agente itera libremente | Bajo si se limitan consultas y llamadas por fase |
| Lock-in | Modelo propietario | Framework abierto, camino administrado muy Vercel | Adaptadores de modelo/búsqueda y `World` reemplazables |
| Encaje con el MVP | Complemento, no motor | Viable, pero sobredimensionado | Mejor encaje |

## Free tiers verificados

Los siguientes son cupos documentados al 18 de septiembre de 2026. Se distingue el crédito recurrente de los créditos únicos de bienvenida; la disponibilidad de modelos y las cuotas pueden cambiar:

- **Cloudflare Workers AI:** 10.000 Neurons diarios sin costo; al superar el cupo, las llamadas del plan Free fallan. Algunos modelos requieren plan Paid, por lo que el modelo activo debe ser configurable y validarse contra el catálogo antes de desplegar ([precios](https://developers.cloudflare.com/workers-ai/platform/pricing/), [errores y agotamiento de cuota](https://developers.cloudflare.com/workers-ai/platform/errors/)). Workers AI expone endpoints compatibles con OpenAI para modelos de texto, lo que facilita encapsular el proveedor ([compatibilidad](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)). Su conversión a Markdown también admite PNG, JPEG y WebP mediante modelos de visión y consume el mismo cupo ([conversión](https://developers.cloudflare.com/workers-ai/features/markdown-conversion/), [formatos](https://developers.cloudflare.com/workers-ai/features/markdown-conversion/supported-formats/)). **Inferencia:** puede ensayarse como extractor de texto para capturas, pero debe validarse frente a un OCR dedicado.
- **Vercel AI Gateway:** USD 5 de crédito mensual para un subconjunto de modelos, con rate limits inferiores. Es un crédito que paga precios de lista, no inferencia ilimitada ([precios](https://vercel.com/docs/ai-gateway/pricing)).
- **OpenRouter Free:** más de 25 modelos gratuitos, pero la cuenta Free está limitada a 50 solicitudes diarias y no incluye controles de presupuesto ni SLA. OpenRouter advierte que los modelos gratuitos tienen límites bajos y no son adecuados para producción ([precios](https://openrouter.ai/pricing), [colección gratuita](https://openrouter.ai/collections/free-models)). El router `openrouter/free` puede cambiar de modelo entre solicitudes, lo que perjudica la reproducibilidad del informe.
- **Exa Starter:** USD 20 al registrarse y USD 10 recurrentes cada mes, sin medio de pago. Search cuesta USD 7 por 1.000 solicitudes e incluye resultados, texto y highlights; Contents y resúmenes pueden sumar consumo adicional ([precios de Exa](https://exa.ai/pricing)). Diez dólares equivalen a unas 1.428 búsquedas básicas mensuales; con diez búsquedas por informe, el techo teórico sería aproximadamente 142 informes, antes de Contents, inferencia y reintentos.
- **Brave Search:** USD 5 de crédito mensual y USD 5 por 1.000 solicitudes Search; requiere tarjeta incluso con gasto configurado en cero. Su endpoint Answers ofrece respuestas con citas, pero conviene usar Search y verificar la evidencia en la aplicación para no delegar el Veredicto a una caja negra. Brave advierte además que almacenar sus resultados exige un plan que conceda esos derechos, punto que debe revisarse antes de persistir fragmentos ([precios de Brave Search API](https://brave.com/search/api/), [acceso al crédito](https://api-dashboard.search.brave.com/documentation/resources/help-feedback)).

No hay evidencia de que una combinación gratuita pueda sostener 30 Investigaciones diarias por cada navegador de un público ilimitado. La promesa viable es: **hasta el cupo individual, sujeto al cupo global disponible**, exactamente como ya se definió en la especificación.

## Recomendación

### Decisión propuesta

Adoptar una **pipeline propia con Vercel Workflow SDK + AI SDK Core** como motor de Investigación del MVP. No adoptar Eve ni JEV como dependencia central.

Usar interfaces internas que permitan cambiar proveedores sin cambiar el dominio:

```ts
interface InferenceProvider {
  generateStructured<T>(request: StructuredRequest<T>): Promise<T>;
}

interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResult[]>;
}

interface PageFetcher {
  fetch(url: URL): Promise<RetrievedDocument>;
}

interface EvidenceJudge {
  judge(claim: Claim, evidence: EvidenceRecord[]): Promise<ClaimAssessment>;
}
```

JEV podría implementar `EvidenceJudge` más adelante. Workers AI, AI Gateway u OpenRouter pueden implementar `InferenceProvider`; AI SDK Core aporta la interfaz unificada, el registro de proveedores y validación de salidas estructuradas. Exa o Brave pueden implementar `SearchProvider`.

### Flujo recomendado

1. **Aceptar y reservar cupo.** Crear la URL corta y la Investigación en estado `en cola`; reservar los cupos individual y global de forma atómica.
2. **Extraer.** Descargar la URL con protección SSRF o procesar OCR en servidor; eliminar la imagen original al finalizar la extracción; truncar a 2.000 palabras y registrar el conteo.
3. **Identificar.** Pedir una salida estructurada de Afirmaciones verificables con rangos de caracteres, importancia y texto normalizado. Validar el JSON contra un esquema y rechazar afirmaciones sin anclaje en el Extracto analizado.
4. **Planear búsqueda.** Generar consultas por afirmación y jerarquía esperada. Restringir el número de consultas, deduplicar URLs y priorizar dominios primarios pertinentes.
5. **Recuperar evidencia.** Descargar cada página en el servidor, extraer el pasaje relevante y guardar URL canónica, título, autor/emisor, fecha de publicación, fecha de consulta, fragmento original, idioma y hash del contenido.
6. **Evaluar.** Ejecutar una comparación estructurada por afirmación. El modelo propone relación y Veredicto; reglas de aplicación comprueban que cada conclusión cite evidencia recuperada, respetan la Jerarquía de evidencia y detectan falta de corroboración.
7. **Cerrar a los 4:30.** No iniciar nuevas búsquedas. Cancelar trabajo no esencial y marcar las afirmaciones pendientes como no investigadas por tiempo agotado.
8. **Sintetizar y persistir.** Construir el Informe solamente desde evaluaciones y registros de evidencia ya persistidos; calcular Índice de respaldo y Cobertura de evidencia en código, nunca mediante el modelo.

Cada fase debe ser un paso durable e idempotente. El progreso visible debe salir de eventos persistidos del dominio, no de mensajes internos del modelo.

### Por qué no Eve en el MVP

Eve sería razonable para un asistente abierto que decide dinámicamente qué herramientas utilizar, conversa, pide aprobaciones y delega en subagentes. Este producto tiene un proceso cerrado, estados ya definidos, una fórmula pública y un deadline estricto. Un loop de agente agrega libertad, herramientas y estados que habría que volver a limitar.

Workflow SDK conserva la principal ventaja de Eve —durabilidad— sin adoptar todo su harness beta. Eve puede reconsiderarse si el producto evoluciona hacia una investigación interactiva, permite preguntas de seguimiento o necesita múltiples investigadores especializados.

### Por qué no JEV como motor principal

JEV no puede descubrir evidencia ni redactar el Informe y no dispone de free tier documentado. Su mejor encaje sería después de recuperar evidencia: clasificar si un fragmento respalda, contradice o no resuelve una afirmación, con probabilidades tipadas. Antes de incorporarlo deben medirse en un corpus propio su precisión multilingüe, calibración y capacidad para distinguir “engañosa” de “en disputa”.

## Inferencias y riesgos

Las siguientes conclusiones son inferencias de arquitectura, no promesas de los proveedores:

- **La confiabilidad vendrá más del contrato de evidencia que del modelo.** Ningún proveedor garantiza que un Veredicto factual individual sea correcto. Exigir fragmentos recuperados, enlaces válidos y reglas deterministas reduce el espacio de error.
- **Un agente general puede gastar el presupuesto de cinco minutos en exploración.** Una pipeline con presupuestos por fase puede reservar los últimos 30 segundos de manera verificable.
- **Rotar aleatoriamente modelos gratuitos reduce la auditabilidad.** Un mismo Informe debe registrar proveedor, modelo exacto y versión. Si el modelo no está disponible, es preferible esperar, usar un fallback configurado y registrado, o terminar parcialmente.
- **“Fuente oficial” no se resuelve con una lista global de dominios.** La autoridad depende de la afirmación: un registro gubernamental puede ser primario para una ley, pero no para evaluar sus efectos. La clasificación de evidencia debe guardar el papel de la fuente y la independencia entre emisores.
- **La permanencia del Informe exige conservar suficiente evidencia propia.** Guardar URL y un fragmento corto con metadatos permite auditar el resultado aun si la página cambia, pero deben revisarse las condiciones de almacenamiento de cada API y los límites de cita del contenido original.
- **Los cupos gratuitos no son SLA.** Cloudflare documenta errores al agotar cuota o capacidad; OpenRouter indica que su free tier no es para producción; Vercel y los buscadores aplican rate limits. El resultado `parcial` o `fallido` debe tratar estas condiciones como normales y observables.

## Validación requerida antes de cerrar la decisión

Construir un spike pequeño de la pipeline y evaluarlo con un corpus versionado, no con demos escogidas manualmente. Como mínimo:

- Contenido en español, inglés, francés y portugués, además de muestras de otros idiomas admitidos.
- URLs y capturas con OCR limpio y degradado.
- Afirmaciones respaldadas, contradichas, engañosas, en disputa y sin evidencia suficiente.
- Casos donde una fuente primaria existe y casos que requieren corroboración experta o periodística independiente.
- Medición de precisión y exhaustividad al extraer afirmaciones, corrección de cada cita, acuerdo de Veredicto con revisión humana, Cobertura de evidencia, latencia p50/p95, consultas de búsqueda, tokens/neuronas y tasa de informes parciales.
- Prueba de agotamiento del reloj: dejar de buscar a los 270 segundos y persistir siempre un estado terminal antes de 300 segundos.
- Prueba de repetibilidad: ejecutar dos veces el mismo caso con el mismo modelo fijado y comparar afirmaciones, fuentes y veredictos.

La selección final del modelo gratuito debe quedar condicionada a estos resultados. La arquitectura recomendada permite cambiarlo sin reescribir el flujo ni el formato permanente de los Informes.
