# Spike de Tesseract.js 7 en Next.js 16

**Estado:** aprobado con una validación de despliegue pendiente  
**Ejecutado:** 19 de septiembre de 2026  
**Alcance:** prueba local aislada; no modifica código de producto ni crea un deployment.

## Decisión

Tesseract.js 7 continúa como motor OCR del MVP. La prueba demostró que:

- reconoce los cuatro idiomas prioritarios con modelos locales, sin depender de un CDN en runtime;
- funciona desde un Route Handler Node de Next.js 16.3.5 empaquetado como `standalone`;
- queda por debajo del umbral propuesto de 200 MB para el artefacto de prueba;
- entra con margen en los objetivos locales de tiempo y memoria;
- exige una configuración explícita de output tracing: un build exitoso no garantiza que el worker vaya a funcionar.

Esto resuelve la incertidumbre de integración local que bloqueaba la spec. No demuestra todavía CPU, cold start ni tamaño exacto de una Vercel Function desplegada. Esa comprobación queda como criterio de aceptación de implementación y no autoriza un push o deployment desde este spike.

## Configuración probada

- Tesseract.js 7.0.0.
- Next.js 16.3.5 con Turbopack y runtime Node.
- Un worker con `eng`, `spa`, `fra` y `por` cargados simultáneamente.
- Modelos rápidos 4.0.0 de `@tesseract.js-data`, empaquetados localmente.
- `cacheMethod: none` para no atribuir a caché una mejora inexistente.
- Ocho fixtures sintéticos en español, inglés, francés y portugués: claro, oscuro y JPEG comprimido/texto pequeño.
- Una captura real de interfaz suministrada durante la definición del producto.

El corpus es deliberadamente pequeño: prueba viabilidad y descubre fallos de empaquetado, pero no sustituye el corpus de aceptación de 40–60 capturas descrito en la investigación de OCR.

## Resultados

### Ejecución directa en Node

| Métrica | Resultado | Umbral propuesto |
|---|---:|---:|
| Inicialización del worker | 464 ms | incluido en p95 ≤ 30 s |
| Reconocimiento p50, fixtures | 182 ms | — |
| Reconocimiento p95/máximo, fixtures | 331 ms | p95 total ≤ 30 s |
| Captura real | 3.325 ms | ≤ 60 s |
| Pico RSS | 445 MiB | ≤ 1,2 GiB |
| Pico heap JS | 8 MiB | informativo |
| WER mediana, fixtures claros | 0 % | ≤ 5 % |
| WER máxima | 20 % | debe rechazarse o degradarse |

La WER máxima apareció en portugués claro por pérdida de diacríticos, aunque la confianza informada fue 91 %. Esto confirma que la confianza nativa no basta para decidir si una transcripción es apta: el producto necesita reglas adicionales de calidad y un corpus real.

La captura real produjo 933 caracteres con 87 % de confianza en 3,325 segundos. No se persistió la imagen ni se copió su texto al reporte del spike.

### Empaquetado Next.js

El Route Handler se compiló como ruta dinámica Node y el artefacto `standalone` corregido midió **132 MB**. Incluyó el worker, el core WASM y los cuatro modelos rápidos, por debajo del objetivo interno de 200 MB.

La primera configuración compiló correctamente pero falló al ejecutar OCR:

```text
Cannot find module '..'
Require stack:
- .../tesseract.js/src/worker-script/node/index.js
```

La causa fue externalizar `tesseract.js` sin incluir el paquete completo en el trace. La configuración válida necesita:

- `runtime = 'nodejs'` en la ruta;
- `serverExternalPackages: ['tesseract.js']`;
- `outputFileTracingIncludes` limitado a la ruta OCR, con `tesseract.js`, `tesseract.js-core` y los cuatro modelos;
- un directorio común de modelos creado en `/tmp` mediante enlaces a los assets empaquetados, porque Tesseract espera un solo `langPath`.

Con esa corrección, el servidor `standalone` cargó los cuatro idiomas y reconoció el fixture español de extremo a extremo. La petición local completó en menos de un segundo.

## Riesgos que permanecen

1. Falta ejecutar el corpus completo en un Preview Deployment de Vercel y registrar p50/p95, RSS, CPU activa y tamaño real de la Function.
2. Los cuatro modelos latinos cubren la primera experiencia, no cualquier escritura. Entradas fuera de ese conjunto son de mejor esfuerzo hasta incorporar detección y modelos adicionales.
3. Un solo worker multilingüe consumió 445 MiB en la máquina local. No se deben ejecutar varios workers dentro de una misma Function.
4. Confianza alta no equivale a transcripción exacta. Hay que rechazar texto vacío, demasiado corto o estructuralmente sospechoso y observar las tasas de fallo.
5. El directorio común bajo `/tmp` es una preparación efímera de assets, no almacenamiento de la captura. Debe ser idempotente y seguro ante concurrencia.

## Consecuencias para la implementación

- Mantener `OcrEngine` como adaptador sustituible.
- Recibir PNG, JPEG o WebP como binario/multipart; nunca base64.
- Hacer OCR durante la ingesta, antes de iniciar el workflow durable.
- Terminar el worker en `finally` y aplicar un deadline de 60 segundos que cancele trabajo real.
- Persistir solo texto y métricas técnicas no sensibles.
- Añadir una prueba de build/runtime que arranque el artefacto de producción y ejecute OCR; `next build` por sí solo no detecta assets faltantes.
- Tratar la validación en Vercel Preview con el corpus completo como gate antes de habilitar imágenes en producción.

## Veredicto

**GO para especificar e implementar Tesseract.js 7**, con un gate previo a producción para la prueba desplegada. No hay evidencia que justifique cambiar ahora a `tesseract-wasm`, Sandbox ni un OCR externo.
