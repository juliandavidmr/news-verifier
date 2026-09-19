# Validación de lanzamiento

**Última ejecución:** 19 de septiembre de 2026  
**Commit revalidado:** `80c4c16`
**Estado:** bloqueado por verificación de cuenta de AI Gateway

## Resultado ejecutivo

La aplicación, la persistencia, la cola durable, la extracción URL, el OCR y la lectura de informes están desplegados y probados. El lanzamiento no puede declararse completo porque Vercel AI Gateway rechaza toda inferencia con HTTP 403 `customer_verification_required`: exige una tarjeta válida en el equipo para desbloquear incluso los créditos gratuitos. Registrar una tarjeta es una acción del propietario de la cuenta y no una corrección de código.

Hasta resolverlo, las entradas llegan a la fase de identificación de afirmaciones y terminan con un fallo de proveedor correctamente visible. El ticket de lanzamiento debe permanecer abierto y no se debe afirmar que URL e Imagen completan un Informe auditable.

## Evidencia completada

- Next.js 16.3.5 compila el proyecto y Workflow; lint, TypeScript y la suite automatizada se ejecutan antes de cada push final.
- Neon tiene 10 migraciones aplicadas. La configuración efectiva es: cupo global 100/día, visitante 30/día, dos investigaciones activas, tres afirmaciones concurrentes, máximo 15 afirmaciones y presupuesto de 300 segundos.
- Las variables de Neon y Exa existen en Development, Preview y Production. `CRON_SECRET` y `VISITOR_SIGNING_SECRET` existen en Production. Los valores no se registraron.
- El corpus OCR de Preview pasó 36/36 entradas válidas y rechazó 4/4 escrituras no soportadas. Véase [ocr-spike-results.md](./research/ocr-spike-results.md).
- Un smoke de Imagen en producción completó OCR, persistió 129 palabras y avanzó hasta identificación de afirmaciones. Un smoke de URL sobre `/privacy` avanzó por extracción y cola hasta la misma fase. Ambos fallaron únicamente al invocar AI Gateway.
- Las páginas de Informe se sirven con `X-Robots-Tag: noindex, nofollow, noarchive` y `Referrer-Policy: no-referrer`; el endpoint administrativo rechaza llamadas sin autorización.
- El catálogo público actual conserva los tres modelos configurados con precio cero, etiqueta `free`, `tools` y `tool_choice`.
- La prueba de contrato se repitió con credenciales OIDC recién obtenidas de Preview sobre `80c4c16`. Falló antes de inferencia con el mismo HTTP 403 `customer_verification_required`; no hubo consumo de tokens ni fallback pago.
- Los logs de producción no muestran un error OCR después de la corrección del empaquetado WASM. El error actual es el circuito de AI Gateway originado por la verificación de cuenta.
- El consumo interno observado el día de validación fue seis reservas globales y tres por visitante. Los intentos de IA no consumieron tokens porque el Gateway rechazó las peticiones antes de inferencia.

## Gates todavía pendientes

1. El propietario registra una tarjeta válida en el equipo de Vercel para desbloquear los créditos gratuitos de AI Gateway. No se habilita recarga automática ni fallback pago.
2. Se repite la prueba `RUN_AI_TESTS=1` y debe pasar con un modelo `-free`.
3. El corpus de verificación se revisa por una persona y se ejecuta contra el pool aprobado; debe medir citas literales, falsos concluyentes, los cuatro idiomas, prompt injection, duplicados y conflictos.
4. Se repiten los smoke tests URL e Imagen y ambos deben terminar como `completed` o `partial` con evidencia auditable, nunca `failed` por capacidad.
5. Se revisan de nuevo logs y consumo, y solo entonces se cierra el ticket de lanzamiento.

## Comandos reproducibles

```bash
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
env RUN_AI_TESTS=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run src/server/claims/gateway-identifier.integration.test.ts
node scripts/run-ocr-acceptance.mjs https://PREVIEW_URL --protected
```

La política aprobada sigue siendo free-only. La documentación oficial de precios de AI Gateway describe el crédito mensual gratuito, mientras que la documentación de presupuestos aclara que el equipo todavía necesita créditos o un método de pago para enviar peticiones. En esta cuenta, el runtime materializa ese requisito como `customer_verification_required` incluso al seleccionar modelos con precio cero:

- <https://vercel.com/docs/ai-gateway/pricing>
- <https://vercel.com/docs/ai-gateway/observability-and-spend/budgets>
