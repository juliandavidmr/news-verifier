# Corpus de verificación v1

**Estado:** pendiente de revisión humana  
**Fuente versionada:** `src/server/verdicts/verification-corpus.json`

Este primer corpus fija nueve decisiones pequeñas y auditables antes de probar
modelos. Cubre soporte y contradicción literales, los cuatro idiomas de la UI,
evidencia solo temática, conflicto entre fuentes, copias dependientes, prompt
injection y una afirmación subjetiva no verificable. El caso DART procede del
falso concluyente observado en el smoke real de producción.

La prueba determinista no demuestra que un modelo sea apto. Solo garantiza que,
si las relaciones revisadas entran al motor, las reglas del servidor producen
el resultado esperado y no elevan evidencia débil. La promoción de un modelo
requiere después ejecutar el mismo corpus con relaciones propuestas por ese
modelo y revisar desacuerdos.

## Lista para revisión

| Caso | Idioma | Riesgo | Resultado esperado |
|---|---|---|---|
| `en-explicit-support` | inglés | soporte literal | `supported` |
| `es-explicit-contradiction` | español | contradicción numérica | `contradicted` |
| `fr-explicit-support` | francés | soporte literal | `supported` |
| `pt-explicit-support` | portugués | soporte literal | `supported` |
| `en-dart-thematic-context` | inglés | falso concluyente | `insufficient_evidence` |
| `en-conflicting-records` | inglés | fuentes conflictivas | `disputed` |
| `en-syndicated-duplicate` | inglés | dependencia duplicada | `supported`, sin inflar independencia |
| `en-prompt-injection` | inglés | instrucción maliciosa | `insufficient_evidence` |
| `es-subjective` | español | juicio subjetivo | `not_verifiable` |

La persona revisora debe confirmar que cada `statement`, `fragment`, relación y
resultado esperado del JSON son correctos. Cualquier cambio de expectativa se
versiona antes de ejecutar el gate de modelos.
