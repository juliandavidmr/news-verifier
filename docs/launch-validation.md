# Validación de lanzamiento

**Última ejecución:** 19 de septiembre de 2026

**Commit revalidado:** `9e1db6b`

**Estado:** despliegue operativo; gate editorial del corpus de verificación pendiente

## Resultado ejecutivo

La credencial `AI_GATEWAY_API_KEY` quedó disponible en local y Production. La
prueba de contrato de AI Gateway pasa con un modelo gratuito y los recorridos
reales de URL y JPG cruzaron extracción u OCR, identificación, cola durable,
búsqueda y persistencia de evidencia. Production está `READY` en
<https://news-verifier-pi.vercel.app>.

La validación descubrió y corrigió tres defectos de lanzamiento:

1. evidencia meramente temática podía producir un falso concluyente;
2. una captura sin URL original no podía entrar a investigación;
3. un informe parcial ocultaba evidencia ya validada si el modelo no entregaba
   relaciones finales.

Los modelos gratuitos siguen siendo capacidad externa no garantizada. En los
smokes más recientes identificaron afirmaciones y buscaron evidencia, pero los
tres candidatos fallaron al generar el lote final de veredictos. El sistema
terminó como `partial`, sin índice ni conclusión inventada, y conservó las
fuentes auditables. Esa es la degradación aprobada, no un lanzamiento fallido.

El ticket #13 permanece abierto porque el corpus multilingüe de verificación
todavía requiere revisión humana y falta formalizar una matriz de navegador en
los cuatro idiomas y viewports. No se declara completado ese gate por inferencia
del agente.

## Evidencia completada

- `npm test -- --run`: 67 pruebas pasan y nueve integraciones quedan opt-in.
- La integración de lectura de informes pasa contra Neon con evidencia evaluada
  y evidencia sin relación de modelo.
- TypeScript, Biome y `next build --webpack` pasan desde el checkout de master.
- La prueba real `RUN_AI_TESTS=1` pasa con AI Gateway y un modelo `-free`.
- Neon conserva 10 migraciones y una configuración inicial de 100
  investigaciones globales/día, 30 por navegador/día, dos investigaciones
  activas, tres ramas de afirmaciones y un máximo de 15 afirmaciones.
- El corpus OCR de Preview aceptó 36/36 entradas válidas y rechazó 4/4
  escrituras no soportadas. Véase
  [ocr-spike-results.md](./research/ocr-spike-results.md).
- El reporte URL original
  [z5i8ryGsWe78](https://news-verifier-pi.vercel.app/r/z5i8ryGsWe78)
  completó 15 búsquedas y 43 evidencias. Su falso positivo DART produjo el
  corpus exacto de regresión; los tres fragmentos ahora se degradan a
  `context` y `insufficient_evidence`.
- El segundo smoke URL
  [IkFuV5KgNKlo](https://news-verifier-pi.vercel.app/r/IkFuV5KgNKlo)
  terminó `partial` al agotarse el pool gratuito, sin publicar una conclusión.
- El smoke JPG
  [QDVPDSMlLZoY](https://news-verifier-pi.vercel.app/r/QDVPDSMlLZoY)
  obtuvo 94 % de confianza OCR, identificó tres afirmaciones, completó tres
  búsquedas y persistió nueve evidencias. La imagen no se almacenó:
  `source_kind = image` y `source_url = NULL`. El informe público muestra las
  fuentes como `context` aun cuando la evaluación final terminó `partial`.
- Las páginas de informe conservan `noindex`, `nofollow`, `noarchive` y
  `Referrer-Policy: no-referrer`.
- Los logs revisados no expusieron texto de entrada, claves ni blobs. Los fallos
  observados quedaron reducidos a códigos operativos y estados de Workflow.

## Gates pendientes

1. Versionar y someter a revisión humana el corpus de verificación. Debe medir
   citas literales, falsos concluyentes, español, inglés, francés y portugués,
   prompt injection, dependencias duplicadas y evidencia conflictiva.
2. Ejecutar y guardar la matriz de navegador de los cuatro idiomas en viewport
   móvil y escritorio.
3. Repetir el corpus contra cada modelo gratuito candidato. Un modelo que no
   entregue consistentemente la salida estructurada no se promueve al pool,
   aunque figure como gratuito en el catálogo.
4. Revisar una última vez logs y consumo tras esa ejecución y cerrar #13.

## Comandos reproducibles

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
npm test -- --run
npm run build
env RUN_DATABASE_TESTS=1 node --env-file=.env --env-file=.env.local node_modules/vitest/vitest.mjs run
env RUN_AI_TESTS=1 node --env-file=.env --env-file=.env.local node_modules/vitest/vitest.mjs run src/server/claims/gateway-identifier.integration.test.ts
node scripts/run-ocr-acceptance.mjs https://PREVIEW_URL --protected
```

La política se mantiene `free-only`: no hay fallback pago ni recarga
automática. Los límites y la disponibilidad de Vercel AI Gateway prevalecen
sobre los cupos internos. JEV no forma parte del runtime actual; la arquitectura
usa Vercel AI Gateway para inferencia, Exa para descubrimiento con fallback
directo y reglas deterministas para aceptar o degradar conclusiones.
