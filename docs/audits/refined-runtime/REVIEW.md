# Integración del interior refinado

Fuente: `docs/assets/unified-ship/cruz-del-sur-interior-panels.blend`.
Exportador: `scripts/assets/export-refined-interior-live.py`, ejecutado en esa
escena de Blender. Trabaja sobre mallas/materiales temporales, sin guardar la
fuente ni reexportar colisiones, ventanas, casco o puertas del juego.

## Arte y comportamiento

- Sillas acolchadas, hojas curvas con nervaduras, macetas, escritorios y teclados.
- Paneles, rejillas, desgaste, carteles, libros, tazas, postales, cajas y textil.
- Cuatro pantallas comparten una textura de 1536 × 1024 y geometrías UV propias.
  Los nombres funcionales siguen visibles; las aplicaciones DOM e interacciones
  no se sustituyen por imágenes. La mesa conserva el proyector interactivo.
- Fondo orbital y cielo profundo derivados de las imágenes aprobadas en Blender,
  codificados en WebP. Cielo y vista orbital no participan en colisiones y no
  necesitan luces. La vista es arte distante, no un planeta físico navegable.
- Se conservan luz cálida, controles, accesibilidad, puerta, pasillo y cierre del
  hombro de llegada. No se importan luces/cámaras ni pantallas/globos de revisión.

Se normalizan los nombres de UV antes de unir piezas: de lo contrario, las
postales de una misma textura podían recibir coordenadas cero. Los mapas
multicanal de desgaste de Blender no se usan como albedo RGB: se exportan
acabados PBR neutros para evitar un piso verde. Los procedimientos Noise/Bump
de Blender no se convierten en shaders costosos; se conservan acabados simples
y mapas de color. Los colores y sombras difieren de la iluminación de estudio.

## Tamaño y coste

| Asset               |    Bytes | Triángulos | Mallas |
| ------------------- | -------: | ---------: | -----: |
| refined-bridge.glb  | 20995700 |     239066 |     48 |
| refined-arrival.glb |  4127064 |      62317 |     16 |
| refined-details.glb |  1791048 |      21725 |     38 |

Los cuatro modelos reemplazados sumaban 31645360 bytes. Los nuevos modelos y
sus cuatro texturas externas suman 27311332 bytes: 4334028 bytes menos en ese
conjunto. El casco, la puerta, el pasillo y otros assets comunes no entran en
esa comparación. WebP reduce descarga, no demuestra por sí solo menores tiempos
de cuadro o menor memoria GPU. La decoración agrega draw calls; la esfera
planetaria y las capas de puntos anteriores se sustituyen por arte más simple.

Las medidas del juego están en `after/measurements.json`: 40 cuadros tras
calentamiento, 1280 × 720, DPR 1, Intel UHD/ANGLE, movimiento reducido.
Las imágenes `after/*.png` son del juego real. Son muestras breves de esta
máquina, no una garantía de 60 FPS. No se obtuvo una comparación previa completa
equivalente: el primer recorrido falló en la convergencia del mouse automatizado.

## Verificación

`refinedArtAssets.test.ts` inspecciona los GLB finales, presupuestos, ausencia de
luces/cámaras, nombres de interacción, despeje de la puerta y líneas de enfoque.
Las pruebas de geometría omiten exclusivamente la decodificación de imágenes en
Node; Playwright carga los materiales WebP originales en el navegador.

`refined-interior.spec.ts` recorre el juego con teclado/mouse reales: identidad,
apertura, puente, consola, regreso por vidrio y salida/reentrada de Pointer Lock.
`unified-interior.spec.ts` comprueba el bloqueo antes de identificarse y empuje
contra el lateral. Los cinco casos de `physical-monitor.spec.ts` cubren archivo,
CV, enfoque, scrolling y alternativas DOM. Estos siete casos pasaron. La primera
ejecución del caso adicional del pasillo agotó 60 s esperando la carga inicial;
la repetición aislada pasó en 32.8 s, sin alterar tolerancias ni reemplazar
entrada real. Incluyó empuje contra ambos vidrios y reentrada de Pointer Lock.
La muestra de 90 cuadros dio 18.1 ms de mediana y 19.8 ms p95 en el pasillo.

La muestra final de 40 cuadros por vista dio 18.5 ms de mediana hacia proa,
19.4 ms hacia popa, 18.1 ms en el pasillo y 19.1 ms en llegada; p95 de
20.6 / 29.3 / 20.5 / 21.3 ms respectivamente. No son 60 FPS sostenidos.
El caso adicional de deriva exterior y movimiento reducido también pasó: nueve
casos E2E distintos verificados en total, incluyendo la repetición del pasillo.

Los primeros intentos con `chromium-headless-shell` tuvieron problemas de entrada
también antes de integrar el arte. Chromium completo instalado resolvió la
ejecución del recorrido. El ejecutable de revisión se elige con
`PLAYWRIGHT_EXECUTABLE_PATH`; sin esa variable se usa la instalación habitual.

Comandos principales:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright test --config playwright.refined-review.config.ts
```

205 pruebas unitarias, TypeScript, lint y build pasaron. El build conserva el
aviso existente de tamaño del chunk principal del juego. Los assets anteriores
se preservan, pero estos componentes ya no los solicitan. No se publicó ni
desplegó el sitio.

`format:check` global señala únicamente dos informes JSON previos de arte:
`chairs-plants-refinement/audit.json` y `consoles-orbit-refinement/audit.json`.
Los archivos de esta integración se formatearon; se mantienen esos informes
anteriores sin modificar su trabajo.
