# Persistencia, almacenamiento y cola para el Verificador de noticias

**Estado:** investigación técnica para decidir arquitectura  
**Verificado:** 18 de septiembre de 2026  
**Alcance:** base de datos, archivos y ejecución durable para Next.js en Vercel, con informes permanentes, progreso persistido, cupos atómicos, cola de 15 minutos y al menos dos investigaciones concurrentes.

## Conclusión ejecutiva

La combinación recomendada para el MVP es:

- **Neon Postgres mediante la integración nativa de Vercel** como fuente de verdad para Informes, Afirmaciones, Evidencias, eventos de progreso, configuración, cupos y leases de ejecución.
- **Vercel Workflow SDK** para ejecutar la pipeline durable ya aprobada. No usar su event log como almacenamiento del producto: en Hobby se elimina un día después de terminar cada run.
- **Un semáforo transaccional en Postgres** para limitar las Investigaciones activas, con valor configurable en base de datos y mínimo inicial de dos. Vercel anunció el control nativo de concurrencia de Workflow como trabajo futuro; hoy no debe asumirse disponible.
- **Cloudflare R2 privado y temporal** solamente cuando una captura deba sobrevivir a la petición inicial y al tiempo en cola. El objeto se elimina tras OCR. Si el límite de archivo se mantiene por debajo de 4,5 MB, Vercel Blob privado es una alternativa más simple, pero su free tier es menor y queda inaccesible al agotarse.
- **Eventos de dominio propios en Postgres**, no logs de proveedor, para que la página pueda reconstruir el progreso y el resultado permanentemente.

Esta arquitectura sirve al MVP dentro de cuotas gratuitas moderadas, pero **“permanente” es una política de la aplicación, no una garantía de ningún free tier**. Se necesita exportación periódica y un camino de pago antes de acercarse al límite de 0,5 GB de Postgres. Además, Vercel define Hobby para uso personal y no comercial; si el producto se vuelve comercial debe pasar a Pro ([precios y alcance de planes de Vercel](https://vercel.com/pricing)).

## Requisitos que condicionan la decisión

La infraestructura debe sostener simultáneamente:

1. Una transacción que reserve el cupo global y el del Visitante anónimo, cree la Investigación y deje un registro idempotente.
2. Una cola que sobreviva a recargas, despliegues y fallos, con espera máxima de 15 minutos.
3. Al menos dos Investigaciones activas, con concurrencia global configurable desde base de datos.
4. Hasta tres Afirmaciones investigadas en paralelo dentro de cada Investigación.
5. Progreso observable y un Informe que permanezcan después de que caduquen los logs del runtime.
6. Eliminación del archivo de imagen original después de extraer el texto.

Estos requisitos separan tres responsabilidades: **datos relacionales permanentes**, **objetos temporales** y **orquestación durable**. Ningún producto evaluado debería tratarse como sustituto de los tres.

## Base de datos

### Neon Postgres / Postgres en Vercel — recomendado

#### Hechos confirmados

“Vercel Postgres” ya no existe para proyectos nuevos. Vercel migró los almacenes existentes a Neon en diciembre de 2024 y ahora ofrece Postgres mediante proveedores del Marketplace ([Postgres on Vercel](https://vercel.com/docs/postgres), [integración de Neon](https://vercel.com/integrations/neon)).

El plan Free anunciado por Neon el 16 de septiembre de 2026 incluye **100 proyectos**, y cada proyecto recibe **100 CU-hours al mes, 0,5 GB de base de datos y 10 branches**. El mismo anuncio incluye **5 GB de Object Storage por proyecto** ([Neon backend GA](https://neon.com/blog/neon-backend-is-ga)).

Neon separa cómputo y almacenamiento: por defecto suspende el cómputo tras cinco minutos sin actividad y lo reactiva con la siguiente conexión; la suspensión no elimina los datos ([administración de computes](https://neon.com/docs/manage/endpoints/)). No se encontró una política oficial vigente que elimine proyectos Free por inactividad.

Es Postgres estándar y ofrece PgBouncer en modo de transacción para aplicaciones serverless. El pooler admite hasta 10.000 conexiones cliente, aunque las funciones que dependen de estado de sesión no funcionan en ese modo ([connection pooling](https://neon.com/docs/connect/connection-pooling)). Postgres permite bloquear filas con `SELECT ... FOR UPDATE` hasta terminar la transacción y ofrece `INSERT ... ON CONFLICT` atómico bajo concurrencia ([bloqueos de PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html), [`INSERT` de PostgreSQL](https://www.postgresql.org/docs/current/sql-insert.html)).

#### Inferencia para este producto

Es la mejor opción para reservar cupos y slots sin carreras, porque una sola transacción puede:

1. bloquear o actualizar condicionalmente los contadores diario global e individual;
2. comprobar que ambos límites admiten otro uso;
3. insertar la Investigación, su reserva y el primer evento;
4. hacer commit de todo o revertir todo.

La portabilidad es alta: tablas, índices, transacciones y dumps siguen siendo Postgres. El serverless driver, branching, integración del Marketplace y Object Storage nuevo sí son específicos de Neon, por lo que el dominio no debería depender de ellos.

**Límite práctico:** 0,5 GB puede alojar miles de informes textuales, pero no una biblioteca ilimitada. A 100 KB por Informe completo —solo una hipótesis de capacidad, no un tamaño medido— el techo bruto sería cercano a 5.000 informes antes de índices y sobrecarga. El MVP debe medir bytes por Informe y avisar mucho antes del límite.

### Supabase Postgres + Storage — alternativa todo en uno

#### Hechos confirmados

Free incluye **dos proyectos activos, 500 MB de base de datos, 1 GB de archivos, 5 GB de egress y 5 GB de egress cacheado** ([precios](https://supabase.com/pricing), [facturación](https://supabase.com/docs/guides/platform/billing-on-supabase)). La base entra en modo de solo lectura si supera 500 MB ([database size](https://supabase.com/docs/guides/platform/database-size)).

Supabase pausa proyectos Free con actividad insuficiente durante siete días. El propietario puede restaurarlos durante un año; los proyectos pagos no se pausan automáticamente ([Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).

La base es Postgres y el pooler compartido en modo de transacción está documentado para funciones serverless ([conexiones a Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)). Storage admite APIs compatibles con S3, pero sus objetos no forman parte de los backups de Postgres y deben respaldarse aparte ([uploads S3](https://supabase.com/docs/guides/storage/uploads/s3-uploads), [base de datos y backups](https://supabase.com/docs/guides/database/overview)).

#### Inferencia para este producto

Tiene capacidad transaccional equivalente a Neon y reduce el número de proveedores si se usa también Storage. Sin embargo, la pausa por baja actividad contradice la expectativa de que cualquier URL permanente siga abriendo sin intervención del operador. Es una buena segunda opción si se acepta Supabase Pro o si “permanente” significa conservar datos aunque el servicio pueda estar pausado.

La portabilidad de la base es alta por Postgres y la de objetos es razonable por S3. RLS, Realtime, Auth y las APIs automáticas sí aumentan el acoplamiento; este MVP sin autenticación no necesita esas capas.

### Cloudflare D1 + R2 — coherente si todo el backend migra a Cloudflare

#### Hechos confirmados

D1 usa semántica SQLite. Free incluye **5 millones de filas leídas por día, 100.000 filas escritas por día y 5 GB totales**. Desde el 1 de septiembre de 2026 las consultas fallan hasta el siguiente reset diario cuando se supera un límite ([precios de D1](https://developers.cloudflare.com/d1/platform/pricing/), [enforcement del free tier](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)).

El plan Free permite **10 bases, 500 MB por base, 5 GB por cuenta y siete días de Time Travel**. Cada base es single-threaded y procesa consultas una por una, aunque encola solicitudes concurrentes hasta su límite ([límites de D1](https://developers.cloudflare.com/d1/platform/limits/), [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)).

`D1Database.batch()` ejecuta sentencias secuencialmente como una transacción y revierte la secuencia completa si una falla ([API de D1](https://developers.cloudflare.com/d1/worker-api/d1-database/)). D1 tiene binding nativo dentro de Workers y API HTTP para clientes externos ([D1](https://developers.cloudflare.com/d1/)).

#### Inferencia para este producto

D1 puede reservar cupos atómicamente y su cuota total de 5 GB es generosa, pero desde Vercel cada operación cruzaría proveedores mediante HTTP y credenciales de Cloudflare. También obliga a diseñar para SQLite y para los límites diarios por filas. Tiene mejor encaje si Next.js y los workers se despliegan en Cloudflare; en la arquitectura Vercel ya aprobada añade latencia, operación y lock-in sin una ventaja decisiva.

## Almacenamiento de objetos

### Cloudflare R2 — recomendado para capturas temporales

#### Hechos confirmados

R2 Free incluye **10 GB-month, un millón de operaciones Class A y diez millones Class B al mes**, con egress gratuito. El free tier solo cubre la clase Standard ([precios de R2](https://developers.cloudflare.com/r2/pricing/)). Usa una API compatible con S3 ([acceso a R2](https://developers.cloudflare.com/r2/get-started/)), ofrece consistencia fuerte y once nueves de durabilidad anual ([consistencia](https://developers.cloudflare.com/r2/reference/consistency/), [durabilidad](https://developers.cloudflare.com/r2/reference/durability/)). La cuenta debe activar una suscripción de R2 mediante el flujo de checkout, aunque el uso dentro de la cuota sea gratuito.

R2 no aplica una expiración general por inactividad. Los objetos permanecen hasta ser eliminados o hasta que una regla de lifecycle lo ordene; la única regla predeterminada documentada elimina uploads multipart incompletos ([object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)).

#### Inferencia para este producto

Un bucket privado y una URL firmada de carga permiten que el navegador transfiera la captura sin exponer credenciales ni atravesar el límite de una Vercel Function. R2 documenta URLs `PUT` firmadas para cargas directas desde navegadores ([Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)). El servidor crea la Investigación solo después de validar que el objeto existe. El workflow lee la imagen, hace OCR y la elimina; una lifecycle rule de seguridad debería borrar cualquier captura abandonada después de un periodo corto.

Esto no viola el límite de confianza propuesto: el cliente solo entrega el archivo; OCR, búsquedas, modelos y evaluación siguen ocurriendo en servidor.

### Vercel Blob — opción de menor fricción

#### Hechos confirmados

Hobby incluye **1 GB-month, 10.000 operaciones simples, 2.000 avanzadas y 10 GB de transferencia**. Al exceder la cuota, Blob deja de estar accesible en Hobby y no factura excedentes; hay que esperar al siguiente periodo indicado por Vercel ([uso y precios](https://vercel.com/docs/vercel-blob/usage-and-pricing)).

Admite stores privados y públicos y blobs de hasta 5 TB. Los stores privados requieren token para leer y escribir ([Vercel Blob](https://vercel.com/docs/vercel-blob), [Private Storage](https://vercel.com/docs/vercel-blob/private-storage)). Una carga que pasa por una Vercel Function está limitada por el body de la función —4,5 MB—; para archivos mayores Vercel recomienda carga directa desde cliente ([server uploads](https://vercel.com/docs/vercel-blob/server-upload)).

No ofrece API S3 ni transacciones entre objetos. No se encontró expiración automática por inactividad ni lifecycle configurable documentado.

#### Inferencia para este producto

Es la integración más sencilla con Next.js/Vercel, pero su free tier tiene una cuarta parte o menos de la holgura de R2 para este caso y el bloqueo completo por exceso puede impedir procesar todas las imágenes. Es suficiente si se fija un archivo pequeño, se elimina inmediatamente tras OCR y se monitoriza la cuota. R2 ofrece mejor margen y una salida S3 estándar.

### Neon Object Storage — opción emergente

Neon anunció el 16 de septiembre de 2026 Object Storage S3-compatible, con 5 GB por proyecto Free, integrado con su backend ([anuncio GA](https://neon.com/blog/neon-backend-is-ga)). Es atractivo para reducir proveedores, pero es demasiado reciente para preferirlo sobre R2 en el primer MVP sin un spike de carga firmada, borrado, permisos y recuperación.

## Cola y ejecución durable

### Vercel Workflow — recomendado, con límites explícitos

#### Hechos confirmados

Workflow SDK ejecuta lógica multietapa con pasos durables, reintentos, pausas y reanudación. Vercel administra persistencia y usa Vercel Queues debajo; cada input, output, paso y error queda registrado ([Vercel Workflows](https://vercel.com/docs/workflows)). El SDK es open source y sus `Worlds` permiten sustituir el backend administrado. Existe una implementación oficial sobre Postgres y Graphile Worker, pero requiere un proceso de worker persistente y **no funciona en entornos serverless de Vercel** ([Postgres World](https://workflow-sdk.dev/worlds/postgres)).

Hobby incluye **50.000 eventos de Workflow al mes y 1 GB escrito**, pero la retención de la persistencia administrada es de **un día después de terminar el run**; Pro retiene siete días. Un paso normal produce tres eventos. Los runs no tienen límite total de duración, pero cada paso hereda los límites de Vercel Functions ([precios y límites de Workflow](https://vercel.com/docs/workflows/pricing)). Workflow también consume operaciones de Queues y cómputo de Functions.

Vercel publicó en abril de 2026 que los controles nativos de concurrencia y un lock entre runs seguían entre las mejoras futuras del SDK ([Workflow GA](https://vercel.com/blog/a-new-programming-model-for-durable-execution)).

#### Inferencia para este producto

- El event log de Workflow sirve para depuración temporal, **no** para alimentar permanentemente la página del Informe.
- La cuota de 50.000 eventos sí alcanza para un MVP, pero el fan-out debe mantenerse compacto: agrupar trabajo en pasos por lote y no crear un workflow hijo por cada consulta o evidencia.
- Como la concurrencia nativa por workflow no está disponible, la aplicación debe adquirir un lease atómico en Postgres antes de comenzar la fase de extracción. `max_active_researches` vive en configuración y empieza en `2`.
- Una Investigación que no obtiene lease permanece `queued` y espera con `sleep`; al cumplir 15 minutos termina sin iniciar y libera sus reservas según la política aprobada.
- Dentro de una Investigación, las Afirmaciones se dividen en lotes de máximo tres y cada lote se ejecuta con `Promise.all`; el valor `max_claim_parallelism` también se lee de configuración.

Los sleeps y reintentos deben ser suficientemente espaciados para no consumir innecesariamente eventos. El lease necesita `expires_at` y heartbeat para que otro run pueda recuperar un slot tras un crash.

### Vercel Queues directo — útil, pero redundante para la pipeline

#### Hechos confirmados

Vercel Queues está en beta. Ofrece entrega **al menos una vez**, reintentos, idempotency keys, consumer groups y concurrencia máxima por consumer group. No garantiza FIFO estricto y no trae DLQ; los consumidores deben ser idempotentes ([conceptos de Queues](https://vercel.com/docs/queues/concepts), [Queues](https://vercel.com/docs/queues)).

La retención configurable va de 60 segundos a **siete días**, con 24 horas por defecto. Hobby incluye el primer **millón de operaciones API al mes**. Cada llamada es una operación y los mensajes se miden en bloques de 4 KiB ([precios y límites](https://vercel.com/docs/queues/pricing)). El SDK permite enviar con una clave de idempotencia y autoextiende el visibility timeout mientras el handler está activo ([SDK de Queues](https://vercel.com/docs/queues/sdk)).

#### Inferencia para este producto

No debe usarse como fuente de progreso ni como almacén permanente. Añadir una Queue delante de Workflow solo limitaría cuántos workflows se **inician**, no cuántos permanecen activos después de que el consumer confirme el mensaje. Mantener el consumer abierto hasta que termine el workflow desperdiciaría una Function y volvería a acoplarse al timeout.

Por tanto, el MVP debe usar la cola ya integrada en Workflow y controlar los slots activos con Postgres. Queues directo se justifica más adelante si aparecen consumidores independientes —por ejemplo, moderación, exportación o notificaciones— que necesiten fan-out.

### Trigger.dev Cloud — mejor control nativo de cola, no seleccionado

#### Hechos confirmados

Trigger.dev coloca cada run en una cola y permite definir `concurrencyLimit`, compartir el límite entre tareas, crear claves por tenant y modificar la concurrencia mediante su SDK. Los runs en espera no consumen un slot; los waits checkpointed liberan el slot ([Concurrency & Queues](https://trigger.dev/docs/queue-concurrency)).

Free incluye **USD 5 mensuales, 20 runs concurrentes, tareas ilimitadas y un día de retención de logs y consultas**. Las tareas no tienen timeout; el plan cobra por segundo activo y por invocación. Al consumir el crédito Free hay que esperar o actualizar el plan ([precios de Trigger.dev](https://trigger.dev/pricing)). La oferta es Apache 2.0 y autohospedable, aunque el self-host pierde varias ventajas administradas, incluidos checkpoints y autoscaling ([self-hosting](https://trigger.dev/docs/self-hosting/overview)).

#### Inferencia para este producto

Es la opción más directa si “dos workers configurables” debe ser una propiedad nativa de la cola. A la tarifa publicada de la máquina pequeña, USD 5 cubrirían como techo teórico unas 490 ejecuciones de cinco minutos totalmente activos al mes; subtareas, invocaciones y otras máquinas reducen ese número.

No se recomienda porque la arquitectura ya eligió Vercel Workflow y añadir Trigger.dev duplicaría orquestación, despliegue, observabilidad y retención. Debe reconsiderarse solo si el semáforo Postgres resulta complejo o si la concurrencia dinámica pasa a ser más importante que mantener un único runtime.

## Diseño recomendado

### Fuente de verdad

Guardar en Neon, como mínimo:

- `reports`: URL corta, idioma fijado, estado, timestamps, deadline de cola, resultado y metadatos de truncamiento.
- `report_events`: secuencia monotónica por Informe, etapa, payload público y timestamp.
- `claims`: rango dentro del Extracto analizado, importancia, periodo y ámbito de referencia, veredicto y fuerza.
- `evidence_sources` y `claim_evidence`: URL, emisor, autor, fechas, fragmento, traducción, jerarquía y hash.
- `quota_config`: límite diario global, límite diario individual, `max_active_researches >= 2`, `max_claim_parallelism = 3`, `max_claims = 15` y `max_queue_seconds = 900`.
- `quota_reservations`: una fila única por Informe con estado `reserved`, `consumed` o `refunded`.
- `daily_usage`: contadores globales y por identificador anónimo firmado.
- `research_leases`: slot, Informe, heartbeat y `expires_at`.
- `dispatch_outbox`: intención idempotente de iniciar un workflow.

### Aceptación atómica

En una sola transacción Postgres:

1. Validar la entrada sin consumir cupo.
2. Bloquear o actualizar condicionalmente los contadores diario global e individual.
3. Rechazar si cualquiera alcanzó su límite.
4. Crear Informe, reserva, primer evento y fila de outbox.
5. Confirmar la transacción.

Después del commit, iniciar Workflow con el `report_id` como clave lógica y guardar el `workflow_run_id`. Un reconciliador idempotente debe reenviar las filas de outbox que quedaron sin run por un crash entre el commit y `start()`. El primer paso del workflow hace compare-and-set para impedir dos ejecuciones activas del mismo Informe.

### Cola y leases

1. El workflow intenta adquirir uno de los slots disponibles mediante transacción.
2. Si no hay slot, registra `queued`, duerme y reintenta hasta `queued_at + 15 min`.
3. Al adquirirlo, registra `started_at`; desde ahí comienza el presupuesto de cinco minutos.
4. Renueva el lease mientras trabaja. Un lease vencido puede recuperarse después de comprobar el estado del run.
5. Detiene búsquedas a los 270 segundos y reserva 30 segundos para cierre parcial o completo.
6. Libera el lease en todo estado terminal. Las operaciones son idempotentes porque Workflow y Queues pueden reintentar.

“Dos workers” se materializa como **dos leases simultáneos**, no como dos procesos daemon con identidad estable. Vercel Functions crea las instancias necesarias para atender los pasos. Esta semántica cumple el objetivo de procesar dos Investigaciones a la vez sin depender de servidores permanentes.

### Progreso

Cada transición visible se escribe en `report_events` en la misma transacción que modifica `reports.status`. La UI consulta `GET /reports/:shortId/events?after=<sequence>` mediante polling o stream server-side. Si el stream se corta, puede reanudar desde la última secuencia sin consultar logs internos de Workflow.

### Capturas

1. El servidor emite una URL firmada, corta y de un solo propósito para un key aleatorio en R2.
2. El cliente carga una sola imagen con MIME y tamaño permitidos.
3. El servidor comprueba `HEAD`, crea la Investigación y guarda el key privado.
4. El workflow vuelve a validar tipo, tamaño y firma mágica, ejecuta OCR y elimina el objeto.
5. Una lifecycle rule elimina automáticamente cualquier upload huérfano.

El Informe conserva solo el Extracto analizado y la evidencia aprobada, como ya se decidió.

## Comparación resumida

| Componente | Free tier útil | Inactividad/retención | Atomicidad y concurrencia | Portabilidad | Veredicto |
|---|---|---|---|---|---|
| Neon Postgres | 0,5 GB y 100 CU-h por proyecto | Compute duerme; datos persisten | Postgres completo, locks y transacciones | Alta | **Elegir** |
| Supabase | 500 MB DB + 1 GB archivos | Pausa tras baja actividad; restaurable por 1 año | Postgres completo | Alta en DB; media en plataforma | Alternativa paga |
| Cloudflare D1 | 5 GB totales; límites diarios por filas | Sin costo inactivo; PITR 7 días Free | `batch()` atómico; DB single-threaded | Media, SQLite/API Cloudflare | Solo si backend migra a Cloudflare |
| R2 | 10 GB-month | Objetos hasta borrado/lifecycle | Consistencia fuerte; sin transacción multiobjeto | Alta por S3 | **Elegir para uploads temporales** |
| Vercel Blob | 1 GB-month | Sin lifecycle documentado; bloqueo al exceder Hobby | Escrituras de objetos, no transacciones | Baja-media | Alternativa simple |
| Vercel Workflow | 50.000 eventos/mes | Estado retenido 1 día en Hobby | Durable; concurrencia propia aún requiere DB | Media-alta por Worlds | **Elegir con semáforo DB** |
| Vercel Queues | 1 M operaciones/mes | Mensajes hasta 7 días | At-least-once; max concurrency; sin FIFO/DLQ | Media | No añadir aún |
| Trigger.dev | USD 5/mes, 20 concurrentes | Logs/query 1 día en Free | Cola y concurrencia nativas, modificables | Media; OSS/self-host posible | Plan B |

## Free tier: qué sí y qué no promete

### Sirve para

- desarrollar y validar la pipeline;
- publicar un MVP público con cupo global conservador;
- mantener miles de informes pequeños si se controla su tamaño real;
- procesar imágenes temporales y borrarlas después de OCR;
- ejecutar dos Investigaciones simultáneas y tres ramas por Investigación.

### No sirve para prometer

- 30 Investigaciones diarias para un número ilimitado de navegadores;
- almacenamiento literalmente infinito;
- disponibilidad contractual o recuperación permanente sin backups;
- continuidad cuando se agota una cuota gratuita;
- operación comercial indefinida en Vercel Hobby.

## Condiciones antes de implementar

1. Medir en un spike el tamaño medio y p95 de Informe, eventos y Evidencias; fijar alertas al 50 %, 70 % y 85 % de Neon Free.
2. Probar la reserva de cupos con solicitudes concurrentes y demostrar que nunca supera los límites configurados.
3. Probar redelivery y replay: el mismo `report_id` no puede cobrar dos cupos, duplicar eventos ni crear dos Informes.
4. Simular muerte del worker para comprobar recuperación del lease.
5. Forzar 15 minutos en cola y verificar estado terminal más devolución correcta del cupo.
6. Forzar cierre a 270 segundos y persistencia antes de 300 segundos.
7. Exportar periódicamente Informes y relaciones de Evidencia a un formato abierto en R2; ensayar restauración, no solo creación del backup.
8. Confirmar antes de lanzamiento que el uso sigue siendo compatible con Vercel Hobby y que las cuotas de todos los proveedores no cambiaron.

## Decisión propuesta

> Decisión posterior de producto: Neon Postgres fue aprobado, pero se descartó almacenar temporalmente las capturas en R2 o Blob. El backend recibirá el blob, ejecutará OCR dentro de la solicitud y descartará los bytes antes de iniciar el workflow con el texto extraído. La recomendación de R2 que sigue se conserva como análisis histórico de la alternativa considerada.

Adoptar **Neon Postgres + Vercel Workflow + R2 temporal**, con un repositorio de persistencia y un adaptador de objetos que eviten APIs de proveedor dentro del dominio.

No adoptar Supabase Free por la pausa de baja actividad, D1 mientras el backend siga en Vercel, Vercel Queues directo mientras Workflow ya cubra entrega durable, ni Trigger.dev mientras el semáforo Postgres satisfaga la concurrencia requerida.

Revisar la decisión cuando ocurra cualquiera de estas condiciones:

- Neon alcance 70 % de almacenamiento o compute Free;
- R2 deje de ser solo temporal;
- se necesite modificar concurrencia instantáneamente sin polling/leases;
- Vercel Workflow publique locks y control nativo de concurrencia;
- el producto deje de ser personal/no comercial;
- la disponibilidad de URLs permanentes necesite un SLA.
