# Ejecutar Tesseract.js localmente para OCR de capturas

El MVP usará Tesseract.js 7 con modelos `tessdata_fast` dentro de una Vercel Function Node y no enviará capturas a un proveedor OCR externo. La ingesta tendrá un máximo de 60 segundos antes de entrar en cola, mantendrá el blob solo en memoria y persistirá únicamente el texto; la elección queda condicionada a un spike desplegado que valide precisión, memoria, bundle y latencia, con `tesseract-wasm` como alternativa si el problema es peso o inicialización.
