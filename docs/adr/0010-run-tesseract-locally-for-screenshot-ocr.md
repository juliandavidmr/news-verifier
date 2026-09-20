# Ejecutar Tesseract.js localmente para OCR de capturas

El MVP usará Tesseract.js 7 con modelos `tessdata_fast` dentro de una Vercel Function Node y no enviará capturas a un proveedor OCR externo. La ingesta responderá después de validar y admitir el informe; el OCR tendrá un máximo de 60 segundos dentro de una tarea `after()` de la misma Function. El blob permanecerá solo en memoria hasta que termine esa tarea y únicamente el texto se persistirá antes de entrar en la cola de investigación.

El spike local del 19 de septiembre de 2026 validó OCR multilingüe, memoria y ejecución desde un bundle `standalone` de Next.js 16.3.5. También demostró que externalizar Tesseract sin trazar el paquete completo produce un build exitoso que falla en runtime. La implementación debe incluir explícitamente `tesseract.js`, `tesseract.js-core` y los modelos en el output trace y ejecutar una prueba de OCR contra el artefacto de producción.

La elección queda condicionada únicamente al gate de Preview Deployment con el corpus completo para medir los límites propios de Vercel. `tesseract-wasm` permanece como alternativa si esa validación falla por peso o inicialización. Véase `docs/research/ocr-spike-results.md`.
