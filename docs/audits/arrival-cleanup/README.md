# Llegada ordenada y garganta de acceso

`export-arrival-cleanup.py` abre la fuente guardada de Blender en un proceso
aparte. Evalúa piezas originales con sus nombres y genera tres archivos nuevos;
no guarda el `.blend` ni reemplaza los GLB anteriores.

Se retiran exclusivamente las siete piezas de la caja sobre el banco y el
textil colgado. Los demás asientos, cajas, rejillas y equipamiento se conservan.
Los tres módulos ENV/FILTER de los lotes de pared se sustituyen por dos copias
completas del primero, conservando letras, cierres y rebajes. Sus centros son
Z=13,6 y15,9 m. Los dos armarios existentes se desplazan a14,8 y17,1 m y sus
colliders se actualizan. La separación entre módulos vecinos es al menos38 cm.
Ambos armarios quedan en X=3,78 m, 19 cm por delante de su posición anterior,
para que los montantes de la estructura no crucen sus puertas ni ventilaciones.
Las bisagras, tiradores y rejillas se desplazan junto con el cuerpo completo.

| Copia de runtime                 |      Bytes | Lotes | Triángulos |
| -------------------------------- | ---------: | ----: | ---------: |
| `cruz-del-sur-clean-bridge.glb`  | 20.585.060 |    43 |    232.274 |
| `cruz-del-sur-clean-arrival.glb` |  4.074.144 |    16 |     61.561 |
| `cruz-del-sur-clean-details.glb` |    890.844 |    29 |     15.548 |

`refinedArtAssets.ts` selecciona estas copias; el puente se vuelve a evaluar
desde la fuente guardada que ya retiró la decoración dentro de los nuevos nichos.
La integración de los paneles laterales pendientes se entrega como un asset
separado. `export.json` registra exactamente los objetos retirados.

`BridgeThroatFrame` añade un anillo estático con hombros achaflanados y esquinas
redondeadas en Z=2,19 m. Respeta la abertura de2,68 m por debajo de los hombros;
el borde superior interior se estrecha a1,84 m y alcanza2,50 m de altura. Los
18 mm del bisel quedan fuera del límite lateral del collider existente. No se
añaden luces ni colliders al marco; las dos tiras son materiales emisivos.

Las pruebas usan Raycaster sobre la geometría real para comprobar que el paso
central y la altura de la cabeza están libres, además de presupuestos de los
assets y límites de la llegada. La revisión visual y recorrido nativo quedan
a cargo de la integración principal. Estas cifras no son una promesa de FPS.

Reproducción desde la raíz:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe' --background docs/assets/unified-ship/cruz-del-sur-interior-panels.blend --python scripts/assets/export-arrival-cleanup.py
npx vitest run src/game/world/refinedArtAssets.test.ts src/game/world/arrivalRoomLayout.test.ts src/game/world/BridgeThroatFrame.test.ts
```

La opción final `-- --arrival-only` vuelve a exportar exclusivamente la llegada
y actualiza ese registro del informe sin escribir los GLB de puente o detalles.
