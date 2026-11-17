# Pared técnica de llegada

La referencia del usuario organiza el lado opuesto al salón en una banda continua:
almacenamiento bajo con estantes personales, mantenimiento, instalaciones a la
vista, soporte vital y un nicho médico. La implementación conserva el espacio
del banco técnico en `arrivalCabinLayout.json`, los accesos y las interacciones.

El arte se compone en Blender mediante `detail-service-wall.py`, invocado por el
exportador de llegada de referencia. Se reutilizan los acabados y las geometrías
agrupadas por material del decorado existente. Las pantallas son señalética
estática del entorno, no nuevas estaciones interactivas.

Una luz puntual ámbar ilumina esta pared. Se conservan las luces del salón y la
cafetera; los difusores del mobiliario son superficies emisivas sin luces extra.

## Comprobación

La auditoría `service-wall-review.spec.ts` recorre la escena con entrada nativa,
registra consola y excepciones, captura la pared y observa 180 cuadros después de
60 cuadros de calentamiento. No depende del servidor MCP.

La exportación conserva los límites de recursos existentes: llegada de 7.001.812
bytes, 122.819 triángulos y 28 lotes; detalles de 690.096 bytes, 12.912 triángulos y
27 lotes. Se simplificaron los biseles pequeños y la resolución del texto, y se
reutilizaron materiales existentes. Las 212 piezas nuevas quedan dentro del
volumen de colisión; los límites se comprueban antes de agrupar las mallas.

Validación: `npm run typecheck`, `npm run lint`, `npm run test` (258 pruebas en
78 archivos) y `npm run build` aprobados. Las tres pruebas nativas de
`cabin-revision.spec.ts` e `identity.spec.ts` verificaron circulación, saltos y
acreditación con Pointer Lock real, sin errores de consola ni excepciones.
El build conserva el aviso de tamaño del chunk del juego.

Las capturas frontales `before.png` y `after.png` comparan la misma pared. Los
acercamientos finales son `after-storage.png` (estantes) y
`after-life-support.png` (instrumentación); los nombres de los acercamientos
`before` estaban invertidos y se conservan como registro original.

Medición nativa en Chromium, Intel UHD, 1280×720 y DPR 1:

| Vista | Draw calls | Triángulos visibles | Mediana |     P95 |
| ----- | ---------: | ------------------: | ------: | ------: |
| Antes |         63 |             171.064 |   22 ms | 31,8 ms |
| Final |         72 |             211.065 | 11,8 ms | 18,3 ms |

Las posiciones finales de cámara difieren menos de 0,1 mm. Las variaciones de
caché, temperatura y carga del sistema impiden interpretar la reducción del
tiempo de cuadro como una optimización: el nuevo decorado aumenta geometría y
llamadas de dibujo. La auditoría final no registró errores de consola ni
excepciones. Se revisaron el frontal y ambos acercamientos; maceta, aros y letrero
quedaron visibles completos. Las regresiones funcionales se ejecutaron antes del
último ajuste de posición de estos adornos, que conservó el collider.

El formato global tiene dos advertencias anteriores y ajenas a este cambio:
`docs/assets/unified-ship/chairs-plants-refinement/audit.json` y
`docs/assets/unified-ship/consoles-orbit-refinement/audit.json`.

## Reproducción

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe' --background 'docs/assets/unified-ship/cruz-del-sur-interior-panels.blend' --python scripts/assets/export-arrival-cleanup.py -- --reference-cabin
$env:SERVICE_WALL_PHASE='after'
npm run test:audit -- service-wall-review.spec.ts
npm run test:e2e -- cabin-revision.spec.ts identity.spec.ts
```

La fuente original no se guarda. La copia editable queda en
`docs/assets/cabin-reference/cabin-reference-dressing.blend`.
