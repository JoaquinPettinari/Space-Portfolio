# Iluminación y coste observado

Se conservan dos luces puntuales sin sombras. La luz de salón baja para iluminar
los muebles sin quemar las placas del techo; la segunda conserva el relleno de la
sala técnica. No se cambia la exposición, la iluminación global ni el puente.

`arrivalReflections.ts` genera una única imagen de reflejos filtrada por rugosidad
(PMREM, 128 píxeles por cara) al montar la sala. Solo la reciben suelo, metales,
armarios y molduras apropiadas; no se añade ese muestreo a tela, plantas o techo.
No captura la escena real continuamente. Los materiales se clonan, conservando
geometría y texturas del caché. La energía de emergencia también atenúa el reflejo.

Dos mapas procedurales deterministas de 256 × 256 aportan variación suave de color
y rugosidad al piso. Se conserva el mapa de normales y las UV existentes. Estos
mapas, el render target y los materiales locales se liberan al desmontar. La prueba
`arrivalReflections.test.ts` comprueba propiedad, restauración y selección de
materiales; no simula una prueba GPU.

El canal rojo del mismo mapa lineal almacena una aproximación artística de
oclusión ambiental estática. Se deriva de `ARRIVAL_FURNITURE`, con transición
suave de 24 cm alrededor de sus huellas y una intensidad moderada de 0,55. No son
sombras dinámicas. El canal verde conserva la rugosidad; no se añade una textura
GPU ni un pase. Solo los lotes de piso reciben geometrías propias con UV1 plana
en coordenadas de sala; color, rugosidad y AO usan ese atlas (`flipY=false`). UV0
y normal map originales permanecen intactos. Las geometrías nuevas se liberan al
desmontar. Cinco pruebas verifican contacto, canales y propiedad/restauración.

## Medición

Comando reproducible (PowerShell):

```powershell
$env:CABIN_REVIEW_PHASE='grounded'
npm run test:audit -- cabin-lighting-review.spec.ts
```

Chromium 156.0.8078.4, Windows, ANGLE D3D11 sobre Intel UHD Graphics; viewport y
canvas 1280 × 720, DPR 1. Recorrido con entrada real hasta el banco, calentamiento
de 60 cuadros y 180 muestras observacionales de `__GAME_DEBUG__.performance()`.
No se modifican posiciones mediante el observador. El asentamiento del recorrido
nativo tiene pequeñas diferencias de posición entre pasadas (hasta unos 15 cm).

| Pasada                          | Dibujos | Triángulos | Mediana, ms | P95, ms | Entrada lista, s |
| ------------------------------- | ------: | ---------: | ----------: | ------: | ---------------: |
| Antes                           |      65 |    226.928 |        15,1 |    17,7 |             19,7 |
| Primera integración, tres luces |      70 |    288.352 |        20,2 |    29,7 |             24,3 |
| Luz equilibrada, dos luces      |      70 |    288.352 |        19,3 |    25,3 |             22,2 |
| Final, arte corregido y piso    |      71 |    296.740 |        22,7 |    34,1 |             26,1 |
| Con contacto estático           |      71 |    296.740 |        25,2 |    34,9 |             27,5 |

La primera y última fila comparan el conjunto de arte y materiales, no aíslan el
coste de una textura o de la iluminación. La comparación intermedia motivó retirar
la tercera luz de la cafetera: su aporte visual era pequeño. La mayor riqueza del
resultado final tiene coste medido y no mantiene 60 FPS en este equipo durante la
captura. No se midió memoria GPU ni tiempo GPU aislado. El tiempo de entrada mide
navegación hasta controles utilizables; no es una comparación de red fría calibrada.

Las cinco auditorías pasaron. Sin excepciones ni `console.error`. Permanecen los
avisos existentes de Three.Clock y de inicialización de Rapier. ANGLE también
advierte sobre precisión numérica en shaders de filtrado PMREM durante su
compilación inicial; no hubo fallo de compilación ni artefactos visibles asociados.

Capturas: [antes](before.png), [resultado](grounded.png),
[encuadre amplio](grounded-wide.png). Se inspeccionaron techo, piso, follaje, tela sin
intersecciones, galaxia y contraste. Las capturas no prueban las colisiones; esas
comprobaciones corresponden a las regresiones de recorrido.
