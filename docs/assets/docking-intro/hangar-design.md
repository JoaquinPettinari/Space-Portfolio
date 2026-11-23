# Llegada al hangar

La variante `cruz-del-sur-hangar-intro.blend` reemplaza el adaptador circular
por un hangar sobre los motores de popa. Su base conecta con el casco mediante
vigas; el volumen queda fuera de la cabina existente. PAMPA conserva su modelo
original, sin el aro de acople añadido, y entra de proa.

La entrada tiene 5,4 m de ancho útil, 4,3 m de altura y 10,4 m de fondo. La nave
chica mide 6 m y queda completamente dentro antes del cierre. Dos hojas se
retraen a los lados; se cierran entre los segundos 6 y 7,5. PAMPA no se oculta
por código ni desaparece: permanece detrás de las puertas opacas. El video
mantiene 8 segundos y 240 cuadros, compatibles con la carga existente.
El MP4 entregado pesa 1.524.897 bytes, usa H.264 a 1280 × 720 y conserva
faststart. `hangar-video-export.json` registra su hash y archivo fuente.

`hangar-validation.json` registra la trayectoria, el encuadre y los márgenes
durante el cierre. La comprobación de la trayectoria usa los volúmenes del
modelo; no sustituye las vistas renderizadas de revisión. El hash del maestro
original se verifica antes y después de generar la variante.

## Regenerar el modelo

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background 'docs/assets/docking-intro/cruz-del-sur-docking-intro.blend' --python scripts/assets/build-hangar-intro.py
```

El argumento opcional `-- --preview` genera tres vistas de revisión. La entrega
del MP4 y el poster usa el exportador compartido descrito en
[video-contract.md](video-contract.md), con `--output-name hangar`.

Este hangar pertenece a la cinemática. No se agrega una habitación explorable
ni se cambian las colisiones de la cabina; el fundido corta del estacionamiento
a la zona de llegada existente. El maestro de acople anterior permanece intacto.

## Verificación de entrega

- `npm run test -- src/game/intro --pool=threads --maxWorkers=2`: 22 pruebas correctas.
- `npx playwright test e2e/docking-intro.spec.ts --output=test-results/hangar-intro`:
  cuatro casos correctos, con Chromium nativo. Video nuevo confirmado en URL,
  duración y resolución; 240 cuadros y cero descartes tanto en carga normal como
  retenida. Apertura, bienvenida, Pointer Lock, recarga y movimiento reducido correctos.
- `npm run typecheck`, `npm run lint`, `npm run build` y `git diff --check`:
  correctos. El build conserva el aviso por tamaño del chunk del juego.

Registro E2E local: `test-results/hangar-intro-output.txt`. Las medidas de video
son observaciones de este equipo; no garantizan el mismo rendimiento en todos
los dispositivos. Se revisaron visualmente los cuadros 1, 120 y 240 en Blender.
