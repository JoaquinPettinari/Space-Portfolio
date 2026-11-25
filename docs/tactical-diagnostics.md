# Misión de diagnóstico de la mesa

La guía contiene cinco objetivos. Después de verificar la identidad, dirige al
visitante a la mesa central mediante el resaltado existente y el mapa de la tablet.

Al entrar a la vista de la mesa con E se muestra directamente el diagnóstico y
se completa el objetivo tactical. El audio tacticalDiagnostics se reproduce una
vez por sesión. No hay botón adicional de diagnóstico ni controles de giro,
pausa o zoom; el holograma conserva su giro automático con movimiento reducido.

Son paneles flotantes sin marco exterior. El panel izquierdo reproduce las tres
filas de la referencia: Hull stress, Comms offline y Sensor relay. Estos rótulos
son información narrativa, no una simulación de daños o reparación.
El panel derecho omite crew y enumera las otras cuatro misiones, manteniendo
intactos los cinco objetivos del HUD y la tablet. E/Escape permite salir.

La lectura de Recovery Procedures y la reparación del relé siguen pendientes.
Consultar este informe no repara el relé ni habilita los diálogos de reparación
o finalización narrativa.

Las pruebas de protocolo, orientación, panel y diálogo cubren la nueva actividad.
Los E2E `bridge-transition` y `journey` comprueban el disparador en la mesa y el
recorrido de los cinco objetivos usando las interacciones reales.

## Validación del 25 de noviembre de 2026

Pulido posterior: holograma ampliado (escala fija 0,65), cian ajustado, esquinas
iluminadas, alertas y línea de progreso más legibles. Sin nuevas luces 3D ni
controles. Pasaron typecheck, lint, build, formato focal y las dos pruebas de
panel/encuadre. El E2E del puente pasó en 1,4 minutos y se revisó su captura:
tres alertas, cuatro pasos, sin sombra/marco del contenedor exterior, diagnóstico
automático y regreso a Pointer Lock con Escape, sin errores de consola.
La espera inicial del E2E se ajustó de 60 a 120 segundos para cubrir la carga
observada en las auditorías; el límite total pasó a 210 segundos. Esto permite
verificar la mesa, pero no corrige ni demuestra una mejora de la carga inicial.

Corrección de paneles flotantes: typecheck, lint, build, formato acotado y pruebas
de panel/encuadre correctos. El E2E actualizado se intentó dos veces, pero ambas
agotaron los 60 segundos de carga en INITIALIZING SYSTEMS, antes de entrar al
interior. Esa comprobación pendiente se completó en el pulido descrito arriba.
Los resultados siguientes corresponden a la
integración previa de la misión, no a esta corrección visual.

- `npm run typecheck`, `npm run lint` y `npm run build`: correctos. El build
  conserva la advertencia de tamaño del chunk del juego.
- Suite unitaria: 340 de 342 pruebas pasaron inicialmente. Se actualizaron las
  dos expectativas antiguas de cantidad y orientación; las 12 pruebas de esos
  archivos pasaron al repetirlas. Una ejecución posterior de esos archivos y
  `TacticalPanel` pasó las 13 pruebas.
- `bridge-transition` pasó y se revisó la captura del informe. `journey` pasó
  tras esperar tanto Pointer Lock como el fin del retorno de cámara antes de
  levantar la tablet. Ambos verifican ausencia de errores de consola y excepciones.
- Prettier de los archivos modificados y `git diff --check`: correctos.
  `npm run format:check` global señala 25 JSON de assets/auditorías anteriores,
  ajenos a esta misión; no se reformatearon.
- No se ejecutó toda la suite E2E ni se realizó una revisión auditiva humana.
