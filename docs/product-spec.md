# Verificador de noticias: especificación de producto

Este documento reúne únicamente decisiones aprobadas durante la entrevista. Se ampliará conforme se resuelvan las decisiones pendientes.

## Entrada

- Cada investigación recibe exactamente una entrada: una URL o una imagen, nunca ambas.
- Las URLs deben apuntar a páginas públicas accesibles sin autenticación ni paywall.
- Las imágenes admitidas inicialmente son capturas PNG, JPG/JPEG o WebP que contengan texto.
- Se admiten artículos, comunicados, blogs y publicaciones sociales capturadas como imagen.
- PDF, audio y video quedan fuera del MVP.
- El contenido analizado puede estar en cualquier idioma.
- La investigación comienza automáticamente, sin confirmación ni edición manual del texto extraído.
- Si la extracción no es suficientemente fiable, la investigación termina sin verificar el contenido y explica el problema.
- Se analiza un máximo de 2.000 palabras del contenido principal extraído o reconocido por OCR.
- Cuando el contenido excede el límite, se trunca y se informa cuántas palabras se extrajeron y cuántas se analizaron.

## Seguridad de contenido remoto

- El servidor solo recupera URLs `http` o `https`; rechaza credenciales embebidas, hosts locales y direcciones privadas, reservadas, de enlace local o de metadatos de infraestructura.
- Cada redirección y resolución DNS se vuelve a validar para impedir SSRF y DNS rebinding.
- La descarga aplica límites estrictos de tiempo, bytes, redirecciones y tipo de contenido, y nunca reenvía cookies, autorización ni encabezados privados del usuario.
- Las mismas reglas se aplican tanto a la URL inicial como a toda Fuente de evidencia recuperada durante la Investigación.
- HTML, texto extraído, OCR y datos del modelo se tratan siempre como contenido no confiable: se normalizan y escapan antes de mostrarse, sin ejecutar scripts, eventos, estilos o URLs activas provenientes de la fuente.
- Una página que infringe estas reglas termina como extracción fallida o fuente inaccesible; el motor nunca relaja las protecciones para completar el informe.

## Idiomas

- La interfaz admite español, inglés, francés y portugués.
- El idioma se selecciona automáticamente a partir del navegador; si no coincide con uno soportado, se usa inglés.
- El usuario puede cambiar el idioma de interfaz desde el selector del pie de página.
- El idioma de interfaz activo al iniciar una investigación queda fijado como Idioma del informe.
- Cambiar posteriormente la interfaz no traduce ni regenera un informe existente.
- La evidencia puede estar en cualquier idioma; el informe debe preservar el fragmento original y presentar su traducción cuando sea necesaria.

## Dirección visual

- La interfaz reinterpreta el lenguaje visual de Gumroad sin copiar su identidad.
- Usa tipografía grande y directa, bloques planos, bordes negros, poco redondeo, jerarquía simple y espacio generoso.
- La base visual es marfil y negro, con un único acento vibrante para acciones.
- Los colores semánticos se reservan para veredictos y estados de evidencia.
- La experiencia prioriza lectura prolongada, accesibilidad y credibilidad sobre ornamentación comercial.

## Formulario principal

- Una única tarjeta ofrece dos modos mutuamente exclusivos: Enlace e Imagen.
- Enlace es el modo inicial.
- El selector usa dos controles de igual tamaño y peso visual; Imagen incluye icono y la etiqueta explícita “Subir captura”.
- Solo el modo activo se envía al servidor.
- Al cambiar de modo, el borrador anterior se conserva únicamente en el navegador durante la visita y nunca se envía con el modo nuevo.
- Cerrar o recargar la página descarta ambos borradores locales.

## Evaluación de afirmaciones

- El sistema extrae afirmaciones verificables y excluye opiniones, predicciones, preguntas y recursos retóricos.
- Cada afirmación se clasifica como principal, relevante o secundaria.
- Los veredictos posibles son: respaldada, contradicha, engañosa, en disputa, sin evidencia suficiente y no verificable.
- El sistema distingue la evidencia ausente de la evidencia fiable que está en conflicto.
- Se prefiere, en orden, evidencia primaria autoritativa, evidencia experta y evidencia independiente fiable.
- Un verificador de hechos puede orientar la búsqueda, pero no constituye por sí solo evidencia suficiente.
- Las afirmaciones controvertidas requieren corroboración independiente salvo que exista un registro primario concluyente.
- Se detectan todas las afirmaciones verificables, pero se investigan como máximo 15 por informe.
- El máximo de afirmaciones investigadas es configurable desde la base de datos.
- Las afirmaciones que exceden el máximo aparecen como no investigadas por límite y reducen la Cobertura de evidencia.
- Cuando hay más afirmaciones que el máximo, se ordenan por importancia y luego por su aparición en el Extracto analizado.
- Si una afirmación principal queda sin investigar por el máximo, el informe es inconcluso.
- Las repeticiones semánticamente equivalentes se agrupan en una sola afirmación vinculada a todas sus apariciones.
- Una afirmación agrupada se investiga y pondera una sola vez.
- Cada Registro de evidencia conserva URL, título, entidad publicadora, autor cuando exista, fechas de publicación o actualización cuando existan, fecha y hora de consulta, fragmento exacto, idioma original, traducción utilizada, nivel de evidencia y huella criptográfica del contenido consultado.
- No se almacena una copia completa de páginas de terceros; solo el fragmento necesario para auditar la conclusión.
- Toda fuente citada debe haber sido descargada por el servidor y persistida antes de evaluar la afirmación.
- Cada fragmento citado debe existir literalmente en el contenido recuperado después de una normalización mínima.
- El modelo solo puede referirse a identificadores de Registros de evidencia ya validados.
- Un veredicto concluyente sin evidencia válida se degrada a sin evidencia suficiente.
- La explicación final se genera únicamente desde afirmaciones y Registros de evidencia validados.
- Los snippets de resultados de búsqueda solo orientan nuevas consultas y nunca cuentan como evidencia.
- Una página localizada pero inaccesible puede mencionarse como fuente no verificable, sin influir en el veredicto ni en la Fuerza de evidencia.
- El Contenido analizado nunca cuenta como evidencia de sus propias afirmaciones.
- Sus enlaces salientes sirven para descubrir posibles fuentes, pero cada destino debe recuperarse, validarse y clasificarse de forma independiente.
- Cada afirmación conserva un periodo de referencia explícito o inferido.
- La evidencia solo respalda o contradice una afirmación cuando es temporalmente compatible con ese periodo.
- El informe muestra las fechas inferidas y su incertidumbre; un dato actual no refuta automáticamente uno histórico.
- Cada afirmación conserva un ámbito de referencia explícito o inferido.
- La evidencia de otra jurisdicción, institución o población no puede usarse como contradicción directa.
- El informe muestra cualquier ámbito inferido y su incertidumbre.
- Cada veredicto muestra una Fuerza de evidencia alta, media o baja.
- La Fuerza de evidencia se deriva mediante reglas visibles de calidad, independencia, compatibilidad temporal y geográfica, y conflictos entre fuentes.
- No se muestran probabilidades ni porcentajes de confianza generados por el modelo.
- La Fuerza de evidencia es alta ante un registro primario concluyente o al menos dos fuentes fiables e independientes, temporal y geográficamente compatibles, sin conflicto equivalente.
- Es media ante una fuente directa y fiable o varias fuentes independientes pero incompletas.
- Es baja ante evidencia indirecta, débil, parcialmente compatible o con incertidumbre relevante.
- Una Fuerza de evidencia baja no puede producir un veredicto respaldado o contradicho; debe resultar sin evidencia suficiente o en disputa.
- Para una afirmación no verificable, la Fuerza de evidencia no aplica.

## Índice de respaldo

- El índice no representa la probabilidad de que el contenido sea verdadero.
- Pesos por importancia: principal 5, relevante 2 y secundaria 1.
- Aporte por veredicto: respaldada 100 %, engañosa 50 % y contradicha 0 %.
- En disputa, sin evidencia suficiente y no verificable no entran al índice y reducen la Cobertura de evidencia.
- El informe es inconcluso y no publica índice si la cobertura ponderada es menor al 60 % o si alguna afirmación principal carece de conclusión.
- El informe muestra la fórmula, los pesos y los aportes de cada afirmación.

## Autoridad y límites del informe

- Cada informe se presenta como un análisis automatizado y fechado de evidencia, no como una declaración de verdad absoluta.
- El límite se muestra de forma visible y comprensible; no queda relegado únicamente a términos legales.
- El informe no sustituye asesoría médica, legal o financiera.
- Cada conclusión permite inspeccionar sus fuentes, fragmentos y fecha de consulta, y el informe enlaza la metodología aplicada.

## Duración y resultado parcial

- La investigación puede tardar hasta cinco minutos.
- Se dejan de iniciar nuevas búsquedas a los 4 minutos y 30 segundos.
- Los últimos 30 segundos se reservan para sintetizar y persistir el resultado.
- Si se agota el tiempo, se publica un informe parcial que conserva veredictos y evidencias ya completados.
- Las afirmaciones pendientes se marcan como no investigadas por tiempo agotado, no como sin evidencia suficiente.
- Un informe parcial solo publica el Índice de respaldo si mantiene la cobertura requerida y todas las afirmaciones principales tienen conclusión.

## Arquitectura del motor

- El motor es una pipeline propia, acotada y durable construida con Vercel Workflow SDK y AI SDK Core.
- Cada fase expone contratos explícitos para extracción, inferencia, búsqueda, recuperación y evaluación de evidencia.
- Los proveedores se conectan mediante adaptadores intercambiables y el informe registra los proveedores y modelos exactos utilizados.
- Vercel AI Gateway es la puerta de enlace inicial de inferencia.
- La configuración contiene un pool ordenado de modelos de AI Gateway que deben ser gratuitos en el momento de uso y superar el corpus multilingüe de evaluación antes de ser promovidos.
- El pool configurado funciona como allowlist; el servidor contrasta periódicamente sus identificadores, elegibilidad Free Tier y precio vigente con el catálogo de AI Gateway, y desactiva cualquier integrante que deje de ser gratuito o disponible.
- `inclusionai/ling-3.0-flash-vl-free` es el candidato primario inicial; su selección es provisional hasta completar esa evaluación.
- Ante `429`, indisponibilidad o agotamiento de un modelo, el motor respeta `retry-after` cuando cabe dentro del presupuesto temporal y puede continuar con el siguiente modelo gratuito aprobado.
- No existe fallback a modelos pagos ni recarga automática. Si todos los modelos gratuitos aprobados están limitados o no disponibles, la investigación termina parcial o fallida antes de generar un cargo.
- Cada llamada conserva el proveedor y modelo exactos utilizados; un mismo informe puede registrar más de uno cuando haya fallback.
- Exa Search es el proveedor inicial de descubrimiento y recuperación de evidencia mediante la herramienta `gateway.tools.exaSearch()` de Vercel AI Gateway.
- Cada investigación aplica un presupuesto máximo configurable de búsquedas y resultados. No existe recarga automática ni fallback de búsqueda pago fuera de ese presupuesto.
- Si el crédito o presupuesto de búsqueda se agota, se conserva la evidencia ya validada y la investigación termina parcial o fallida según las reglas de cobertura.
- La herramienta `gateway.tools.exaSearch()` es la ruta primaria. Si AI Gateway rechaza la operación por verificación de cuenta, cuota o indisponibilidad, el mismo adaptador puede usar `EXA_API_KEY` directamente; ambas rutas comparten el mismo presupuesto duro, contrato de auditoría y validación de páginas. No existe fallback de búsqueda pago ni se aceptan snippets como evidencia.
- OCR se ejecuta en el servidor detrás de un adaptador reemplazable.
- El Índice de respaldo, la Cobertura de evidencia y las reglas de cierre se calculan en código determinista.
- Eve y JEV no son dependencias del MVP.
- JEV puede evaluarse posteriormente como segundo evaluador de evidencia; Eve se reconsiderará solo si la investigación se vuelve conversacional o autónoma.
- Neon Postgres es la fuente de verdad para informes, afirmaciones, evidencia, progreso, configuración, cupos y leases de ejecución.
- La aplicación se conecta a Neon mediante `@neondatabase/serverless` y las variables ya declaradas en `.env.example`; la conexión pooled se usa en runtime y la conexión unpooled queda disponible para operaciones que la requieran.
- La concurrencia global se controla mediante leases transaccionales en Postgres, con un mínimo inicial de dos slots.
- El estado administrado de Workflow no se usa como almacenamiento permanente del producto.
- Las capturas no se guardan en base de datos ni object storage: el blob se envía al backend, se valida, se procesa mediante OCR y se descarta.
- El workflow recibe solamente el texto extraído y los metadatos necesarios, nunca el archivo original.
- Las capturas admitidas son PNG, JPG/JPEG o WebP de hasta 4 MB y 20 megapíxeles.
- El backend valida tipo declarado, firma real, dimensiones y orientación antes del OCR; los archivos que superan los límites se rechazan sin almacenarse.
- El OCR usa Tesseract.js 7 con `tessdata_fast` dentro de una Vercel Function Node.
- El OCR ocurre durante la ingesta, antes de la cola, con un máximo de 60 segundos; el blob permanece solo en memoria y se descarta al terminar.
- La adopción queda condicionada a un spike desplegado que valide precisión, bundle, memoria y latencia; `tesseract-wasm` es el challenger si falla por peso o inicialización.

## Progreso

- La página del informe refleja estados reales y persistidos: en cola, extracción, identificación de afirmaciones, investigación de la afirmación X de Y, evaluación de evidencia, generación del informe y resultado terminal.
- Los resultados terminales son completado, parcial o fallido.
- No se muestran porcentajes ni estimaciones de tiempo restante.
- Recargar o reabrir la página recupera el último estado y no reinicia ni duplica la investigación que continúa en el servidor.
- Cuando no hay capacidad concurrente inmediata, una investigación aceptada espera en cola en vez de ser rechazada.
- La cola no muestra posición ni tiempo estimado.
- El presupuesto de cinco minutos empieza al iniciar la extracción, no al entrar en cola.
- El cupo queda reservado durante la espera y se devuelve si un fallo interno cancela la investigación antes de comenzar.
- Una investigación puede permanecer en cola un máximo configurable de 15 minutos.
- Si vence ese plazo, termina como no iniciada por falta de capacidad, devuelve el cupo individual y conserva su página con la explicación del fallo.
- Reintentar un intento fallido crea una investigación y una URL nuevas; la página anterior permanece inmutable.
- Un reintento de URL puede prerrellenar la entrada, pero una imagen debe volver a cargarse.
- La cola dispone de al menos dos workers capaces de procesar investigaciones distintas en paralelo.
- La concurrencia de workers es configurable y no presupone servidores permanentes separados.
- Cada job puede investigar inicialmente hasta tres afirmaciones en paralelo; este límite también es configurable.
- Los resultados se presentan en el orden del Extracto analizado, no en el orden en que terminan las ramas paralelas.
- La página se actualiza en tiempo real y cambia automáticamente de progreso a informe.
- El usuario puede pulsar “Avisarme cuando termine” para solicitar una notificación del sistema.
- El permiso de notificaciones nunca se solicita al cargar la página y solo se activa tras esa acción explícita.
- La notificación funciona mientras la pestaña permanece abierta o en segundo plano; el MVP no implementa Web Push tras cerrar la pestaña.
- Al completarse, el título de la pestaña cambia a “Informe listo”.

## Informe

- El encabezado muestra Índice de respaldo, Cobertura de evidencia, estado terminal y fecha de investigación.
- En escritorio, los Pasajes de contexto ocupan la columna izquierda y el detalle de la afirmación seleccionada la derecha.
- Seleccionar un resaltado muestra su veredicto, Fuerza de evidencia, explicación y Registros de evidencia.
- En móvil, el detalle aparece en un panel debajo del fragmento seleccionado.
- Una lista-resumen permite recorrer las afirmaciones en el orden del contenido.
- Los veredictos usan conjuntamente color, etiqueta e icono; el color nunca es la única señal.

## Acceso a informes

- Cada investigación crea inmediatamente una página con un identificador corto y no adivinable.
- El informe es compartible pero no listado: cualquiera con la URL puede abrirlo.
- No existe directorio público ni búsqueda de informes y las páginas se marcan `noindex`.
- La URL es el único medio de recuperación; no existen cuentas ni recuperación de enlaces perdidos.
- La URL y el informe final no caducan automáticamente.
- Se conservan el informe, el Extracto analizado y los fragmentos de evidencia necesarios para auditar el resultado.
- El informe público no reproduce el Extracto analizado completo: muestra únicamente cada afirmación con su Pasaje de contexto mínimo y enlaza la URL original cuando exista.
- El archivo de imagen original y sus metadatos se eliminan después del procesamiento.
- En informes originados por una captura, los resaltados se presentan sobre Pasajes de contexto derivados del OCR, no sobre el archivo original ni sobre su transcripción completa.
- El MVP no permite que el usuario elimine un informe ni proporciona una clave de eliminación.
- El MVP no incluye un botón ni un flujo para reportar contenido.
- El operador puede ocultar o eliminar informes por razones legales, de privacidad o abuso.
- Cada informe muestra la fecha y hora en que fue investigado y permanece como una instantánea inmutable.
- Un informe nunca se recalcula silenciosamente cuando cambian el contenido, las fuentes o el conocimiento.
- El MVP no muestra un botón para volver a investigar desde un informe.

## Privacidad y retención

- Subir una captura inicia su procesamiento inmediatamente, sin advertencia, confirmación adicional ni detección preventiva de datos sensibles.
- La página correspondiente es la **Política de privacidad**, disponible desde el footer en los cuatro idiomas soportados; no se crea una página legal separada únicamente para retención.
- La Política de privacidad contiene una sección explícita “Retención de datos” que distingue el blob temporal de la captura, el Extracto analizado persistido, los fragmentos de evidencia, el identificador firmado del navegador y la señal de red seudonimizada.
- La política explica finalidad, destinatarios o proveedores, periodo o criterio de conservación, procesamiento automatizado y datos que quedan visibles para quien posea la URL.
- La captura original y sus metadatos se descartan al terminar el OCR; el Extracto analizado y el informe no tienen caducidad automática mientras el servicio permanezca operativo.
- Antes del lanzamiento deben definirse en esa política la identidad y el contacto del responsable, la base jurídica y los derechos aplicables según las jurisdicciones donde opere el servicio.

## Uso anónimo

- No existen registro, inicio de sesión ni cuentas.
- Cada Visitante anónimo puede iniciar hasta 30 investigaciones por día como límite de uso razonable.
- El control usa un identificador de navegador firmado, un contador en el servidor y una señal de red temporal y seudonimizada.
- El límite no se anuncia en la interfaz normal; solo se informa cuando el visitante intenta iniciar una investigación que lo supera.
- El límite no pretende demostrar identidad ni ser imposible de evadir.
- Existe además un cupo global que protege la capacidad gratuita total del servicio.
- Los cupos global y por Visitante anónimo son configurables desde la base de datos.
- Los Límites de plataforma de AI Gateway y de sus proveedores prevalecen sobre ambos cupos configurables: que exista capacidad interna nunca garantiza que Vercel acepte una llamada.
- La capacidad efectiva del servicio es la intersección entre los cupos internos, los modelos elegibles del Free Tier, sus límites por modelo, el crédito disponible y la disponibilidad del proveedor.
- Los números de los Límites de plataforma no se duplican como configuración estática porque Vercel puede modificarlos; el runtime interpreta `429`, `402`, `retry-after` y errores de disponibilidad, y mantiene un estado temporal para evitar nuevos trabajos destinados a fallar.
- Ambos cupos permanecen ocultos hasta que uno de ellos bloquea un nuevo envío.
- Si el cupo global está agotado, se rechazan nuevas investigaciones y los informes existentes permanecen accesibles.
- Ambos cupos se reservan atómicamente cuando el servidor acepta un envío válido.
- Una entrada rechazada antes de comenzar no consume cupo.
- Una investigación iniciada consume cupo aunque concluya sin evidencia o produzca un informe parcial.
- Un fallo interno o de proveedor devuelve el cupo al Visitante anónimo.
- Un trabajo que no puede continuar porque todos los modelos gratuitos alcanzaron un Límite de plataforma se trata como fallo de proveedor a efectos de devolución del cupo del Visitante anónimo.
- El consumo real de capacidad global se registra aunque se devuelva el cupo individual.
