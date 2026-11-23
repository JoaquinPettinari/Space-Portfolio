# Gestos de tablet, credencial y radio

`hand-gestures.blend` es un archivo de autoría separado. Conserva el maestro de mallas y alimenta el GLB de interacción de la app; véase [RUNTIME_EXPORT.md](RUNTIME_EXPORT.md). Tiene cuatro escenas, seleccionables en el selector de escenas de Blender:

| Escena                  | Clip principal          | Duración |
| ----------------------- | ----------------------- | -------- |
| `01 Tablet raise`       | `tablet_raise.assembly` | 0,8 s    |
| `01 Tablet lower`       | `tablet_lower.assembly` | 0,6 s    |
| `02 Credential present` | `card_present.rig`      | 1,25 s   |
| `03 Radio press`        | `radio_press.rig`       | 1,0 s    |

Las geometrías y los datos de los esqueletos están enlazados desde `astronaut-hands.blend`; los objetos y sus acciones son locales para poder animarlos. La tablet enlaza sus colecciones visuales desde `../mission-tablet/mission-tablet.blend`. Mantener la estructura de carpetas. No hacer copias locales de las mallas para editar el guante.

## Reproducción y tiempos

La escena inicial es la tablet levantada. Volver al cuadro 1 y pulsar Espacio reproduce el gesto de la escena elegida. Se usa una base de 100 fps para representar exactamente los eventos de centésimas: el cuadro 1 equivale a 0 segundos, el 51 a 0,50 s y el 59 a 0,58 s. Los marcadores `CONTACT`, `SCAN_ACTION`/`PRESS_ACTION`, `RELEASE`/`WITHDRAW` y `DONE` señalan los eventos.

Los tiempos vienen de `src/game/world/gestureTiming.json`, compartido con la app. El generador lee ese archivo; no tiene una copia independiente de las reglas de contacto.

- Tablet: las manos y el dispositivo comparten un padre animado. El agarre no cambia durante la elevación o la bajada y no hay deriva entre manos y carcasa.
- Credencial: empieza ya sujeta entre índice y pulgar; acercamiento, contacto con lector a 0,50 s, escaneo a 0,58 s, sostén hasta 0,90 s y retirada hasta 1,25 s. El escaneo no comienza al iniciar el movimiento.
- Radio: el índice se extiende durante el acercamiento. Toca la cara del botón a 0,50 s; dedo y botón avanzan juntos 18 mm hasta la presión completa a 0,58 s. La acción corresponde a ese instante. Liberan a 0,72 s y la mano se retira hasta 1,0 s.

## Calibración y límites

La tarjeta mide **86 × 54 × 1,5 mm**. La pinza se ajusta solo en el rig del gesto, conservando el maestro y su pose estática. La separación entre las muestras superficiales distales de autoría es aproximadamente 1,494 mm; el contrato registra el valor exacto. La exportación incluye esa credencial y el anclaje de su superficie posterior para sustituir el prop anterior de la app.

El radio de revisión es un soporte sencillo, con botón de 75 × 58 × 45 mm y recorrido de 18 mm como el código existente. Se calibra usando la superficie evaluada de la punta del índice, no solamente el extremo del hueso. Las curvas de mano y botón comparten la misma fase de presión para evitar que se separen durante el recorrido.

Los marcadores son eventos de autoría, no ejecutan sonido, escaneo ni React dentro de Blender. El código de la app sigue siendo responsable de ejecutarlos una vez, de pausar/cancelar y de no ejecutar acciones antes del contacto. La exportación deriva los cuatro clips y hornea los materiales textiles en atlas compatibles; el contrato de montaje y sus verificaciones se documentan en [RUNTIME_EXPORT.md](RUNTIME_EXPORT.md).

## Evidencia y scripts

- `scripts/assets/animate-hand-gestures.py` crea las escenas y acciones a partir de los maestros enlazados y del contrato compartido.
- `validate-hand-gestures.py` evalúa la piel y el movimiento a intervalos de 0,01 s. Comprueba la cara del lector, la punta del índice, la presión del botón y la relación constante entre tablet y manos. No guarda cambios en el `.blend`.
- `gesture-contract.json` registra clips, tiempos, tamaño de los soportes, calibración y hash del maestro.
- `gesture-validation.json` registra las muestras evaluadas. La comparación de hash garantiza que el maestro de manos no se modificó al autorar los gestos.
- `render-hand-gestures.py` genera vistas de contacto con Cycles limitado a dos hilos.
- `preview-hand-gestures.py` genera videos WebM de movimiento con Workbench. Estos videos muestran la trayectoria; no representan los materiales finales de Cycles. Los cuadros JPEG y videos se guardan en `gesture-review/`.

No se validan aquí las colisiones con toda la nave ni las interrupciones de la aplicación; eso corresponde a las pruebas de interacción del runtime.

La evidencia de movimiento está en `gesture-review/tablet-raise.webm`, `tablet-lower.webm`, `card-present.webm` y `radio-press.webm`. Para inspeccionar la pinza, usar `card-contact-visible.png`: la cámara del video de credencial muestra principalmente el lector; las tres vistas `card-*-visible.png` y la cámara guardada del `.blend` muestran la tarjeta por el lado libre. La reproducción del archivo usa `FRAME_DROP` para respetar el tiempo real aunque el equipo no dibuje los 100 cuadros por segundo.
