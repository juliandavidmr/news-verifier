# Verificación de noticias

Este contexto describe el lenguaje del proceso de analizar contenido publicado y contrastar sus afirmaciones con evidencia rastreable.

## Language

**Afirmación verificable**:
Proposición factual extraída de una fuente cuyo grado de veracidad puede evaluarse mediante evidencia. Puede abarcar parte de una oración, varias oraciones o varias apariciones equivalentes que se investigan y ponderan una sola vez; excluye opiniones, predicciones, preguntas y recursos retóricos.
_Avoid_: Cláusula, frase, declaración

**Contenido analizado**:
Página web pública accesible sin autenticación ni paywall, o captura de pantalla rasterizada con texto, enviada por el usuario para someterla a verificación. Puede proceder de artículos, comunicados, blogs o publicaciones sociales; excluye inicialmente PDF, audio y video.
_Avoid_: Fuente, noticia, entrada

**Fuente de evidencia**:
Documento externo consultado para evaluar una afirmación verificable del contenido analizado.
_Avoid_: Fuente, enlace de respaldo, referencia

**Veredicto**:
Conclusión asignada a una afirmación verificable: respaldada, contradicha, engañosa, en disputa, sin evidencia suficiente o no verificable. Los tres últimos resultados no implican falsedad.
_Avoid_: Probabilidad de verdad, estado, resultado

**Índice de respaldo**:
Resumen de cuánto del contenido verificable está respaldado por evidencia; no expresa la probabilidad de que el contenido sea verdadero. Es inconcluso cuando la cobertura de evidencia es insuficiente.
_Avoid_: Porcentaje de veracidad, score de verdad, probabilidad de verdad

**Cobertura de evidencia**:
Proporción del contenido verificable para la cual la investigación encontró evidencia suficiente para emitir un veredicto concluyente.
_Avoid_: Confianza, precisión

**Importancia de la afirmación**:
Grado visible —principal, relevante o secundaria— con el que una afirmación verificable influye en el Índice de respaldo según su papel en el contenido analizado.
_Avoid_: Prioridad, relevancia de búsqueda, confianza

**Jerarquía de evidencia**:
Orden de preferencia que distingue evidencia primaria autoritativa, evidencia experta y evidencia independiente fiable. Un verificador de hechos puede orientar la investigación, pero no constituye por sí solo evidencia suficiente.
_Avoid_: Fuentes oficiales, lista blanca de medios, ranking de resultados

**Fuerza de evidencia**:
Evaluación cualitativa —alta, media o baja— de la base documental de un veredicto según la calidad, independencia, compatibilidad y conflicto de sus fuentes. No es una probabilidad generada por el modelo.
_Avoid_: Confianza del modelo, probabilidad, certeza

**Corroboración independiente**:
Confirmación de una afirmación mediante evidencia cuyos autores no dependen entre sí ni comparten el interés principal que se está evaluando.
_Avoid_: Repetición, número de enlaces, consenso aparente

**Registro de evidencia**:
Fragmento exacto y metadatos persistidos de una Fuente de evidencia que permiten auditar cómo se evaluó una afirmación sin almacenar una copia completa del documento externo.
_Avoid_: Enlace, copia de la página, bibliografía

**Periodo de referencia**:
Fecha o intervalo explícito o inferido al que se refiere una afirmación verificable. La evidencia debe corresponder a ese periodo y toda inferencia temporal se hace visible en el informe.
_Avoid_: Fecha de consulta, fecha del informe, actualidad

**Ámbito de referencia**:
País, región, jurisdicción, institución o población explícita o inferida a la que se refiere una afirmación verificable. La evidencia debe ser compatible con ese ámbito y toda inferencia se hace visible en el informe.
_Avoid_: Ubicación del usuario, idioma, dominio del sitio

**Informe inconcluso**:
Informe que no publica un Índice de respaldo porque su cobertura ponderada es menor al 60 % o porque alguna afirmación principal carece de un veredicto concluyente.
_Avoid_: Informe fallido, contenido falso, índice cero

**Idioma de interfaz**:
Idioma activo de la aplicación —español, inglés, francés o portugués— detectado a partir del navegador y modificable por el usuario desde el selector del pie de página. Usa inglés cuando el idioma del navegador no coincide con uno soportado.
_Avoid_: Idioma del contenido, idioma del navegador

**Idioma del informe**:
Idioma de interfaz capturado al iniciar una investigación y utilizado de forma inmutable para todo el contenido generado de su informe. Cambiar posteriormente el idioma de la interfaz no traduce ni regenera el informe.
_Avoid_: Idioma del contenido, traducción automática

**Idioma del contenido**:
Lengua, sin restricción, en la que está escrito el contenido analizado.
_Avoid_: Idioma de interfaz, idioma del informe

**Extracto analizado**:
Texto principal extraído de una página web o reconocido en una captura, limitado a sus primeras 2.000 palabras. Cuando el original sea más largo, el informe indica cuántas palabras se extrajeron y cuántas se analizaron.
_Avoid_: Resumen, contenido completo, recorte silencioso

**Pasaje de contexto**:
Fragmento mínimo del Extracto analizado que contiene una Afirmación verificable y el texto circundante necesario para comprenderla. Es la unidad del contenido original que puede mostrarse públicamente en el Informe; no equivale al Extracto analizado completo.
_Avoid_: Copia de la noticia, transcripción completa, artículo republicado

**Investigación**:
Proceso iniciado automáticamente a partir de un único contenido analizado para extraer afirmaciones verificables, contrastarlas y producir un informe. No admite la edición previa del Extracto analizado; si la extracción no es fiable, termina sin verificarlo.
_Avoid_: Consulta, request, verificación

**Informe parcial**:
Informe producido al agotarse el tiempo de una investigación que conserva conclusiones completadas y distingue las afirmaciones no investigadas de aquellas sin evidencia suficiente. Solo publica el Índice de respaldo cuando conserva la cobertura requerida y todas las afirmaciones principales tienen conclusión.
_Avoid_: Informe completo, informe fallido, informe inconcluso

**Informe**:
Instantánea permanente e inmutable de una investigación, identificada por la fecha y hora en que se realizó. No se actualiza cuando cambian el contenido, las fuentes o el conocimiento disponible.
_Avoid_: Resultado en vivo, verdad definitiva, página actualizable

**Estado de investigación**:
Etapa real y persistida alcanzada por una investigación: en cola, extracción, identificación de afirmaciones, investigación, evaluación, generación del informe o resultado terminal. No representa un porcentaje ni una estimación de tiempo.
_Avoid_: Porcentaje de progreso, tiempo restante, animación de carga

**Afirmación no investigada**:
Afirmación verificable detectada que no recibió investigación por agotamiento de tiempo o por el máximo permitido. No es un veredicto y reduce la Cobertura de evidencia.
_Avoid_: Sin evidencia suficiente, no verificable, omitida

**Informe no listado**:
Informe permanente accesible para cualquier persona que posea su URL, pero ausente de directorios, búsquedas internas e índices de buscadores. Sin una cuenta, la URL es el único medio de recuperación.
_Avoid_: Informe privado, informe público, informe secreto

**Visitante anónimo**:
Instalación de navegador reconocida mediante un identificador firmado para aplicar límites de uso razonable; no representa una identidad personal ni una cuenta recuperable.
_Avoid_: Usuario, cuenta, persona

**Cupo de investigaciones**:
Cantidad configurable de investigaciones que pueden iniciarse dentro de un periodo, aplicada tanto al servicio completo como a cada Visitante anónimo.
_Avoid_: Plan, saldo, suscripción

**Límite de plataforma**:
Restricción externa impuesta por Vercel AI Gateway o por el proveedor de un modelo —por tasa, periodo, crédito o disponibilidad— que el producto no controla y que prevalece sobre cualquier Cupo de investigaciones configurado internamente.
_Avoid_: Cupo configurable, límite del usuario, presupuesto garantizado
