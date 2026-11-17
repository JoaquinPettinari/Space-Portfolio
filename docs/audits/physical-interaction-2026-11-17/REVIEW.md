# Interacción física — 2026-11-17

Radio con teclas 3D independientes: la mirada selecciona la tecla, E ejecuta
la acción y anima el índice y el recorrido del botón. No cambia posición ni
rotación de cámara y conserva Pointer Lock. Las cinco grabaciones reales,
volumen, cambio de pista y pausa se probaron con controles nativos.

Tablet elevada, marco con protectores en L y guantes compartidos con el lector
y la radio. T muestra misiones, destinos y mapa; R no libera el cursor ni
abre una interfaz. El portfolio rápido y la alternativa HTML permanecen en pausa.

Acreditación: duración de un segundo, panel y estado permanecen en su sitio
al conceder acceso (diferencia medida <=1 píxel en X/Y/ancho/alto).

Verificación: npm run test -- --maxWorkers=1 pasó 245 pruebas/74 archivos;
las regresiones nativas elegidas (radio, tablet, identidad y dos rutas de
portfolio) pasaron. TypeScript y build pasaron. La suite E2E completa no se
ejecutó; hay 56 casos en 20 specs. Formato global conserva dos advertencias
previas en JSON de auditorías de chairs-plants y consoles-orbit. Sin medición
comparativa de FPS en esta pasada; no se añadieron luces ni sombras.

Capturas: radio-physical-press.png, tablet-held.png y crew-access-granted.png.

Traje final: ambos guantes completos quedan orientados hacia abajo, con las
piezas contiguas de las mangas acompañando la caída. El GLB derivado conserva
cinco primitivas y 41.678 triángulos, pesa 1.120.160 bytes y pasa el test de
collider/escotilla. La fuente original se mantiene. Se comprobó la pose en
Blender y nuevamente en el juego (hanging-suit.png).

Smoke de producción: `npm run test:e2e:production` pasó. Verifica captura y
liberación reales del cursor, ambos accesos al portfolio desde pausa, CSP y
ausencia de `window.__GAME_DEBUG__` en el build.
