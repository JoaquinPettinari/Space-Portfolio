# Miniatura de nave, vista planetaria y capturas

La mesa muestra la silueta real del GLB unificado que utiliza el exterior del
juego. La descarga se reutiliza; la miniatura no duplica la escena, física,
interior ni luces. Conserva inspección, zoom y giro automático/manual. El giro
automático respeta pausa y movimiento reducido.

Saturno pasa a `[38, 8, -58]`, radio 8, y Júpiter a `[64, 18, -60]`, radio 4.
La Tierra conserva su posición, tamaño y material. Es una composición
cinematográfica con Tierra a un lado y anillos visibles al otro. Los límites de
la escena y la separación de cuerpos se comprueban sin ampliar el far plane.

## Medición reproducible

Comando: `npm run test:audit -- tactical-vista-review.spec.ts` con Chromium
nativo. `TACTICAL_REVIEW_STAGE=before` selecciona únicamente el destino de
artefactos; la base se capturó antes de modificar la escena. Vista 1280 × 720,
DPR de navegador y render 1, 60 cuadros de calentamiento y 180 muestras,
misma posición/objetivo, movimiento reducido activo.

| Medida                        |    Antes |  Después |
| ----------------------------- | -------: | -------: |
| Mediana del cuadro            | 14,30 ms | 15,60 ms |
| Media del cuadro              | 14,61 ms | 16,08 ms |
| p95 del cuadro                | 16,80 ms | 18,10 ms |
| Llamadas de dibujo de muestra |      147 |      146 |
| Triángulos de muestra         |  358.653 |  473.112 |

Los JSON conservan las muestras y las carpetas contienen vistas de la mesa,
Tierra y Saturno. Una primera ejecución con lint/tests en paralelo registró
25 ms de mediana y encontró un fallo real de pausa; se corrigió la secuencia
de unlock y se repitió la captura sin esas tareas. No se utiliza esa ejecución
como comparación de rendimiento.

Esta vista combina miniatura y cambio de planetas: no aísla costes de cada
cambio ni mide todo el recorrido, giro activo o hardware del visitante. El p95
supera los 16,67 ms de 60 FPS. No se garantiza estabilidad a 60 FPS.

La superficie conserva 114.135 triángulos y las aristas se filtran a 8.944
segmentos; son dos pases con materiales básicos sin iluminación ni sombras.
El proxy de picking tiene doce triángulos. Los arrays propios ocupan
5.238.864 bytes; esto no mide memoria GPU. La descarga del GLB existente no
aumenta y no se añaden texturas. El aumento de geometría frente al placeholder
es deliberado para mostrar la nave real.

## Comprobaciones ejecutadas

- Auditoría nativa: miniatura presente, giro detenido con movimiento reducido,
  giro al activarlo, cambio real de pestaña, pausa oculta en DEV_MODE, personaje
  detenido, reentrada con clic y pausa explícita con Escape; sin errores de
  consola ni excepciones.
- Regresión táctica: secciones, botón de rotación, zoom y salida con Pointer Lock.
- Interior unificado: puerta bloqueada, apertura, colisión del módulo inclinado
  y recorrido de regreso a través del pasillo.
- Smoke de producción con `.env` local activo: build y navegación reales;
  configuración compilada de captura desactivada y diagnósticos ausentes.
- 231 pruebas unitarias, typecheck y lint pasaron. El formato global conserva
  dos advertencias anteriores en informes JSON de refinamientos Blender.

Las unidades cubren el GLB y Raycaster reales, recursos compartidos sin mutar,
limpieza de geometría propia, órdenes blur/unlock y configuración de desarrollo.
Las pruebas de navegador no dependen del servidor MCP. No se hizo una prueba
manual de Alt+Tab a otra aplicación de Windows; la integración utiliza cambio
real de pestaña del navegador y no eventos de foco simulados.
