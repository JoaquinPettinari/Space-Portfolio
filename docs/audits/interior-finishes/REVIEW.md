# Acabados del interior — 2026-11-14

Referencia: cuero azul grisáceo y herrajes discretos de las sillas, hojas con
nervaduras y variación de verde, señalética técnica con acentos ámbar y uso
moderado de desgaste. Se conserva la iluminación cálida aprobada.

## Cambios

- Sillas: grano fino con rozaduras de bajo contraste, tono azul grisáceo y
  reflejo satinado. Se conservan las costuras y piezas del modelo; no se añaden
  polígonos. El sheen queda más contenido para evitar una apariencia plástica.
- Herrajes, maceteros y ribetes: metales más neutros y menos pulidos, de modo que
  el color cálido venga principalmente de las luces existentes.
- Follaje: textura opaca con nervadura central y venas laterales, gradación de
  borde a centro y dos verdes. Cada componente de hoja recibe UVs en una copia
  de geometría, sin soldar ni mover posiciones o índices. Sus normales se
  suavizan por área para quitar el aspecto de papel facetado, manteniendo el
  contorno y el pliegue originales. Se evita el contraste pálido excesivo.
- Metal del puente: se mantienen mapas PBR y rozaduras originales; se aumenta
  suavemente la rugosidad y la intensidad del normal map existente.
- Placa del acceso: cubierta/proa y `PUENTE DE EXPLORACIÓN`, con chevrones y
  pequeñas marcas de uso. Terminales laterales: identificadores de tripulación,
  descanso y enlace. Las etiquetas funcionales grandes siguen legibles.

Esta es una adaptación de superficies en el juego. No se reexportan ni modifican
los modelos GLB o la fuente Blender en esta pasada; se conserva todo el trabajo
sin confirmar de la pasada de FPS anterior.

## Coste y recursos

Dos `CanvasTexture` opacas de 256 × 256 se generan una sola vez, con aleatoriedad
determinista. Las dos mallas de follaje comparten el mismo mapa. El cuero repite su mapa y
ambos conservan mipmaps para evitar ruido a distancia. Estimación de almacenamiento
RGBA8 con mipmaps: aproximadamente 0.67 MiB para los dos mapas.

No se añaden luces, sombras, materiales transparentes, lotes de dibujo ni triángulos.
La señalética reutiliza las resoluciones de sus texturas anteriores. Se conserva
el DPR. Los costes nuevos son el muestreo de textura y 55296 bytes de UVs para
las 6912 posiciones del follaje, además de las copias locales de sus geometrías.
No se calcula nada de estos acabados en `useFrame`.

`prepareInteriorFinishes` clona solo recursos modificados y expone una limpieza
de los que posee; `BridgeInterior` libera sus dos texturas y materiales/UVs
propios al desmontar. Los mapas originales del GLTF no se destruyen.

## Verificación

Chequeos finales: `npm run check` completo (57 archivos / 201 pruebas),
TypeScript de E2E y `git diff --check` aprobados. Build correcto con el aviso
existente de chunk grande del juego (3.40 MB minificado). Servidor local
verificado con respuesta HTTP 200 en el puerto 4176.

`interiorFinishes.test.ts` carga el GLB real del mobiliario y comprueba que las
dos mallas de follaje reciben UVs finitas en [0,1], sin cambiar bounds, posiciones,
índices, opacidad o lado de renderizado. Comprueba normales suavizadas unitarias.
Verifica también que no se modifiquen materiales, normales o UVs del caché ni se
dispongan texturas ajenas.

La revisión visual usa entrada real con Playwright, incluye capturas cercanas de
cuero y hojas y recoge excepciones/consola. Las muestras son de 90 cuadros tras
calentamiento, a 1280 × 720, DPR 1, Intel UHD/ANGLE; se guardan completas junto
a las capturas. No prueban 60 FPS sostenidos ni igualdad exacta entre ejecuciones.

| Vista              | Antes mediana / p95 (ms) | Final mediana / p95 (ms) |
| ------------------ | ------------------------ | ------------------------ |
| Llegada            | 15.4 / 17.8              | 14.9 / 16.6              |
| Puente hacia proa  | 16.7 / 19.4              | 17.0 / 20.0              |
| Puente hacia atrás | 17.4 / 20.1              | 18.5 / 20.9              |

El puente final ronda 54–59 FPS según estas medianas; el pasillo medido en esta
pasada dio 15.9 / 17.6 ms (unos 63 FPS de mediana). Hay un coste pequeño por las
texturas y variación de sistema/pose: el waypoint de proa se detuvo en Z=0.36
antes y Z=0.71 después. No se atribuye la diferencia completa solo a materiales
ni se afirma coste cero. Las llamadas observadas varían ligeramente con ese
encuadre (152/157 hacia proa y 207/205 hacia atrás). El número de texturas sube
exactamente dos, de 22/24 a 24/26 según vista.

Pasaron el recorrido de puerta cerrada/identidad/apertura/retorno y el pasillo
con colisiones laterales y reentrada de Pointer Lock, además de la revisión
visual ampliada (tres tests en 2.1 min). Archive con lectura y descarga real de CV
pasó por separado en 28.3 s. La revisión visual volvió a pasar tras suavizar las
normales del follaje (55.9 s). No se observaron errores de consola o excepciones.

Las capturas y JSON de `final/` corresponden al acabado final. `first-review/`
conserva la primera prueba, antes de quitar los brillos pálidos de las hojas.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='C:\Users\joaqu\AppData\Local\ms-playwright'
npx playwright test --config playwright.passage-review.config.ts --grep 'records warm interior|unified interior blocks|panoramic passage' --reporter=list
npx playwright test --config playwright.passage-review.config.ts --grep 'approaches the physical Archive' --reporter=list
npx tsc -p tsconfig.e2e.json --noEmit
npm run check
```
