# Seguimiento de FPS: arquitectura de proa

Chromium nativo, Intel UHD mediante ANGLE/D3D11, 1280 × 720, DPR 1,
antialiasing activado. Tres ensayos por vista, 30 cuadros de calentamiento y
150 muestras. Recorrido con entrada y mouse reales, sin consultas GPU activas
ni builds/pruebas concurrentes durante la medición. Se informa la mediana de
las tres medianas, no el mejor ensayo.

## Cambio conservado

`BridgeInterior` instala la profundidad previa existente en los lotes estáticos
`REFINED_bridge_static_`, antes de instalar los hooks de materiales. Antes se
limitaba a grafito y metal. El instalador conserva sus filtros de seguridad:
no acepta transparencias, recortes alfa, deformaciones ni shaders personalizados.
Comparte geometría, sigue transformaciones, no escribe color ni recibe raycasts
y limpia sus materiales propios al desmontarse.

La proa envía 114 dibujos y unos 529 mil triángulos, frente a 100 y 462 mil en
el primer ensayo base. Ese coste extra permite rechazar fragmentos ocultos antes
de evaluar los materiales PBR. No se cambian texturas, luces, resolución,
geometría visible, fondo, animaciones ni colisiones. No hay dependencias nuevas.

| Vista   | Antes ms | Después ms | FPS antes | FPS después |
| ------- | -------: | ---------: | --------: | ----------: |
| Entrada |     61,4 |       58,3 |      16,3 |        17,2 |
| Proa    |     39,7 |       34,5 |      25,2 |        29,0 |
| Pasillo |     39,6 |       38,4 |      25,3 |        26,0 |

La proa reduce el tiempo de cuadro un 13,1 % (15,1 % más FPS). Los ensayos base
fueron 41,4/39,7/39,5 ms y los finales 33,8/34,5/36,0 ms. Las diferencias de
entrada y pasillo son pequeñas y solapadas: no se atribuyen como una mejora
concluyente. No se alcanzan 60 FPS. Las poses varían ligeramente por navegación
real y el exterior está animado; los valores dependen de la carga del equipo.

Evidencia: `fps-before.json` y `bridge-depth/fps-after.json`, con muestras,
percentiles, cámara, recursos y capturas. Se revisaron las capturas de proa
antes/después; no constituyen una comparación de píxeles idénticos porque la
cámara y el exterior varían.

## Candidato descartado

`fps-after.json` en esta carpeta corresponde a un descarte anticipado por
distancia cuadrada de luces puntuales. Conservó los píxeles de las cinco escenas
de paridad (incluidos alcance infinito, frontera de alcance, sombras y materiales
standard/physical), pero dio 62,5/42,0/40,8 ms para entrada/proa/pasillo.
Se retiraron por completo el helper, el hook y sus cambios de clave de shader.
El resultado conservado no incluye ese experimento.

## Reproducción

```powershell
$env:GPU_COST_DIRECTORY = 'docs/audits/fps-followup/bridge-depth'
$env:GPU_COST_PHASE = 'fps-after'
npm run test:audit -- e2e/gpu-cost-review.spec.ts
```

Las tres rutas de medición pasaron sin errores de consola ni excepciones.
La prueba existente de paridad del pase de profundidad también pasó, con un
máximo permitido de un nivel por canal; el helper no cambió en esta entrega.
Persisten avisos de deprecación de Three y precisión del compilador WebGL.
