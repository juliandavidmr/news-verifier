# OCR local para capturas en Vercel

**Estado:** investigación técnica para decidir el OCR del MVP  
**Verificado:** 18 de septiembre de 2026  
**Alcance:** PNG, JPEG o WebP de hasta 4 MB y 20 megapíxeles; procesamiento exclusivo en backend; sin persistir la captura; entrada multilingüe.

## Conclusión ejecutiva

La mejor opción para el MVP es **Tesseract.js 7 dentro de una Vercel Function con runtime Node.js**, ejecutado durante la ingesta antes de iniciar el workflow. La Function recibe el archivo como `Buffer`, hace OCR enteramente en su propio proceso y termina el worker antes de salir. La captura no necesita enviarse a Cloudflare, Google, AWS ni a un modelo de visión.

Esta decisión no significa que Vercel incluya un OCR propio. Vercel aporta el cómputo: su runtime Node ofrece compatibilidad completa con las API de Node y permite ejecutar WebAssembly; Tesseract.js aporta el motor OCR local ([runtime Node.js](https://vercel.com/docs/functions/runtimes/node-js), [WebAssembly en Vercel](https://vercel.com/docs/functions/runtimes/wasm)).

La recomendación es condicional a un spike desplegado en Vercel. Hay que demostrar que las capturas representativas caben con holgura en **2 GB / 1 vCPU**, que el p95 de OCR queda por debajo del presupuesto asignado y que Next.js incluye correctamente el worker, el WASM y los modelos. Vercel permite actualmente 300 segundos por Function en Hobby con Fluid Compute, pero el OCR no debe consumir los cinco minutos completos de la Investigación ([límites de Functions](https://vercel.com/docs/functions/limitations)).

Hay una consecuencia arquitectónica independiente del motor: **un blob que nunca se almacena no puede esperar en la cola durable**. Vercel Workflow persiste inputs, outputs y pasos, por lo que pasar la captura como input del workflow sería almacenamiento aunque la aplicación no la escriba en R2 o Blob ([persistencia de Workflows](https://vercel.com/docs/workflows)). La imagen debe someterse a OCR dentro de la petición de ingesta; solo el texto extraído puede entrar después a la cola. Si la petición se corta antes de completar OCR, no existe forma durable de reanudarla sin pedir otra carga.

Una limitación debe quedar explícita: Tesseract ofrece modelos oficiales para más de 100 idiomas y más de 35 escrituras, no para literalmente todos los idiomas existentes. Además, hay que elegir o detectar el modelo antes de reconocer bien el texto ([manual oficial de Tesseract](https://github.com/tesseract-ocr/tessdoc), [modelos `tessdata_fast`](https://github.com/tesseract-ocr/tessdata_fast)). Por tanto, “se acepta cualquier idioma” puede seguir siendo cierto para la entrada, pero el OCR de imágenes debe definirse como **mejor esfuerzo dentro del catálogo soportado** y detener la Investigación cuando la extracción no alcance una calidad mínima.

## Requisitos que condicionan la elección

1. El navegador envía una sola imagen al backend y nunca recibe una clave de un proveedor OCR.
2. El archivo original vive solo durante la petición y el paso OCR; no se escribe en Postgres, Blob ni object storage.
3. Deben aceptarse directamente PNG, JPEG y WebP. Tesseract.js documenta esos tres formatos y acepta un `Buffer` en Node ([formatos de imagen](https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md)).
4. El OCR debe finalizar bastante antes del cierre de nuevas búsquedas a los 270 segundos.
5. El motor debe ser gratuito y de código abierto, con licencia compatible con una aplicación que no necesariamente se publique bajo copyleft.
6. La imagen no debe aparecer en logs, trazas, errores, prompts ni eventos persistidos. Solo se conservan el texto extraído, metadatos técnicos no sensibles y el informe, de acuerdo con la decisión de producto.

El límite HTTP de una Vercel Function es 4,5 MB para request y response. Un archivo de 4 MB cabe si se transmite como binario o multipart con poco overhead; **no debe codificarse en base64**, porque crecería aproximadamente un tercio y superaría el límite ([límite de payload](https://vercel.com/docs/functions/limitations#request-body-size)).

## Opciones npm

### 1. Tesseract.js 7 — recomendado

**Qué es.** Es el wrapper JavaScript/WebAssembly de Tesseract para navegador y Node. No modifica el motor de reconocimiento; su responsabilidad es empaquetarlo y ofrecer una API con workers ([repositorio oficial](https://github.com/naptha/tesseract.js)). La versión publicada en npm al verificar fue **7.0.0**, con licencia Apache-2.0 y una adopción muy superior a las alternativas comparadas ([paquete npm](https://www.npmjs.com/package/tesseract.js)).

**Encaje funcional.** Acepta un `Buffer` de PNG, JPEG o WebP en Node, exactamente las entradas del MVP. Un `createWorker` usa un Web Worker en navegador o un `worker_thread` en Node; `recognize` devuelve texto y puede habilitar bloques/bounding boxes si luego se necesitan para anclar el extracto a regiones de la captura ([API oficial](https://github.com/naptha/tesseract.js/blob/master/docs/api.md)).

**Idiomas.** Permite cargar uno o varios archivos `traineddata`. Tesseract publica modelos de idioma y modelos de escritura. Los modelos `tessdata_fast` son el compromiso oficial de velocidad/precisión y los modelos por escritura permiten cubrir familias completas: por ejemplo, `Latin` cubre lenguas basadas en alfabeto latino salvo vietnamita ([catálogo y explicación de modelos](https://github.com/tesseract-ocr/tessdata_fast)). No existe un modo mágico, barato y universal: cargar muchos idiomas simultáneamente aumenta inicialización, memoria y ambigüedad.

**Inicialización y bundle.** El core WASM y el modelo se cargan al crear el worker. La guía de rendimiento indica que código más datos pueden rondar 15 MB, que la mayoría de modelos de idioma rondan 2 MB y que ciertos modelos pueden ser mucho mayores. También advierte que la inicialización puede dominar el tiempo total y que cada worker usa bastante memoria ([rendimiento](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md)).

Por defecto, Tesseract.js descarga datos de idioma desde jsDelivr. Para que la operación no dependa de un CDN en tiempo de ejecución, el spike debe fijar versiones y empaquetar el core y el conjunto inicial de modelos dentro del artefacto de despliegue. En Next.js, los archivos leídos desde `node_modules` pueden requerir `outputFileTracingIncludes`; Vercel documenta expresamente ese mecanismo ([archivos en Functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions)). El límite del bundle de una Function Node es 250 MB sin comprimir, por lo que no conviene incluir todos los modelos disponibles ([límites de bundle](https://vercel.com/docs/functions/limitations#bundle-size-limits)).

**Memoria y CPU.** Vercel Hobby ofrece 2 GB y 1 vCPU por Function. Tesseract.js redujo memoria en versiones recientes y v7 declara una mejora de tiempo de aproximadamente 15–35 % frente a v6, pero su propia guía sigue desaconsejando crear un número arbitrario de workers ([release v7](https://github.com/naptha/tesseract.js/releases), [configuración de memoria](https://vercel.com/docs/functions/configuring-functions/memory)). Para una captura se debe crear **un solo worker**, reconocer una sola imagen y terminarlo en `finally`. Crear varios workers dentro de la misma Function de 1 vCPU solo multiplica memoria y no proporciona una aceleración fiable.

**Precisión.** Es Tesseract sin mejoras propietarias. Funciona bien con capturas nítidas, horizontales y de alto contraste; Tesseract advierte que a menudo es necesario mejorar la imagen de entrada para obtener mejores resultados ([motor oficial](https://github.com/tesseract-ocr/tesseract)). No hay una cifra de precisión universal que pueda prometerse: debe medirse con capturas reales del producto, incluyendo texto pequeño, modo oscuro, columnas, compresión y distintos alfabetos.

**Riesgos de integración.** Los workers y archivos WASM son precisamente los elementos que bundlers pueden mover o excluir. El FAQ de Tesseract.js explica que, cuando un framework no conserva la ubicación esperada, hay que establecer manualmente `workerPath` ([FAQ oficial](https://github.com/naptha/tesseract.js/blob/master/docs/faq.md)). Esto no invalida la opción, pero obliga a probar el build desplegado y no solo `next dev`.

### 2. Scribe.js (`scribe.js-ocr`) — no recomendado para este MVP

**Qué aporta.** Scribe.js se construye sobre Tesseract.js y añade un modelo modificado, combinación de motores, mejor estructura documental y soporte PDF. Está activo: npm mostraba **0.15.0**, publicado 19 días antes de esta verificación ([paquete npm](https://www.npmjs.com/package/scribe.js-ocr), [repositorio](https://github.com/scribeocr/scribe.js)).

**Precisión frente a costo.** El proyecto afirma que su modo de calidad suele superar a Tesseract.js, pero también documenta que tarda aproximadamente 40–90 % más que su modo rápido, según el documento. Su benchmark propio muestra mejoras grandes en algunos casos y resultados equivalentes o peores en otros; es evidencia útil para decidir qué probar, no una garantía independiente para capturas de noticias ([comparación oficial](https://github.com/scribeocr/scribe.js/blob/master/docs/scribe_vs_tesseract.md), [benchmark reproducible del proyecto](https://github.com/scribeocr/ocr-benchmark)).

**Bundle y formatos.** La capa adicional carga más datos y funciones que este producto no necesita, especialmente PDF y exportación. Su guía de importación enumera PNG y JPEG, pero no WebP, así que este MVP necesitaría convertir WebP antes de llamar al motor ([guía oficial](https://github.com/scribeocr/scribe.js/blob/master/docs/guide.md)).

**Licencia decisiva.** Scribe.js usa AGPL-3.0. Su propia comparación dice que usarlo en frontend **o server-side** requiere publicar el programa bajo AGPL-3.0/compatible u obtener una licencia propietaria ([explicación de licencia del proyecto](https://github.com/scribeocr/scribe.js/blob/master/docs/scribe_vs_tesseract.md#license)). Como la licencia del Verificador de noticias no se ha comprometido a AGPL y el objetivo es una dependencia gratuita, esta opción queda descartada para el MVP aunque obtenga mejor precisión en parte del corpus.

### 3. `tesseract-wasm` — prometedor, pero no la primera opción de backend

**Qué es.** Es otra compilación de Tesseract a WebAssembly, con licencia BSD-2-Clause. La versión npm observada fue **0.11.0**, publicada diez meses antes, con una comunidad mucho menor que Tesseract.js ([npm](https://www.npmjs.com/package/tesseract-wasm), [repositorio oficial](https://github.com/robertknight/tesseract-wasm)).

**Fortaleza.** Está optimizado para reducir descarga e inicialización: el proyecto cifra en unos 2,1 MB comprimidos la librería más los datos de inglés y aprovecha WebAssembly SIMD cuando está disponible. Ofrece una API de alto nivel con Web Worker y otra síncrona de bajo nivel ([documentación oficial](https://robertknight.github.io/tesseract-wasm/api/)).

**Debilidad para este caso.** La optimización elimina decodificadores de imagen y la ruta documentada está orientada al navegador: hay que servir manualmente dos WASM, el worker y el `traineddata`, y entregar una imagen ya decodificada. En Node/Vercel esto traslada complejidad al proyecto: haría falta otra capa para decodificar PNG/JPEG/WebP, localizar assets y verificar la compatibilidad del worker. No mejora por sí mismo el modelo de reconocimiento porque sigue siendo Tesseract.

Debe incluirse en el spike como **challenger** si Tesseract.js falla el objetivo de inicialización o memoria. No conviene elegirlo de antemano solo por el tamaño comprimido del ejemplo en inglés; el producto necesita datos multilingües y un backend Node, no una demo inglesa en navegador.

### 4. Wrappers del binario nativo — solo con un entorno que lo instale

`node-tesseract-ocr` no contiene el motor: exige instalar previamente el binario `tesseract` con `apt-get`. Su última versión publicada, 2.2.1, tenía cinco años al verificar ([npm oficial](https://www.npmjs.com/package/node-tesseract-ocr)). Una Vercel Function ordinaria no ofrece un paso `apt-get` en cada ejecución, por lo que este wrapper no es desplegable por sí solo.

Existe un binding nativo más reciente, `@luii/node-tesseract-ocr`, con prebuilds y descarga perezosa de modelos, pero tenía seis descargas semanales y ninguna adopción dependiente visible al verificar ([npm oficial](https://www.npmjs.com/package/@luii/node-tesseract-ocr)). Introducir un addon nativo poco probado en Vercel aumenta el riesgo de ABI, arquitectura y trazado de binarios sin aportar una ventaja demostrada para el MVP.

## Comparación

| Criterio | Tesseract.js 7 | Scribe.js | tesseract-wasm | Wrapper nativo |
|---|---|---|---|---|
| OCR local sin enviar la imagen | Sí | Sí | Sí | Sí, si existe el binario |
| Node backend documentado | Sí | Sí | Sí, pero API/ejemplos más orientados al navegador | Sí |
| PNG/JPEG/WebP directos | Sí | WebP no documentado | Requiere decodificar la imagen | Depende de Leptonica/build |
| Idiomas | Modelos Tesseract 100+; selección explícita | Modelos Tesseract; selección explícita | Modelos Tesseract; selección explícita | Modelos Tesseract instalados |
| Precisión esperada | Base de Tesseract | Puede mejorarla; más lento | Base de Tesseract | Base nativa de Tesseract |
| Inicialización | Core + worker + modelo | Más componentes/modelos en modo calidad | Muy compacto en inglés; assets manuales | Proceso/binario + modelos |
| Paralelismo | `worker_threads`; limitar a uno por Function | Pool interno; no aporta CPU adicional en Hobby | Web Worker o API síncrona | Proceso/addon nativo |
| Licencia | Apache-2.0 | AGPL-3.0 o comercial | BSD-2-Clause | MIT/Apache según wrapper |
| Riesgo en Next.js/Vercel | Medio: tracing de worker/WASM/modelos | Alto: bundle, licencia y tiempo | Medio/alto: decodificación y assets | Alto: binario/ABI |
| Veredicto | **Spike y primera opción** | Descartar para MVP | Challenger del spike | Descartar en Function normal |

## Capacidades propias de Vercel

### Vercel Functions: sí ejecutan el OCR local

El runtime Node es la capacidad nativa que mejor encaja. Vercel lo recomienda para funciones computacionalmente intensas y documenta compatibilidad completa con Node. En Hobby, la configuración vigente con Fluid Compute ofrece 2 GB / 1 vCPU y hasta 300 segundos; el bundle sin comprimir puede medir hasta 250 MB ([runtime Node](https://vercel.com/docs/functions/runtimes/node-js), [límites](https://vercel.com/docs/functions/limitations)).

El free tier incluye cuatro horas mensuales de CPU activa. OCR es CPU-bound, así que su capacidad global debe medirse: si una captura consumiera 30 segundos de CPU, el techo aritmético sería 480 capturas al mes; a 60 segundos serían 240. Es solo una cota teórica porque el resto de la aplicación comparte la cuota ([uso y precios de Fluid Compute](https://vercel.com/docs/functions/usage-and-pricing)). El límite global configurable ya aprobado debe considerar esta cuota, no solo inferencia y búsqueda.

Fluid Compute puede reutilizar una instancia y su estado global entre solicitudes concurrentes, reduciendo cold starts, pero todavía puede iniciar instancias nuevas. Por eso se puede aprovechar un worker ya cargado como optimización posterior, pero nunca depender de que exista ni compartirlo sin un mutex entre invocaciones ([modelo de Compute](https://vercel.com/docs/fundamentals/what-is-compute)). Para el MVP es más seguro crear y terminar el worker por trabajo hasta medir el comportamiento desplegado.

### Vercel Sandbox: posible, pero sobredimensionado

Sandbox ejecuta microVMs Ubuntu, permite `apt-get` y `sudo`, y en Hobby admite hasta 4 vCPU, 45 minutos continuos y diez sandboxes concurrentes. Su free tier publicado incluye cinco horas de CPU activa y 420 GB-horas de memoria ([producto Sandbox](https://vercel.com/sandbox), [precios de Vercel](https://vercel.com/pricing)). Técnicamente podría instalar o incluir Tesseract nativo y procesar la captura dentro de Vercel.

No es OCR nativo: añade creación de sandbox, transferencia del blob, una imagen o snapshot que mantener y otro presupuesto de cómputo. Para una sola imagen pequeña, una Function con WASM tiene menos partes y menor latencia de arranque. Sandbox queda como plan B si el spike demuestra que el binario nativo supera de forma sustancial a WASM o que se necesitan modelos demasiado grandes para el bundle de la Function.

### AI SDK y AI Gateway: no son OCR local

AI SDK estandariza llamadas a modelos; AI Gateway enruta solicitudes entre proveedores de inferencia y expone modelos cuya modalidad puede ser `text+image→text`. La documentación describe explícitamente proveedores externos y routing/fallback entre ellos ([modelos y proveedores](https://vercel.com/docs/ai-gateway/models-and-providers), [opciones de proveedor](https://vercel.com/docs/ai-gateway/models-and-providers/provider-options)).

Un modelo de visión podría transcribir la captura, pero la imagen saldría de la Function hacia el proveedor elegido y consumiría crédito/tokens. Ni AI SDK ni Gateway ejecutan por sí mismos un modelo OCR local dentro de la Function. Por tanto, no satisfacen el objetivo de evitar el procesamiento externo.

## Diseño recomendado para el MVP

1. **Crear primero el Informe.** Una petición pequeña reserva cupos, crea el short UUID y deja el Informe en `esperando_imagen`. Así la UI puede conocer la URL antes del trabajo pesado.
2. **Subir sin base64.** El navegador envía el blob por una segunda petición al endpoint de ingesta del Informe. El endpoint lee un `Buffer` desde multipart o cuerpo binario y valida límite, firma real, MIME y dimensiones.
3. **Procesar antes de encolar.** Esa misma Function hace OCR y persiste solamente el texto. Después inicia el workflow con el `report_id`, nunca con la imagen. La cola de Investigaciones y su espera máxima de 15 minutos comienzan cuando el texto está listo.
4. **No persistir.** Mantener el `Buffer` solo en memoria. No guardar la imagen en `/tmp`, Neon, Blob, inputs de Workflow, eventos o logs. Si la conexión o la Function fallan antes de persistir el texto, el Informe termina como fallo de extracción y el usuario debe cargar la imagen otra vez en una Investigación nueva.
5. **Ejecutar en Node.** El endpoint OCR debe declarar runtime Node, no Edge. Cargar Tesseract.js mediante import server-only.
6. **Fijar assets.** Empaquetar el core, worker y un conjunto versionado de `tessdata_fast`; configurar sus rutas explícitamente y agregarlas a `outputFileTracingIncludes`. No descargar código o modelos mutables desde un CDN durante la Investigación.
7. **Seleccionar por escritura.** Hacer una primera detección local de orientación/escritura con `osd` y cargar un solo modelo de escritura o idioma. Tesseract.js deshabilita esta detección por defecto en builds modernos y exige datos/core legacy, de modo que el spike debe medir si su costo compensa el beneficio ([cambios de Tesseract.js v5](https://github.com/naptha/tesseract.js/releases)). Si no compensa, el MVP puede comenzar con un conjunto explícito de escrituras prioritarias y fallar claramente en las demás.
8. **Un worker y deadline propio.** Crear un worker por trabajo, reconocer una imagen y llamar `terminate()` siempre. Aplicar un deadline inicial de 60 segundos; al vencer, terminar el worker y devolver fallo de extracción. No basta con `Promise.race`, porque dejaría CPU trabajando en segundo plano.
9. **Calidad mínima.** Rechazar texto vacío, extremadamente corto o con confianza insuficiente; nunca iniciar la verificación factual sobre OCR dudoso. La confianza OCR sirve para detener extracción, no para asignar veracidad.
10. **Liberar referencias.** Después de extraer y truncar a 2.000 palabras, eliminar referencias al `Buffer` y al worker. Persistir solo el extracto, el idioma/escritura detectada, el conteo, el truncamiento y métricas operativas.

Este flujo agrega al contrato temporal un presupuesto de ingesta OCR de hasta 60 segundos **antes** de los 15 minutos de cola y de los cinco minutos de Investigación. Es el costo inevitable de combinar una cola durable con la prohibición de almacenar el blob. Si producto exige que la imagen pueda esperar en cola o sobrevivir al cierre del navegador, habría que revertir una de esas dos decisiones y aceptar almacenamiento temporal cifrado.

El límite de 20 MP no implica procesar siempre a resolución completa. El spike debe probar preprocesamiento local controlado —orientación, contraste y reducción cuando el texto conserva suficientes píxeles de altura— y medir si mejora costo y exactitud. No debe adoptarse una transformación fija sin corpus: reducir una captura con tipografía pequeña puede destruir precisamente el texto que se quiere verificar.

## Spike de validación

### Objetivo

Demostrar en un **deployment preview de Vercel**, no solo en local, que Tesseract.js es operable y suficientemente preciso dentro del presupuesto. Comparar `tesseract-wasm` únicamente en los casos donde pueda integrarse sin convertir el spike en una segunda plataforma.

### Corpus mínimo

Preparar 40–60 capturas con texto de referencia corregido manualmente:

- español, inglés, francés y portugués;
- al menos una muestra representativa de cirílico, árabe, devanagari y CJK;
- PNG, JPEG y WebP;
- modo claro y oscuro, una y dos columnas, texto pequeño, compresión fuerte, rotación y capturas largas;
- tamaños cercanos a 4 MB y 20 MP;
- casos ilegibles que deban rechazarse.

No subir este corpus al repositorio si contiene datos personales. Usar fixtures sintéticos o con licencia clara para CI y conservar las muestras sensibles solo durante la ejecución manual.

### Variantes

1. Tesseract.js 7 con modelos de idioma concretos.
2. Tesseract.js 7 con `osd` + modelo por escritura.
3. `tessdata_fast` frente al modelo de mayor calidad solo en un subconjunto difícil.
4. `tesseract-wasm` con el mismo modelo cuando el decoder y los assets funcionen en Node.
5. Sin preprocesamiento frente a orientación/contraste/downscale local.

### Métricas

- character error rate y word error rate contra la transcripción de referencia;
- porcentaje de palabras omitidas, no solo caracteres sustituidos;
- exactitud del idioma/escritura y de la rotación;
- cold start, inicialización, reconocimiento y tiempo total p50/p95/máximo;
- pico de RSS/heap y salida limpia del worker;
- tamaño desplegado de la Function y presencia real de worker/WASM/modelos;
- CPU activa consumida en Vercel;
- tasa de rechazo correcto de entradas ilegibles;
- ausencia del blob y de texto sensible en logs/trazas.

### Umbrales propuestos para aprobar

- 100 % de las muestras válidas terminan sin crash ni archivo faltante.
- p95 total de OCR **≤ 30 segundos** y ningún caso válido supera 60 segundos.
- pico de memoria **≤ 1,2 GB**, dejando margen al runtime y a invocaciones compartidas.
- word error rate mediana **≤ 5 %** en capturas nítidas de las cuatro lenguas prioritarias.
- los casos que superen el umbral de error o no tengan suficiente texto se rechazan; no pasan silenciosamente a la investigación.
- el bundle queda por debajo de 200 MB sin comprimir para reservar margen respecto al máximo de 250 MB.

Estos umbrales son una propuesta de ingeniería, no capacidades garantizadas por las librerías. Si Tesseract.js no los cumple, el resultado del spike debe decidir entre: reducir la promesa de idiomas/20 MP, elegir `tesseract-wasm` si el problema es solo peso, o mover OCR nativo a Vercel Sandbox. No se debe introducir silenciosamente un OCR externo, porque cambiaría la decisión de privacidad.

## Decisión propuesta

Adoptar provisionalmente **Tesseract.js 7 + `tessdata_fast` en Vercel Functions Node** con un adaptador interno `OcrEngine`. Mantener el motor detrás de esa interfaz para que un resultado negativo del spike permita reemplazarlo por `tesseract-wasm` o por Tesseract nativo en Sandbox sin cambiar el dominio.

No adoptar Scribe.js por su licencia AGPL/costo comercial y su mayor tiempo. No adoptar AI SDK/Gateway para OCR porque procesarían la captura mediante proveedores externos. No adoptar Sandbox mientras la Function local no haya demostrado ser insuficiente.

La pregunta que queda para producto no es qué proveedor OCR adicional recibe la imagen —con esta opción, ninguno; Vercel sigue siendo el procesador de la petición— sino qué hacer cuando el idioma o la calidad exceden el catálogo local: la recomendación es **detener y explicar la limitación**, nunca investigar sobre una transcripción poco fiable.
