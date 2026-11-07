# CRUZ DEL SUR — Propuesta de puente y distribución

## Aprobación e implementación de fase 4 — 2026-11-07

El usuario aprobó este plano y autorizó implementar la estructura del puente. Las referencias a aprobación pendiente en el cuerpo siguiente conservan el historial del plan y quedan sustituidas por esta decisión. Se aplican proa facetada, consola frontal doble, mesa central, estaciones de popa y techo industrial. La mesa táctica interactiva de fase 5 y los assets finales siguen fuera de esta entrega.

Dos decisiones de continuidad: Crew Access permanece en la esclusa `(-1.4,1.65,7.3)`, como permite la sección 2, y el CV mural conserva su posición existente `(-3.25,1.65,4.83)` en vez de trasladarse a la reserva `-3.45`. No se crea una terminal adicional junto al CV. Los paneles técnicos son una reserva visual sin interacción de gravedad ficticiamente funcional.

La comprobación de fase 4 se registra en `phase-4-bridge.md`; este documento por sí solo no certifica pruebas ni aprobación estética final.

Fecha: 2026-11-07. **Propuesta para revisión; no modifica el casco ni las colisiones actuales.**

Actualización para la siguiente fase: el usuario autorizó completar monitores físicos, tablet en mano y Crew Access incrementalmente. La **fase 4 se detiene en este plan**: café y Personal quedan cerca de popa, compatibles con sus laterales en la referencia. Dirección artística aprobada no equivale a dimensiones/colliders aprobados. Este archivo no aplica ningún cambio de geometría.

La dirección artística y distribución conceptual están aprobadas: puente industrial retrofuturista, proa panorámica facetada, consola frontal continua con Archive a babor y Communications a estribor, mesa táctica central, café a babor y Personal Workstation en el lateral de estribor. Estructura grafito, paneles blanco roto, luces prácticas ámbar y acentos técnicos cian contenidos.

Referencia visual recibida e inspeccionada en el chat: `codex-clipboard-8f1ea07c-5dd8-40d2-bce0-680a4274b4f9.png`. La imagen muestra una ventana frontal ancha con paños laterales inclinados, consola envolvente baja, dos monitores principales separados, mesa central con esquinas recortadas y proyección baja, vigas de techo con luces cálidas, muebles laterales y pequeños objetos personales. Se aspira a acercarse a ese diseño; no es un plano métrico. Las coordenadas de este documento son propuestas calculadas sobre la sala existente, NO medidas extraídas de la imagen.

La referencia tiene textos en español y tecla TAB: se conservan las decisiones funcionales vigentes, interfaz en inglés y tablet con T. El rótulo PAMPA-07 no cambia la identidad de la estación CDS-01: PAMPA-07 sigue siendo el shuttle. No inventar recuerdos personales, fotos ni afiliaciones a partir de los detalles decorativos de la imagen. La zona de popa no se ve en la referencia; Crew Access junto a la esclusa y las paredes de recuerdos/controles siguen la instrucción escrita del usuario.

Esta propuesta reemplaza únicamente la distribución futura sugerida en `spatial-layout-handoff.md`. Ese informe conserva valor como inventario del estado anterior al prototipo. Las decisiones más recientes del usuario sustituyen las referencias del GDD a identificación en la mesa: Crew Access pasa a una terminal dedicada y la mesa se convierte en Tactical Hologram opcional.

## 1. Base existente que se conserva

Inspección de `Greybox.tsx`, `EntryAirlock.tsx`, `Workstation.tsx`, `station.ts` y auditoría espacial:

- Piso principal 10.4×10.4, Y superior=0. Interior entre paredes X=−5…5 y Z=−5…4.95, con chaflanes en las esquinas.
- Esclusa existente: ancho libre 2.8, fondo libre aproximado 3.1 con puerta cerrada, altura libre 3.6. Spawn `(0,1,7)`, ojos asentados aproximadamente Y=1.7.
- Abertura de entrada 2.5×3.3, puerta en Z=4.86. Conservar piso continuo sin escalón y el comportamiento de no cerrar sobre el visitante.
- Techo físico inferior Y=4.5; bóveda visual actual entre Y=3.65 y 5.1. No bajar colisión todavía.
- Ventanal frontal actual: 8×2.1, centro `(0,2.3,−5.08)`; cuatro ventanas laterales de 3.9×2, centros X=±5.08, Y=2.3, Z=±2.35.
- Cápsula del jugador: diámetro 0.6 y alto 1.9. No cambiar altura, velocidad ni física como consecuencia de una decisión artística.
- Acceso al CV, contacto, tablet, café y contenido profesional se conserva durante la migración. No retirar una estación funcional antes de conectar y probar su sustituta.

Coordenadas `(X,Y,Z)` en unidades de escena, tratadas como metros para diseño. Proa=−Z, babor=−X, estribor=+X. Las cajas siguientes son dimensiones completas; en Rapier se pasan sus mitades a `CuboidCollider`.

## 2. Alcance del prototipo actual

Actualización funcional: Communications y Personal ya usan pantallas físicas en sus posiciones antiguas; la tablet sostenida utiliza la planta actual. Crew Access se implementa en la pared izquierda de la esclusa, centro `(-1.4,1.65,7.3)`, giro Y=PI/2, sin ocupar el CV ni el vano. Su ubicación de sala propuesta más abajo sigue siendo un posible traslado futuro: requiere elegir una carcasa más estrecha o mantener la terminal existente en la esclusa. No copiar el collider actual de 1.3 m de ancho a la reserva futura de 0.9 m sin recalcular separaciones.

El prototipo del Archive ya fue validado y el usuario autorizó reutilizarlo para Communications/Personal. **Ninguno debe trasladarse ya a las coordenadas de esta propuesta.** Las fases de interacción trabajan sobre los puestos actuales; este plano describe la reubicación posterior de geometría y cámaras.

Durante gameplay, Quick Portfolio Access debe abrir la misma interfaz del Archive mediante su modo de enfoque. La alternativa HTML directa sigue siendo independiente de WebGL; no confundir la ruta rápida dentro de la escena con la única salida accesible.

Crew Access puede implementarse como terminal funcional al lado de la entrada antes de reconstruir el casco. La mesa táctica es otra feature, posterior al límite de aprobación de geometría; no usar este documento como autorización para ejecutar todo el rediseño.

## 3. Planta propuesta después de aprobación

### Consola frontal continua

Reserva de mueble principal: centro `(0,0.5,−4)`, caja completa `(7.6,1,1.2)`. Ocupa X=−3.8…3.8, Z=−4.6…−3.4. Su altura de 1 m queda por debajo del borde del vidrio actual (1.25), con espacio visual exterior entre monitores.

La continuidad es visual: tres secciones simples compartiendo zócalo y superficie, no un único collider complejo. Dos colliders laterales de 2.8×1×1.2, centrados X=±2.4, y uno central de 2×1×1.2 en X=0, todos Y=0.5, Z=−4. Dan la misma envolvente y permiten sustituir cada módulo sin rehacer el resto.

| Elemento propuesto               | Centro/anclaje XYZ  | Giro Y | Dimensiones / reserva                                                  |
| -------------------------------- | ------------------- | ------ | ---------------------------------------------------------------------- |
| Pantalla Central Archive         | `(−2.4,1.65,−3.82)` | 0      | Reserva carcasa 1.8×1.1×0.18; tamaño final depende del prototipo       |
| Pantalla Earth Communications    | `(2.4,1.65,−3.82)`  | 0      | Misma familia de monitor, interfaz compartida con formulario real      |
| Superficie central de mando      | `(0,1.02,−4)`       | 0      | Panel bajo; evitar un tercer monitor alto sobre el eje de visión       |
| Silla izquierda, si se conserva  | `(−2.4,0.65,−2.85)` | 0      | Collider actual 0.84×1.3×0.84                                          |
| Silla derecha, futura y opcional | `(2.4,0.65,−2.85)`  | 0      | Misma reserva; no añadir interacción de sentarse como paso obligatorio |

Las pantallas miran hacia +Z, al interior. Las poses de cámara de enfoque se recalculan con el tamaño físico aprobado y el aspecto del viewport; no copiar las coordenadas de cámara actuales después de mover el monitor. Reservar como zona de aproximación caminable `(±2.4,0,−1.8)`; la silla puede requerir un pequeño desplazamiento lateral de la mirada, pero no una segunda interacción.

La proa facetada se resolverá posteriormente sobre la envolvente actual. No ampliar ventanas ni mover planos de colisión por interpretar literalmente el concepto. Los extremos de consola X=±3.8, Z≥−4.6 evitan el núcleo de los chaflanes existentes; validar esquinas y assets finales antes de aprobar colisión.

Reserva propuesta para la proa: tramo frontal de `(-4,−5)` a `(4,−5)` en planta y facetas hacia `(-5,−4)` / `(5,−4)`. Cada faceta tiene centro `(±4.5,2.25,−4.5)`, longitud horizontal `sqrt(2)≈1.414`, alto 4.5 y espesor 0.2; collider local con semidimensiones `(0.1,2.25,0.7071)` y giro Y=`side*PI/4`. Esta propuesta adelanta el chaflán respecto del actual `(±4.7,2.25,−4.7)`; sustituir esos dos chaflanes como unidad visual/física, sin conservar sus colliders superpuestos. Mantener los límites externos planos actuales como respaldo y no ampliar el área transitable hacia el espacio. El ventanal central sigue reservado en `(0,2.3,−5.08)`, 8×2.1; los vidrios laterales de proa se ubicarían sobre las facetas con marcos delgados. Los paños exactos y los empalmes quedan sujetos a revisión visual.

### Cámaras propuestas y correspondencia física

Los números siguientes son de la **distribución futura**, no del código actual. Para las dos pantallas frontales se reserva carcasa 1.8×1.1×0.18 y superficie activa 1.6×0.9. Centro de superficie: `(±2.4,1.65,−3.715)`, 0.015 delante de la cara frontal de la carcasa. Para Personal se conserva pantalla activa 1.1×0.8 del monitor actual, centrada 0.03 por encima del anclaje y 0.145 hacia la cara de uso. Ninguna pose es un spawn de cuerpo; el cuerpo queda en el punto donde se presionó E.

Para una carcasa de ancho W y alto H, relación de viewport A y FOV vertical 65°:

```text
d = max(H / (2*tan(65°/2)*0.82), W / (2*tan(65°/2)*A*0.85))
camera = screenCenter + outwardScreenNormal * d
lookAt = screenCenter
```

El 82% vertical / 85% horizontal reserva marco visible. No usar distancia fija que recorte la pantalla en vertical de móvil. El fallback HTML sigue siendo necesario para lectura cómoda en pantallas pequeñas.

| Puesto futuro               | Centro pantalla / lookAt | Normal hacia visitante  | d a 16:9                    | Cámara aproximada a 16:9 |
| --------------------------- | ------------------------ | ----------------------- | --------------------------- | ------------------------ |
| Archive                     | `(−2.4,1.65,−3.715)`     | `(0,0,1)`               | 1.053                       | `(−2.4,1.65,−2.662)`     |
| Communications              | `(2.4,1.65,−3.715)`      | `(0,0,1)`               | 1.053                       | `(2.4,1.65,−2.662)`      |
| Personal                    | `(4.405,1.68,2.1)`       | `(−1,0,0)`              | 1.053                       | `(3.352,1.68,2.1)`       |
| Crew Access, reserva        | `(−1.95,1.6,4.575)`      | `(0,0,−1)`              | 1.053                       | `(−1.95,1.6,3.522)`      |
| Tactical, futura inspección | lookAt `(0,1.6,0.5)`     | aproximación desde popa | no aplica ajuste de monitor | `(0,1.8,3.1)`            |

Crew Access usa en esta reserva carcasa 0.9×1.1×0.22 y superficie propuesta 0.75×0.8, 0.015 delante de su cara frontal. La fase funcional puede fijar otra carcasa antes de este cambio: recalcular la fila con la geometría real, nunca forzar la cámara a un número que no corresponda. La mesa no usa un modal profesional ni completa crew; su enfoque opcional se valida separadamente.

Para el Html transform, escoger canvas CSS con el mismo aspecto que la superficie física y `distanceFactor = widthWorld * 400 / widthCss`. Ejemplo frontal: 960×540 y factor 2/3 producen 1.6×0.9. No deformar el contenido escalando X/Y por separado. Las transiciones existentes deben conservar su duración/movimiento reducido y restaurar posición y orientación originales; comprobar recorrido de cámara cerca de silla, lector y mamparo, no solamente su posición final.

### Centro y entrada

| Estación propuesta     | Anclaje XYZ         | Giro Y | Reserva física                                                    |
| ---------------------- | ------------------- | ------ | ----------------------------------------------------------------- |
| Tactical Hologram      | `(0,0,0.5)`         | 0      | Reusar mesa 2.1×1.04×2.7 de collider; tablero visual actual       |
| Crew Access            | `(−1.95,1.6,4.7)`   | PI     | Terminal 0.9×1.1×0.22, mirando a proa                             |
| Personal Workstation   | `(4.55,1.65,2.1)`   | −PI/2  | Lateral derecho trasero; collider del monitor girado 0.24×1.1×1.3 |
| CV mural independiente | `(−3.45,1.65,4.83)` | PI     | Marco actual 1.8×2.52×0.12 aprox.; conservar descarga E           |
| Crew Memories          | `(−4.78,1.75,2.2)`  | PI/2   | Reserva mural local 1.8×1.4×0.12; mundial 0.12×1.4×1.8            |
| Technical / Gravity    | `(4.78,1.55,3.65)`  | −PI/2  | Reserva mural local 0.9×1.2×0.16; mundial 0.16×1.2×0.9            |
| Coffee corner          | `(−4.25,0,3.65)`    | PI/2   | Babor trasero; reusar cafetera, collider girado 0.72×1.5×0.8      |
| Interruptor de esclusa | `(−1.4,1.65,6.1)`   | PI/2   | Conservar                                                         |
| Interruptor interior   | `(1.65,1.65,4.65)`  | PI     | Conservar y revisar separación de bolsillos de puerta futuros     |

Crew Access se ubica a la izquierda de la puerta visto desde el interior, sin ocupar el vano: el extremo derecho de su carcasa llega a X=−1.5; el vano termina en X=−1.25, separación 0.25. El CV llega hasta X=−2.55, mientras Crew Access empieza X=−2.4: separación 0.15 entre marcos. Ajustar esos márgenes si los assets tienen cables/manijas sobresalientes.

Personal sigue funcionando actualmente en `(3.25,1.65,4.65)`; solo se propone su traslado. Reservar escritorio lateral trasero en `(4.4,0.45,2.1)`, tamaño completo `(0.8,0.9,1.8)`, huella X=4…4.8 y Z=1.2…3.0. Aproximación de pie desde `(3.2,0,2.1)` y enfoque orientado a +X. La silla de la referencia no se añade como obstáculo ni como paso obligatorio en esta fase: primero validar circulación. El escritorio deja 2.95 m geométricos entre su frente X=4 y borde de mesa X=1.05 en el tramo donde comparten Z, y no invade el corredor reservado X=1.2…3.

Memories y Technical ocupan paredes opuestas de los laterales traseros, cerca de la entrada, desplazados longitudinalmente para no chocar con café/escritorio. Memories abarca Z=1.3…3.1; café ocupa Z=3.25…4.05 (separación 0.15). Technical abarca Z=3.2…4.1, detrás del escritorio que termina en Z=3.0 (separación 0.2). La escena actual tiene vidrio ahí: reservar **zonas opacas localizadas de servicio** en el futuro casco aprobado, sin fingir que ya existen. No cubrir toda la ventana. Las ventanas delanteras laterales y frontal permanecen panorámicas; revisar el compromiso con la referencia antes de construirlo.

La foto de proyecto actual puede permanecer hasta que haya fotos personales aprobadas. Cuando se migre, conservar su interacción de inspección y la imagen existente; no inventar recuerdos ni rostros. Parches, notas y referencias argentinas se añaden como objetos pequeños de superficie, no obstáculos de suelo.

## 4. Circulación y cálculos

La mesa pasa a ser un foco visual central y el recorrido se bifurca a sus lados. La dirección central está aprobada; las medidas y recorridos concretos siguientes siguen pendientes de revisión.

- Huella de mesa propuesta: X=−1.05…1.05; Z=−0.85…1.85.
- Desde puerta Z=4.86 hasta extremo trasero de mesa Z=1.85 quedan 3.01 m geométricos. El visitante puede descubrir la sala y elegir ruta antes de encontrar el mueble.
- Reservar dos corredores longitudinales de 1.8 m: babor X=−3…−1.2 y estribor X=1.2…3. Conectar al vestíbulo trasero y a la franja frontal, evitando nuevas cajas/props de suelo.
- Franja entre frente de mesa Z=−0.85 y parte trasera de silla Z=−2.43: `−0.85−(−2.43)=1.58 m`. Para cápsula de 0.6 queda una banda de centros de unos 0.98 m, antes de tolerancias.
- Café ocupa X=−4.61…−3.89 y Z=3.25…4.05, fuera del tramo longitudinal de la mesa; no invade el corredor X=−3…−1.2 ni el acceso central a la esclusa.
- Technical llega a X=4.70; su panel no invade corredor X≤3. Memories llega a X=−4.72; tampoco invade corredor X≥−3.
- Mantener ancho libre 2.5 de puerta y ausencia de escalón. El ancho de trayectoria del centro de cápsula es aproximadamente 1.9, antes de margen adicional.
- No usar los 1.2 m laterales entre extremo de consola y pared como ruta principal: se estrechan por chaflanes y no llevan a contenido necesario. Toda interacción se hace desde el frente del mueble.
- El plano no certifica accesibilidad normativa ni navegación final: requiere recorrer con colisión real, incluidos saltos, giros y regreso de cámara.

### Visión desde entrada

La mesa de aproximadamente 1.07 m de alto queda por debajo de los ojos a 1.7. El holograma de nave debe ocupar una reserva compacta de aproximadamente 1.3×0.65×1.5 centrada sobre la mesa, con baja opacidad y sin gran panel vertical permanente. Así actúa como foco sin tapar ambos puestos ni toda la ventana. El estado ampliado aparece solo al inspeccionar.

La consola queda baja y las dos pantallas separadas dejan libre el centro de proa. Nada suspendido debe ocupar el cono principal de visión desde `(0,1.7,4.3)` hacia `(0,2.3,−5.08)`. Estas son recomendaciones geométricas; revisar a distintas relaciones de aspecto, no solo en planta.

## 5. Techo y materiales, sin reconstrucción todavía

- Sensación de techo más bajo mediante vigas, bandejas e iluminación integrada, no mediante una reducción inmediata del volumen físico.
- Primera reserva futura: partes inferiores de vigas no inferiores a Y=3.3 sobre circulación; paneles entre Y=3.6 y 4.2, dejando registro del collider actual Y=4.5. Evaluar salto y puntos donde el jugador puede subir a muebles antes de fijar límites finales.
- No desplegar una cuadrícula densa de columnas delante de ventanas. Concentrar estructura en marcos, hombros y mamparo trasero.
- Grafito para estructura, blanco roto para paneles de servicio, ámbar en iluminación práctica y cian en estados técnicos. No convertir todo material en emisivo.
- Evitar nuevas shadow maps y postprocesado en el prototipo. Medir draw calls, tiempo de cuadro y carga antes de añadir iluminación compleja.
- Mantener luces de emergencia y movimiento reducido. El nuevo aspecto no debe ocultar el primer interruptor.

## 6. Puerta y colisión

Mantener la abertura y esclusa actuales. Una futura puerta de dos hojas correderas laterales es adecuada porque no invade el recorrido ni requiere espacio de barrido. Estados closed → opening → open, sin cierre automático inicialmente; colisión sincronizada con hojas. Reservar bolsillos en mamparo y comprobar Crew Access/interruptor antes de elegir la mecánica definitiva. No animar hojas atravesando terminales visibles. Si no hay suficiente bolsillo, considerar compuerta vertical dentro de una carcasa superior aprobada en vez de fingir espacio lateral.

No bajar el dintel ni introducir umbral. Si se agrega cierre futuro, sensor de ocupación y reapertura; Escape siempre libera cursor y nunca debe dejar atrapado al jugador.

## 7. Misiones y contenido al migrar

- Reusar evento de identidad y progreso crew en Crew Access; los usuarios con ese paso completado no deben perderlo. Una E inicia tarjeta breve y pantalla única, sin búsqueda de tarjeta ni doble confirmación.
- Separar objetivos de interacción: crew terminal y tactical table no pueden compartir el evento que completa crew. La mesa nunca es requisito para Archive, contacto, CV ni progresión.
- Tactical: modelo simple de CRUZ DEL SUR, giro lento respetando movimiento reducido; status, docking bay, systems y mission logs opcionales. Datos narrativos se marcan como ficción del entorno; no inventar información profesional.
- Reusar PortfolioContent y datos actuales en Archive y fallback. ContactForm y su backend, skip sin envío y confirmación real de aceptación permanecen intactos al cambiar su contenedor.
- Mantener CV en Personal y descarga mural durante transición. Extras disponibles incluso con tutorial omitido.
- Actualizar tablet/mapa, instrucciones, poses de cámara y E2E al mover cada estación; no dejar marcadores en posiciones antiguas.

## 8. Plano de propuesta, no a escala

```text
                         PROA / −Z
                   PANORAMA FACETADO FUTURO
          /--------------------------------------\
         /  ARCHIVE      LOW COMMAND       COMMS  \
        |   (−2.4,−3.82)                (2.4,−3.82)|
        |======= continuous console Z=−4 =========|
        |     chair                        chair  |
        |       frontal circulation 1.58 m       |
        |                                         |
        |             +---------------+           |
        |   route     |   TACTICAL    |   route   |
        |             |    (0,0.5)    |           |
        |             +---------------+           |
        |                                         |
        | MEMORIES                     PERSONAL  |
        | (−4.78,2.2)                 (4.55,2.1)  |
        | COFFEE                        TECH / G  |
        | (−4.25,3.65)                (4.78,3.65) |
        |  CV    CREW                             |
         \------------+  ENTRY  +----------------/
                      | 2.5 m  |
                      |        |
                      | AIRLOCK| 2.8 m clear
                      | SPAWN  |
                      +--------+
                         POPA / +Z
```

## 9. Aprobación y validación pendientes

1. Completar y verificar fases funcionales 1–3 autorizadas (computadoras, tablet, Crew Access), conservando sus ubicaciones existentes salvo la nueva terminal de entrada. No se generan capturas ni videos automáticamente, por instrucción del usuario.
2. La distribución conceptual izquierda/derecha está aprobada por la imagen. Revisar dimensiones, cámaras y coordenadas técnicas de este documento **antes de reconstruir**.
3. La mesa centrada es el objetivo aprobado. Validar medidas, corredores bifurcados y líneas de visión antes de moverla; no reemplazar esa dirección por la distribución antigua durante la fase visual.
4. Aprobar bandas opacas laterales traseras para Memories/Technical y tratamiento visual del techo antes de tocar casco.
5. Implementar Crew Access y luego Tactical como features separadas; conservar estado de misiones.
6. Ejecutar typecheck, lint, unit tests y E2E reales por fase. Para este documento solo corresponde formato; no se afirma que el layout propuesto haya pasado pruebas físicas.

La reconstrucción completa del puente, decoración, modelos finales y cinemática permanecen fuera del alcance del prototipo.

## 10. Plan de implementación de geometría, solo tras revisión

| Paso                      | Archivos previstos                                                                                                      | Reutilización y comportamiento                                                                                                                | Pruebas / aceptación                                                                                                                | Riesgos                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| A. Posiciones compartidas | `src/game/interaction/station.ts`, `src/game/Game.tsx`, componentes `world/*` y mapa de tablet                          | Centralizar posiciones de los puestos que realmente se reutilicen; conservar modos y datos, evitar introducir un motor/configuración genérica | Unitarias de poses, normales y cálculo de distancia por aspecto; no cambia progreso persistido                                      | Duplicar coordenadas entre mesh, raycast, Html y guía                                                  |
| B. Consola frontal        | `world/Workstation.tsx`, `world/WallTerminal.tsx`, `world/Greybox.tsx` o componente enfocado `world/ForwardConsole.tsx` | Tres módulos bajos y dos pantallas; reutilizar UI física y contactos reales; retirar escritorio/collider antiguo solo al montar sustituto     | E real en ambos puestos, foco frontal, contacto error/Skip sin envío, CV, salida con E/botón/Escape; mantener contenido accesible   | Silla bloqueando raycast, monitor desplazado respecto a Html, colisión invisible antigua               |
| C. Estaciones de popa     | `world/CoffeeMachine.tsx`, `world/ProjectPhoto.tsx`, montaje Personal/Crew en `Game.tsx`, mapa de tablet                | Mover café/Personal a las reservas traseras, conservar callbacks y targets; reservar Memories/Technical sin inventar fotos                    | Recorrido desde esclusa a cada objeto con cápsula real, E dentro de alcance, regreso de cámara y persistencia                       | Solapamiento con chaflanes, foto sobre vidrio, camera dentro de mueble                                 |
| D. Proa y techo           | `world/ShipHull.tsx`, `world/Greybox.tsx`, `world/CabinLighting.tsx` solo si necesario                                  | Facetas y marcos con collider coherente; techo industrial visual sin reducir altura del jugador; luz existente inicialmente                   | Recorrer perímetro y esquinas, salto, no salida al espacio, no paredes invisibles; vista desde spawn y entrada revisada por usuario | Geometría visible sin collider, colisiones duplicadas, bajar techo sobre salto, costo de luces/sombras |
| E. Mesa central           | `world/Greybox.tsx` o `world/TacticalTable.tsx`, `station.ts`, mapa                                                     | Trasladar mesa; conservar flujo opcional independiente. El contenido táctico de fase 5 se implementa como feature separada                    | Ambos pasillos transitables, vista exterior/puestos, E y salida sin completar crew                                                  | Mesa bloqueando ruta al Archive, modelo alto tapando ventana                                           |

Después de cada paso: typecheck, lint, formato, unitarias pertinentes y build. E2E sin screenshot/video para movimiento, colisiones, retorno de Pointer Lock, rutas rápidas y fallback. Formularios automatizados usan respuestas simuladas; no enviar emails reales. Registrar consola y errores; medir tiempo de cuadro/draw calls en condiciones reproducibles antes de añadir luces, sombras o decoración. Un build chico o una captura no demuestran fluidez.

Aceptación global de fase 4: desde entrada se identifican mesa y dos puestos frontales; el jugador llega a Archive/contacto/CV sin hacer misiones; ningún paso obligatorio exige sentarse; ventanas amplias y HUD no impiden lectura; tablet usa la planta nueva; todos los colliders coinciden con obstáculos perceptibles; la esclusa conserva 2.5×3.3 y piso continuo. La revisión estética final sigue siendo manual y separada de la evidencia automatizada.
