# CRUZ DEL SUR — Etapa 0: auditoría y propuesta de puente de exploración

Fecha: 2026-11-09. Estado: **propuesta para aprobación; no implementada**.

Fuente de dirección: `C:/Users/joaqu/Downloads/CRUZ_DEL_SUR_EXPLORATION_BRIDGE_ARCHITECTURE_v2.md`. Fuente de medidas actuales: repositorio y escena de desarrollo cargada. Esta auditoría no cambia gameplay, assets, UI, misiones ni controles. Los cambios pendientes de la etapa anterior se conservan.

## 1. Conclusión y discrepancias

La escena actual es procedural salvo la palanca y el mamparo GLB. Los tres módulos nuevos son exclusivamente de preview. El puente actual mide 10 × 10.1 m sobre sus líneas estructurales; NO mide los 9.448 × 10.839 m del GLB de preview. Tiene un frente recortado de solo 2.4 m de profundidad y ambos monitores a yaw 0°. Hay alas laterales, pero falta una cubierta de proa visible delante del parabrisas. No cumple todavía la silueta requerida.

Propongo un puente de 9.6 × 13.5 m entre líneas estructurales, con posterior Z=5.1 conservada y frente Z=-8.4. Con paredes de 0.2 m, el ancho exterior del cuerpo será aproximadamente 9.8 m. Las alas y la nueva cubierta exterior no están incluidas en esa cifra. Extensión hacia delante: 3.4 m respecto del gameplay actual; no confundir con la extensión relativa al GLB.

Conflictos explícitos del documento:

- A 3 m/s, 2–3 segundos requieren 6–9 m. Los 2.5–3.5 m provisionales darían 0.83–1.17 s. Recomiendo conservar 6 m nominales de pasaje; no reducir la velocidad del jugador.
- El ejemplo de polígono tiene 8.8 m de estrechamiento, mientras otra tabla propone 4.5–5.5 m. Recomiendo el estrechamiento largo de 8.8 m, dividido en dos facetas por lado para que las consolas puedan orientarse a 45° sin perder espacio útil.
- El mamparo actual ofrece 2.68 m de paso estructural; reducirlo a 1.6–2 m requeriría cambiar un asset funcional. Recomiendo conservarlo.
- El módulo técnico actual tiene 2.8 m de ancho libre y palanca/credencial enfrentadas. Propongo ensanchar este mismo módulo y poner la credencial mirando al visitante junto al mamparo. No agregar otra habitación.

## 2. Inventario real: producción frente a preview

`exploration-v2-current-meshes.json`, en esta carpeta, contiene **344 registros** de Mesh/InstancedMesh/Points del estado inicial cargado: ruta jerárquica, origen, geometría, posición mundial, cuaternión XYZW, escala, bounds mundiales y materiales. Incluye elementos montados aunque ocultos, proxies de raycast y un InstancedMesh con 95 asteroides; no significa 344 objetos visibles ni 344 draw calls. Las manos de identificación y la taza animada no están montadas en ese estado. Sus componentes se conservan.

Inventario por sistema (sin escala global salvo donde se indica):

| Sistema montado                                 | Fuente                                                | Transform / alcance mundial actual                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Piso facetado                                   | BridgeFloor.tsx + bridgeLayout.ts                     | Extrusión 0.2 m; mesh (0,-0.2,0), Rx=-90°; cara superior Y=0; vértices en sección 4                                    |
| Paredes, ventanas, trasera, panel técnico, alas | ShipHull.tsx                                          | Root identidad; facetas según segmentPose; paredes laterales X=±5; trasera Z=5.1                                       |
| Techo, nervios y tiras                          | BridgeRoof.tsx                                        | Root identidad; paneles Y=3.15–3.8; colisiones hasta Y+0.1; vigas 0.12 m                                               |
| Mesa táctica                                    | Greybox.tsx / CentralTable                            | (0,0,0.5), yaw 0; collider 2.1 × 1.04 × 2.7 m                                                                          |
| Holograma opcional                              | TacticalStation.tsx                                   | Anclado a mesa; pantalla (-0.55,1.85,0.5), yaw -90°; cosmético, no casco exterior                                      |
| Módulo técnico, bolsillos de puerta y vestíbulo | EntryAirlock.tsx                                      | Root (0,0,6); coordenadas locales conservadas; suelo técnico Z=11.2–14.3; vestíbulo hasta 16.2                         |
| Pasaje                                          | PanoramicPassage.tsx                                  | Suelo (0,-0.1,8.15), 3.04 × 0.2 × 6.1; límites Z=5.1–11.2                                                              |
| Escotilla inicial                               | DockingHatch.tsx                                      | Bisagras (±1.2,1.25,14.2); dos hojas 1.2 × 2.5 × 0.16; giro ±90° hacia vestíbulo                                       |
| Mamparo GLB                                     | SlidingBulkhead.tsx, bulkheadAsset.ts                 | Root visual (0,-0.18,11.65), yaw 0; marco fijo desplazado -0.48 en Z; hojas X inicial ±0.685, viaje ±1.37              |
| Palanca GLB única                               | AuxiliarySwitch.tsx                                   | Root visual (-1.32,1.65,12.4), yaw +90°; target lógico (-1.4,1.65,12.4); pivote local (0,-0.072,0.091)                 |
| Consola, dos monitores, sillas                  | Workstation.tsx                                       | Root identidad; consola en sección 5; monitores (±2.4,1.65,-3.82), yaw 0; sillas (±2.4,0,-2.85)                        |
| Crew Access                                     | CrewAccess.tsx                                        | (1.4,1.65,12.8), yaw -90°; collider principal 1.3 × 1.1 × 0.24 antes de girar                                          |
| CV mural                                        | CrewDossier.tsx                                       | (-3.25,1.65,4.83), yaw 180°                                                                                            |
| Café                                            | CoffeeMachine.tsx                                     | (-4.25,0,3.65), yaw +90°; collider local 0.8 × 1.5 × 0.72                                                              |
| Foto                                            | ProjectPhoto.tsx                                      | (-4.78,1.75,2.2), yaw +90°                                                                                             |
| Personal Workstation                            | RearWorkstation.tsx / WallTerminal                    | Mesa (4.4,0.45,2.1), collider 0.8 × 0.9 × 1.8; terminal (4.55,1.65,2.1), yaw -90°                                      |
| Baliza y luces                                  | CabinLighting.tsx                                     | Geometría de baliza y luces existentes; transforms exactos de mallas en JSON                                           |
| Exterior espacial                               | SpaceExterior.tsx, AsteroidField.tsx, DistantShip.tsx | Planeta (-25,10,-38), luna (-8,18,-66), otro planeta (44,8,-61); deriva orbital y ruta de nave dinámicas; no son casco |
| Tablet y manos                                  | HandheldTablet.tsx                                    | Objeto ligado a cámara; no arquitectura fija; conservar                                                                |

Las posiciones de grupo se componen con las posiciones locales de cada pieza. El JSON evita perder esa composición y registra también los objetos sin nombre.

### Assets

| Archivo                                               | Uso efectivo                                     | Decisión propuesta                                                        |
| ----------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| public/models/cruz-del-sur-auxiliary-power-switch.glb | Gameplay; 42 mallas del asset + proxy procedural | Reutilizar sin regenerar ni duplicar                                      |
| public/models/cruz-del-sur-sliding-bulkhead.glb       | Gameplay; 50 mallas, hojas separadas             | Reutilizar con bolsillos y cinemática existentes                          |
| src/dev/assets/01-entry-module.glb                    | Solo preview, 23 mallas / 1,338 triángulos       | Referencia de proporción; no instalar entero                              |
| src/dev/assets/02-panoramic-passage.glb               | Solo preview, 23 / 852                           | Marcos individuales candidatos; no escalar el conjunto para conseguir 6 m |
| src/dev/assets/03-faceted-bridge.glb                  | Solo preview, 97 / 5,122                         | No satisface proa/techo; no usar su casco como sustitución final          |
| public/models/sci-fi-hallway.glb                      | No montado por GameWorld/Greybox                 | Retirado del gameplay; no reintroducir                                    |

Los tres módulos suman 7,312 triángulos, un material por archivo, sin texturas ni animaciones. Los bajos polígonos no garantizan bajo coste: 143 meshes separados pueden producir muchos draws. No justificar otra optimización sin medir. Reutilizar marcos de forma selectiva y repetirlos mediante geometrías/materiales compartidos, no montar originales y duplicados juntos.

No encontré ZIP fuente ni licencia/publicación identificable del kit en el repositorio. El generador preservado depende de `/mnt/data/GLB format.zip`; no se ejecutó ni debe incorporarse así a producción. Para atribución verificable falta el enlace/nombre exacto del kit o su licencia. No se inventan créditos. Esta carencia no impide diseñar geometría propia para las etapas 1–2.

## 3. Medidas actuales y objetivo propuesto

Medidas derivadas de colliders/configuración, no de la imagen. Bounds de malla ≠ espacio transitable.

| Elemento                           | Actual verificado                                                                                                         | Propuesta                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Puente, líneas estructurales       | X=±5, Z=-5..5.1: 10 × 10.1                                                                                                | X=±4.8, Z=-8.4..5.1: 9.6 × 13.5                                                        |
| Anchura interior de paredes rectas | 9.8 entre caras X=±4.9; zonas de servicio sobresalen más                                                                  | ~9.4 antes de props, con pared 0.2                                                     |
| Frente plano                       | 6.8, X=±3.4                                                                                                               | 3.8, X=±1.9                                                                            |
| Profundidad de proa facetada       | 2.4 (-2.6..-5)                                                                                                            | 8.8 (+0.4..-8.4), con faceta terminal de 2.4                                           |
| Techo central                      | Y=3.8; vigas principales bajan hasta ~3.67                                                                                | Y=3.3, intradós de nervios ≥3.18                                                       |
| Borde de cubierta delantera        | Y=3.15, vigas hasta ~3.09                                                                                                 | Y=2.75, marco mínimo ~2.69 sobre consola; pasillos ≥2.9                                |
| Pasaje                             | 6.1 de suelo; 6 nominales; 2.8 entre colliders laterales, 2.76 entre marcos visuales                                      | Mantener longitud y ancho; 2.03 s a velocidad estable, sin incluir puerta/acercamiento |
| Altura del pasaje                  | Collider techo inferior 3.0; vigas visuales inferiores 2.94                                                               | Mantener ≥2.94                                                                         |
| Suelo técnico                      | 3.2 × 3.1; paredes dejan 2.8 de ancho en Z=11.9..14.3                                                                     | Mismo módulo, ampliar hacia X; 5.4 libre / ~5.6 exterior, 3.1 de fondo                 |
| Bolsillos del mamparo              | Hasta X=±2.91 (5.82 exterior)                                                                                             | Conservar; excede 5.66 del GLB de referencia, no forzar asset                          |
| Mamparo abierto                    | Collider jambas: 2.68 ancho; altura bajo header 2.525; sellos visuales ~2.675; hojas abiertas dejan ~2.73 entre colliders | Conservar abertura efectiva ~2.68 × 2.52                                               |
| Escotilla inicial                  | 2.4 ancho entre jambas, 2.5 alto                                                                                          | Conservar                                                                              |
| Cápsula                            | radio .3; cilindro medio 2×.65; altura total 1.9; diámetro .6                                                             | Sin cambio                                                                             |
| Ojo                                | .75 sobre centro: ~1.70 apoyado; snapshot inicial pausado Y=1.75 con cuerpo en Y=1                                        | Sin cambio                                                                             |
| Spawn cuerpo                       | (0,1,15.1)                                                                                                                | Conservar                                                                              |
| Velocidad                          | WALK_SPEED=3 m/s, diagonales normalizadas                                                                                 | Conservar                                                                              |
| Alcance E                          | 2.8 m desde cámara                                                                                                        | Conservar; medir rayos desde zonas de aproximación                                     |

La mesa actual ocupa X=-1.05..1.05, Z=-.85..1.85. Su perímetro no bloquea toda la sala, pero interrumpe la línea recta central. Propuesta: conservar mesa y dos rutas de rodeo de ≥1.4 m, no prometer un pasillo central que atraviese la mesa. En el nuevo casco se reservan bandas X=[-2.65,-1.25] y [1.25,2.65] junto a ella; comprobar colliders completos antes de instalar. Trasera de mesa Z=1.85 a entrada Z=5.1: 3.25 m antes de marcos. Mínimo alrededor de zonas accesibles: 0.9 m. Se conserva la vista sobre la mesa, cuya superficie está en Y≈1.07, por debajo del ojo.

Salto ideal: 4²/(2×9.81)=0.815 m; parte superior de cápsula a ~2.715 m. Las zonas bajas del techo estarán sobre muebles no transitables; los pasillos necesitan margen y colliders coherentes para impedir clipping durante salto. No alterar la física para encajar el techo.

## 4. Planta actual y propuesta — vértices numerados

Mismo mundo: +Y arriba, -Z proa. No trasladar origen ni rotar globalmente la nave.

| Vértice              | Actual X,Z                  | Propuesto X,Z                            |
| -------------------- | --------------------------- | ---------------------------------------- |
| 1, trasera izquierda | -5, 5.1                     | -4.8, 5.1                                |
| 2, trasera derecha   | 5, 5.1                      | 4.8, 5.1                                 |
| 3, hombro derecho    | 5, -2.6                     | 4.8, 0.4                                 |
| 4                    | 3.4, -5 (frente derecho)    | 4.3, -6.0 (faceta intermedia derecha)    |
| 5                    | -3.4, -5 (frente izquierdo) | 1.9, -8.4 (frente derecho)               |
| 6                    | -5, -2.6 (hombro izquierdo) | -1.9, -8.4 (frente izquierdo)            |
| 7                    | —                           | -4.3, -6.0 (faceta intermedia izquierda) |
| 8                    | —                           | -4.8, 0.4 (hombro izquierdo)             |

```text
ACTUAL (esquemático)          PROPUESTO (esquemático)
      5----------4                    6------5       Z=-8.4
     /            \                  /        \
    6              3                7          4     Z=-6.0
    |  A        C  |                 \        /
    |    MESA      |                  8      3       Z=+0.4
    | CAFÉ      PC |                  | MESA |
    1----ENTRADA---2                  |CAF PC|
          |                          1--ENT--2       Z=+5.1
       PASAJE                            |
          |                           PASAJE         hasta Z=11.2
       MAMPARO                       MAMPARO + ID     Z≈11.65 / 12.04
      PWR   ID                      PWR   TÉCNICO
       ESCOTILLA                     ESCOTILLA       Z=14.2
        SPAWN                          SPAWN         Z=15.1
```

El dibujo no está a escala; la tabla de vértices manda. Las facetas 7→6 y 5→4 tienen 45° respecto del frente. Las facetas largas exteriores son mucho más longitudinales (~85.5° respecto del frente); no se presentan falsamente como facetas de 45°. Esa división mantiene proa larga y dos puestos realmente diagonales.

## 5. Consola y anclajes exactos propuestos

Actual: path X,Z = (-4.45,-2.5) → (-3.1,-4.25) → (3.1,-4.25) → (4.45,-2.5). Los muebles laterales tienen yaw aproximado ±52.35°, pero los monitores están sobre el tramo frontal y permanecen paralelos (0°). Eso no satisface el diseño.

Propuesta de tres segmentos, profundidad 1.05 m, superficie Y=1.04 y base collider Y=0..1.02:

| Segmento            | Extremos X,Z                | Centro X,Y,Z   | Longitud | Yaw  |
| ------------------- | --------------------------- | -------------- | -------- | ---- |
| Izquierdo / Archive | (-3.3,-5.95) → (-1.6,-7.65) | (-2.45,0,-6.8) | 2.4042   | +45° |
| Central bajo        | (-1.6,-7.65) → (1.6,-7.65)  | (0,0,-7.65)    | 3.2      | 0°   |
| Derecho / Comms     | (1.6,-7.65) → (3.3,-5.95)   | (2.45,0,-6.8)  | 2.4042   | -45° |

Encuentros con inglete y collider convexo simple por segmento, sin huecos ni cajas visibles superpuestas. Separación normal centro de consola diagonal a pared: 1.05/√2=0.742 m; descontando media profundidad .525 y media pared .1 quedan ~.117 m. El tramo frontal está a .75 m de pared; margen nominal .125 m. Son cálculos de diseño, pendientes de validar contra marcos/soportes reales y bordes de las uniones.

Monitor y Html comparten un único grupo/pivote por estación, sin rotaciones independientes. Conservar frame 1.8×1.1, display 1.6×.9, UI 960×540, scale Html=2/3. Referencia pantalla centrada 0.1 m hacia interior respecto del centro de mueble:

| Terminal | Centro de pantalla actual | Yaw actual | Pantalla propuesta         | Yaw propuesto | Cámara foco propuesta a 16:9 / FOV 65°                             |
| -------- | ------------------------- | ---------- | -------------------------- | ------------- | ------------------------------------------------------------------ |
| Archive  | (-2.4,1.65,-3.715)        | 0°         | (-2.379289,1.65,-6.729289) | +45°          | (-1.634821,1.65,-5.984821)                                         |
| Comms    | (2.4,1.65,-3.715)         | 0°         | (2.379289,1.65,-6.729289)  | -45°          | (1.634821,1.65,-5.984821)                                          |
| Personal | (4.405,1.68,2.1)          | -90°       | (4.205,1.68,2.1)           | -90°          | (3.152162,1.68,2.1)                                                |
| Crew     | (1.255,1.68,12.8)         | -90°       | (1.95,1.68,12.185)         | 0°            | (1.95,1.68,13.237838)                                              |
| Tactical | (-.55,1.85,.5)            | -90°       | Sin cambio                 | -90°          | (-2.081401,1.85,.5), verificar redondeo mediante función existente |

Fórmula existente: d=max(h/(2*tan(FOV/2)*.82),w/(2*tan(FOV/2)_aspect_.85)); para monitores principales d=1.052838. Foco=S+(sin(yaw),0,cos(yaw))*d y lookAt=S. Es dinámico por viewport, NO hardcodear la tabla para todas las pantallas. Cámaras actuales principales: (±2.4,1.65,-2.662162). Las cámaras pueden estar dentro de volúmenes de sillas al enfocar porque se mueve la cámara, no el cuerpo; mantener el bezel y el camino de transición libres de geometría.

Sillas propuestas, centros X,Z: Archive (-1.67218,-6.02218), Comms (1.67218,-6.02218), yaw ±45°. Mantener collider actual .84×1.3×.84. Desplazar .2 m hacia el centro el mueble Personal y el panel/foto de pared cuando se reduzca el ancho de casco; café permanece (-4.25,0,3.65). CV mural sin cambio. Mesa y su cámara lateral sin cambio. No mover ninguno de estos anclajes en etapa 1: hacerlo en etapa 3 y verificar todas las pantallas.

## 6. Alzado lateral y casco exterior

Perfil longitudinal de techo propuesto, por encima de consolas y recorrido central:

```text
Y=3.30   trasera sólida (Z=+5.1..+0.4)
         ──────────────────┐
Y=3.05                     └──── caída hasta Z=-6.0
Y=2.75                              ╲ vidrio inclinado hasta Z=-8.4
Y≈1.70   ojo                         | parabrisas; antepecho ~0.8
Y≈0.8                                      cubierta exterior visible
Y=0      suelo ──────────────────────┘      Z=-8.4..-11.2
```

Definir cuatro zonas: techo técnico trasero Y=3.3; facetas largas superiores descendentes hasta Y=3.05; dos paños superiores sobre alas de consola bajando a 2.75; espina y marcos de .12–.16 m. Sin plano opaco antiguo detrás del vidrio. Revisar también la pared trasera actual de 4.5 m: no conservar su coronación sobresaliendo sobre el nuevo techo.

Cubierta/nariz no transitable propuesta: desde Z=-8.4 hasta -11.2, ancho decreciente 4.2→1.6 m, superficie Y=.80→.55, espesor visual ~.25. Antepecho frontal propuesto Y≤.8. Desde foco de consola (Y=1.65, Z≈-5.98), la visual hacia la nariz distal cruza el frente aproximadamente a Y=1.14: pasa por encima del antepecho. Esto es una comprobación geométrica, no una aprobación visual. Cintas laterales exteriores de 0.35–0.6 m siguen las facetas y continúan hasta Z=+6; no competir con la circulación interior. Sustituir/retrabajar las alas actuales que alcanzan X≈±11.3 para que no contradigan la silueta de exploración.

Vidrio básico de opacidad baja, depthWrite=false, sin transmission ni SSR; orientar normales antes de decidir DoubleSide. La profundidad debe venir de marcos, sellos y nariz física. Shell exterior sin colliders de gameplay: las paredes interiores siguen conteniendo al jugador.

## 7. Entrada y responsabilidad de estados

Orden elegido: **spawn → escotilla libre → módulo técnico/palanca → Crew Access pegado al mamparo → apertura automática → pasaje → puente**. Se conserva la puerta antes del pasaje, como permite el documento.

Etapa 4 propuesta:

- Spawn y escotilla: (0,1,15.1), Z=14.2, sin credenciales.
- Ampliar el mismo suelo técnico Z=11.2..14.3 a X=±2.8 exterior; paredes dejan X=±2.7 libre. No añadir otra cámara de puzzle. Bolsillos existentes se conservan hasta ±2.91.
- Palanca lógica (-2.7,1.65,13.4), yaw +90°; root visual (-2.62,1.65,13.4). La misma animación/pivote/feedback.
- Crew Access en panel delantero a la derecha del mamparo: centro físico (1.95,1.65,12.04), yaw 0°, pantalla (1.95,1.68,12.185). Soporte sobre envolvente del bolsillo; cara posterior del soporte queda junto al límite Z≈12.07, revisar espesor final para sellar la unión. Pantalla completa entre X=1.30..2.60; no invade el hueco central.
- Marco fijo del mamparo en Z=11.17; hojas en Z=11.65; unión de suelo con pasaje Z=11.2. No mover hojas respecto de bolsillos ni reducir su recorrido.
- Pasaje hasta acceso al puente Z=5.1; ancho libre existente. Enlace a piso Y=0 sin escalón.

Estados a reutilizar: Game.tsx mantiene bulkheadPhase/identity y el protocolo; AuxiliarySwitch solo anima y llama onLighting al finalizar; CrewAccess anima y llama onIdentityVerified; requestBridgeAccess exige energía e identificación y abre automáticamente. DockingHatch usa estado local independiente, sin nueva misión. Quick Portfolio Access y alternativa HTML permanecen disponibles sin este recorrido. Reinicio al recargar sin persistencia de progreso.

## 8. Etapas, riesgos y aceptación

1. **Silueta y exterior:** bridgeLayout, BridgeFloor, ShipHull; nuevas piezas pequeñas de casco si aportan claridad. Sustituir límites físicos/piso antiguos, no apilar carcasas. Monitores actuales intactos durante esta revisión intermedia. Validar convexidad de piso, encuentros de paredes, vista de nariz desde ojo y no caída al exterior. Parar para revisión.
2. **Techo/vidrio:** BridgeRoof y remates de ShipHull. Eliminar coronaciones viejas, mantener headroom de pasillos y colisiones al saltar. Comprobar contra planeta y espacio oscuro manualmente. Parar.
3. **Consola y anclajes:** Workstation, station.ts y soportes físicos relacionados; Html y cámara consumen el mismo contrato. Mantener contenido, CSS y Pointer Lock. Validar E, lectura, navegación, retorno, Quick Access, CV y contacto sin envío real en tests. Parar.
4. **Entrada:** EntryAirlock, station.ts, anclajes compartidos de pasaje/mamparo si se requiere. No nuevas reglas. Pruebas de escotilla, energía, identificación, puerta cerrada/abierta, ida/vuelta y reset. Parar.
5. **Arte/optimización:** materiales compartidos y detalles modestos. Medir frame times/draw calls/recursos en máquina destino antes de consolidar geometría. Parar.

Pruebas por etapa: unidades de polygon/segmentPose/foco y altura; barrido real de hojas contra marcos; E2E nativos de circulación y monitores, reducido movimiento, acceso directo y reset. Typecheck, lint, formato de archivos cambiados y build después de implementar cada etapa. No snapshots visuales automáticos. Riesgos principales: uniones diagonal/recta, marcos que invadan consolas, interacción a más de 2.8 m, focus que atraviese muebles, piezas antiguas detrás de cristales, paredes movidas dejando props flotantes, cápsula durante salto, sorting de transparencia, aumento de draw calls.

## 9. Evidencia y límites de esta entrega

Auditoría estática y lectura de escena de desarrollo realizadas en este turno. Snapshot: 344 objetos de geometría montados, 349 draw calls reportados en un frame inicial, viewport 1280×720, reduced motion. No se presenta ese frame como benchmark de FPS ni cifra estable de producción. No capturas ni videos. Primer intento de navegador no alcanzó el servidor por contexto de ejecución; se repitió con servidor y navegador juntos. Un primer snapshot prematuro vacío se descartó; el JSON entregado es posterior a la carga efectiva.

No se modificó código del juego ni se implementaron etapas 1–5 en este turno. Las validaciones anteriores (162 unitarios / 9 E2E) corresponden a la versión previa, no a esta propuesta todavía no construida. No hace falta ejecutar build para estos documentos; se valida su formato y estructura de inventario. Revisión manual y autorización del plano pendientes.
