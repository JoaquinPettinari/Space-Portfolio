# Contrato de assets de la intro

`scripts/assets/export-docking-intro.py` se ejecuta en el maestro abierto con
`__file__` definido. No guarda ni reinicia el maestro: exporta mallas evaluadas
en escenas temporales, borra esas copias y restaura escena, frame y selección.
No exporta animaciones, cámaras, luces de estudio ni estrellas.

## Archivos

- `/models/pampa-07-docking.glb`: raíz identidad y cuerpo/hardware hijos con
  la escala de 6 m y orientación del montaje. Aplicar posición/yaw de las muestras
  a toda la escena GLB. No volver a multiplicar por seis.
- `/models/docking-adapter.glb`: adaptador y base estructural en coordenadas
  mundiales, abrazaderas en su pose abierta. Incluye el encastre corregido.
- `/models/docking-motion.json`: copia exacta de las muestras del maestro,
  en metros y ejes Three.js. Conserva tiempos de acople y movimiento de cámara.
- Los dos GLB también tienen `.gz` sin pérdidas, compatibles con el loader
  existente del proyecto. El GLB sin comprimir permanece como alternativa.

El casco CRUZ DEL SUR no se vuelve a exportar: reutilizar
`WALKABLE_ENVELOPE_ASSET`, el derivado del mismo casco con recortes interiores
de los estantes, para compartir geometría/texturas con la escena jugable.
Las luces son una responsabilidad del renderer.
El encuadre del maestro usa lente de 36 mm, sensor horizontal de 36 mm y
aspecto 16:9: FOV vertical aproximado de **31,417°**, near 0,1, far 1500.

## Datos semánticos

Los nombres pueden ser normalizados por GLTFLoader. Usar `object.userData`:

| Campo                       | Uso                                                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceName`                | Nombre exacto en Blender antes de exportar                                                                                              |
| `dockingRole: pampaRoot`    | Raíz identidad de PAMPA                                                                                                                 |
| `dockingRole: clamp`        | Cuatro abrazaderas; `clampOpen` y `clampClosed` son posiciones locales/mundiales Three.js porque sus nodos no tienen padre transformado |
| `dockingRole: guide`        | Seis guías de aproximación                                                                                                              |
| `dockingRole: securedLight` | Dos luces de conexión confirmada                                                                                                        |

Interpolar las posiciones de abrazadera con `clampClosure` de cada muestra.
No animar la rotación: está incorporada al GLB. Las guías comparten material;
clonar los materiales que el runtime modifica para proteger la caché.

El GLB está exportado en frame 1, con la señal verde apagada. Al encenderla,
establecer el color emisivo lineal explícitamente a `(0.04, 0.85, 0.55)` y
su intensidad, porque un material exportado apagado no conserva ese color
emisivo en glTF. Guías ámbar: `(1, 0.28, 0.045)` lineal, intensidad inicial 0,3,
sube a 3 en alineación y baja a 0,5 después de asegurar. Señal verde: 0 a 3
entre contacto y cierre de abrazaderas.

## Validación de exportación

`runtime-export.json` registra bytes, hashes y geometría. PAMPA: 5 mallas,
262.008 triángulos y 3 imágenes; adaptador: 39 mallas, 16.776 triángulos,
4 materiales y ninguna imagen. Los `.gz` recuperan exactamente sus GLB.
La caja de PAMPA en reposo es `[-1.183365, 0.35, -3.675]` a
`[1.183365, 2.545, 3]`. El adaptador ocupa `[-2.495988, -1.415, 18.697865]`
a `[2.495988, 3.165, 27.79]`.

No se generaron capturas ni videos. La prueba de carga y reproducción en el
navegador pertenece a la integración de la app, no a esta exportación.
