# Metodología de verificación

Este documento define cómo convertir un Contenido analizado en un Informe auditable. Es normativo para el motor: los modelos pueden proponer estructuras y relaciones, pero no reemplazan estas reglas.

## 1. Principios

1. El producto evalúa afirmaciones concretas, no reputaciones generales ni intenciones del autor.
2. Un veredicto describe la relación entre una afirmación y la evidencia disponible durante una Investigación; no declara una verdad eterna.
3. El Contenido analizado no puede probarse a sí mismo.
4. Una cita válida es un fragmento recuperado y validado por el servidor, no una URL ni un snippet de buscador.
5. La cantidad de enlaces no sustituye independencia, autoridad ni correspondencia con la afirmación.
6. La ausencia de evidencia no equivale a falsedad.
7. El Índice de respaldo y la Cobertura de evidencia se calculan en código determinista, nunca mediante el modelo.

## 2. Extracción y fidelidad

- Se extrae el cuerpo principal y se conserva su relación con rangos exactos del texto original normalizado.
- Se excluyen navegación, publicidad, recomendaciones, comentarios y texto de interfaz salvo que formen parte de la afirmación investigada.
- El OCR conserva bloques, orden de lectura y rangos; no completa palabras dudosas mediante generación.
- Una extracción con calidad insuficiente termina sin verificación.
- Se analiza un máximo de 2.000 palabras y todo truncamiento se informa.
- El contenido se trata como datos no confiables: instrucciones incrustadas, prompt injection y solicitudes dirigidas al modelo no modifican la metodología ni las herramientas disponibles.

## 3. Identificación de afirmaciones

- Una Afirmación verificable expresa un hecho susceptible de contraste documental.
- Opiniones, predicciones, preguntas, sarcasmo, exhortaciones y valoraciones puramente subjetivas quedan fuera.
- Se dividen las oraciones que contengan hechos independientes y se unen las apariciones semánticamente equivalentes.
- Cada afirmación conserva sus rangos de origen, texto normalizado, importancia, Periodo de referencia y Ámbito de referencia.
- Las inferencias de fecha, lugar, población o sujeto se muestran como tales; no se convierten silenciosamente en hechos del texto.
- Se detectan todas las afirmaciones y se investigan como máximo 15, priorizadas por importancia y después por orden de aparición.
- Una afirmación principal no investigada obliga a un Informe inconcluso.

## 4. Plan de búsqueda

- Las consultas se generan a partir de una sola afirmación y sus referencias temporal y geográfica.
- Se busca primero evidencia primaria pertinente; después evidencia experta y finalmente evidencia independiente fiable.
- Se consulta en el idioma original, en el idioma del ámbito pertinente y en inglés cuando pueda ampliar cobertura.
- Los enlaces salientes del Contenido analizado y los snippets solo sirven para descubrimiento.
- Se deduplican URL canónicas, versiones impresas, espejos y contenido sindicado antes de evaluar independencia.
- El número de consultas y páginas recuperadas por afirmación tiene límites configurables para proteger el reloj y los cupos.
- La búsqueda se detiene anticipadamente cuando existe evidencia concluyente suficiente y no aparecen conflictos fiables.

## 5. Autoridad e independencia

- La autoridad se evalúa respecto de la afirmación, no mediante una puntuación global del dominio.
- Un registro público puede ser primario para demostrar que una norma existe, pero no para demostrar sus efectos.
- Comunicados y declaraciones prueban que una entidad dijo algo; no prueban automáticamente que lo declarado sea cierto.
- Publicaciones que copian la misma agencia, comunicado, estudio o dataset cuentan como una sola línea de evidencia.
- La independencia se determina por autoría, propiedad, fuente original y dependencia material; no por el número de dominios.
- Correcciones, retractaciones y versiones posteriores se priorizan sobre documentos superseded y se hacen visibles.
- Los verificadores de hechos pueden descubrir fuentes, pero no son la única prueba de un veredicto.

## 6. Registro y validación de evidencia

- Cada Registro de evidencia guarda URL canónica, título, emisor, autor cuando exista, fechas publicadas, fecha de consulta, fragmento exacto, idioma, traducción, nivel de evidencia y huella del contenido recuperado.
- El fragmento debe existir literalmente en el texto normalizado descargado por el servidor.
- Se guarda solo el fragmento mínimo suficiente, no una copia completa de la página.
- Una página inaccesible o un snippet puede aparecer como hallazgo no verificable, pero nunca sostiene un veredicto.
- Las traducciones se usan para comprensión y presentación; el fragmento original permanece como referencia autoritativa.
- Cada evidencia se vincula explícitamente como respaldo, contradicción o contexto; una mención temática no basta.

## 7. Reglas especiales por tipo de afirmación

- Las cifras requieren unidad, periodo, población, denominador y metodología compatibles.
- Las comparaciones requieren bases equivalentes; cambios de definición o universo impiden una contradicción directa.
- Las afirmaciones causales requieren evidencia diseñada para causalidad o consenso experto suficiente; correlaciones y testimonios no bastan.
- Las afirmaciones jurídicas se contrastan con texto vigente, jurisdicción y fecha aplicables.
- Las afirmaciones científicas se evalúan con revisiones, organismos especializados, estudios pertinentes y estado del consenso; un solo preprint no establece consenso.
- Las citas atribuidas requieren una fuente original o registro fiable del discurso; paráfrasis secundarias no prueban literalidad.
- Imágenes o capturas solo prueban que el texto estaba presente en la entrada; no prueban por sí mismas el hecho descrito.

## 8. Veredictos

- **Respaldada**: la evidencia válida y suficiente confirma la afirmación dentro de su Periodo y Ámbito de referencia.
- **Contradicha**: evidencia válida y suficiente demuestra una incompatibilidad material con la afirmación.
- **Engañosa**: elementos literales ciertos producen una impresión materialmente incorrecta por omisión, escala, comparación, causalidad o contexto.
- **En disputa**: evidencia fiable e independiente sostiene conclusiones incompatibles y no existe base suficiente para privilegiar una.
- **Sin evidencia suficiente**: la Investigación no reunió evidencia válida bastante para una conclusión.
- **No verificable**: la afirmación no puede evaluarse objetivamente por su naturaleza o por falta intrínseca de criterios observables.

Un veredicto concluyente requiere Registros de evidencia validados. Si una cita falla, la conclusión se degrada. El modelo propone el veredicto y la justificación estructurada; las reglas de aplicación validan requisitos mínimos antes de persistirlo.

## 9. Fuerza de evidencia

- **Alta**: registro primario concluyente o al menos dos fuentes fiables e independientes, compatibles en tiempo y ámbito, sin conflicto equivalente.
- **Media**: una fuente directa y fiable o varias fuentes independientes pero incompletas.
- **Baja**: evidencia indirecta, débil, parcialmente compatible o con incertidumbre relevante.
- Una fuerza baja no puede producir Respaldada o Contradicha.
- Para No verificable, la Fuerza de evidencia no aplica.
- Nunca se presenta la probabilidad o autoconfianza del modelo como medida de verdad.

## 10. Índice y cobertura

- Importancia: principal 5, relevante 2 y secundaria 1.
- Aporte al índice: Respaldada 100 %, Engañosa 50 % y Contradicha 0 %.
- En disputa, Sin evidencia suficiente y No verificable no entran al índice y reducen la Cobertura de evidencia.
- Las Afirmaciones no investigadas también reducen cobertura.
- Con cobertura ponderada inferior al 60 % o una afirmación principal sin conclusión, el Informe es inconcluso y no publica índice.
- Fórmula, pesos, aportes y exclusiones se muestran en el Informe.

## 11. Cierre y reproducibilidad

- A los 4 minutos y 30 segundos no se inician nuevas búsquedas; los últimos 30 segundos se reservan para cerrar y persistir.
- El Informe se construye solo desde Afirmaciones y Registros de evidencia persistidos.
- Se registran proveedor, modelo exacto, versión de metodología y configuración efectiva de límites.
- El Informe es una instantánea inmutable fechada; cambios posteriores requieren una Investigación nueva iniciada desde el formulario principal.
- Un Informe parcial distingue trabajo incompleto, falta de evidencia y no verificabilidad.

## 12. Validación del motor

Antes de producción se evalúa un corpus versionado y revisado por humanos. Como mínimo se miden:

- precisión y exhaustividad de extracción de afirmaciones;
- exactitud de rangos y OCR;
- validez literal de citas y tasa de enlaces recuperables;
- autoridad e independencia correctamente clasificadas;
- acuerdo de veredictos con revisión humana por idioma y categoría;
- falsos concluyentes: Respaldada o Contradicha sin evidencia suficiente;
- latencia p50 y p95, costo por fase, consumo de cuota e informes parciales;
- resistencia a prompt injection, páginas maliciosas, fuentes duplicadas y conflictos;
- repetibilidad con la misma versión de modelo y configuración.

Ningún modelo se promueve a producción únicamente por una demo. Debe superar umbrales de evaluación definidos antes del lanzamiento y quedar reemplazable mediante los adaptadores de la arquitectura.
