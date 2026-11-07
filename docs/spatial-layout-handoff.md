# CRUZ DEL SUR — Spatial layout handoff

Fecha: 2026-11-07. Documento para compartir con otra IA o diseñador.

## Alcance y estado

Aplicación React + TypeScript + React Three Fiber + Drei + Rapier existente y funcional. NO reconstruir desde cero. Este documento describe una inspección estática del código de la copia de trabajo, incluyendo cambios todavía sin confirmar en Git. No es una medición runtime ni certifica recorridos mediante pruebas nuevas.

No se modificó la escena ni se importaron assets para este informe. La propuesta espacial NO está implementada ni aprobada. Los GLB definitivos se incorporarán más adelante.

Las rutas son relativas a la raíz del repositorio Space-Portfolio. El código vigente prevalece sobre este documento si cambia después de esta fecha. El GDD es `gdd/CRUZ_DEL_SUR_GDD_v1.0.md`; leer también `AGENTS.md`.

## 1. Convenciones y cómo calcular

- Coordenadas `(x,y,z)`: X derecha/estribor, Y arriba, Z hacia popa. Proa = −Z; babor = −X.
- Se interpreta una unidad de escena como un metro para diseño. Three.js por sí mismo no impone unidades físicas.
- Rotaciones JSX son radianes. Conversión a grados: `grados = radianes * 180 / PI`.
- Giro Y de 0 mira hacia +Z para los paneles cuya cara frontal local es +Z; +PI/2 mira +X; PI mira −Z; −PI/2 mira −X. La cámara, en cambio, mira hacia −Z cuando su rotación es cero.
- `boxGeometry args={[w,h,d]}` contiene dimensiones COMPLETAS.
- `CuboidCollider args={[hx,hy,hz]}` contiene SEMIDIMENSIONES. Dimensiones completas = `2 * args`.
- Caja sin rotación: `min = centro − dimensiones/2`; `max = centro + dimensiones/2`.
- Para caja rotada, semiextensión mundial por eje: `e_i = sum_j(abs(R_ij) * h_j)`. Aplicar antes la escala y acumular transformaciones de padres. Una AABB es una envolvente alineada con ejes, no la forma real del collider.
- Para una rotación Y de 90°, se intercambian ancho X y fondo Z.
- Varios meshes: calcular la unión de sus cajas transformadas. Un anclaje de grupo NO necesariamente es el centro de la caja resultante.
- Geometría visual, collider y punto de interacción son conceptos distintos. No sustituir uno por otro automáticamente.
- Un pasillo de ancho W permite un recorrido del centro de la cápsula aproximadamente `W − 2r`, con radio del jugador r=0.3; dejar margen adicional para comodidad.
- Distancia horizontal entre puntos: `sqrt((x2−x1)^2 + (z2−z1)^2)`. El raycast de interacción usa distancia 3D hasta la superficie, no distancia horizontal al anclaje.
- Las cajas visuales aproximadas de este informe se derivan de primitivas, no de un `Box3.setFromObject()` runtime.

## 2. Sala actual: estructura física

Fuente: `src/game/world/Greybox.tsx`.

| Collider       | Centro XYZ        | Semidimensiones   | Dimensiones completas |
| -------------- | ----------------- | ----------------- | --------------------- |
| Piso           | (0,−0.1,0)        | (5.2,0.1,5.2)     | 10.4 × 0.2 × 10.4     |
| Proa           | (0,2.25,−5.1)     | (5.2,2.25,0.1)    | 10.4 × 4.5 × 0.2      |
| Popa izquierda | (−3.225,2.25,5.1) | (1.975,2.25,0.15) | 3.95 × 4.5 × 0.3      |
| Popa derecha   | (3.225,2.25,5.1)  | (1.975,2.25,0.15) | 3.95 × 4.5 × 0.3      |
| Dintel central | (0,3.9,5.1)       | (1.25,0.6,0.15)   | 2.5 × 1.2 × 0.3       |
| Babor          | (−5.1,2.25,0)     | (0.1,2.25,5)      | 0.2 × 4.5 × 10        |
| Estribor       | (5.1,2.25,0)      | (0.1,2.25,5)      | 0.2 × 4.5 × 10        |
| Techo físico   | (0,4.6,0)         | (5.2,0.1,5.2)     | 10.4 × 0.2 × 10.4     |

Por tanto:

- Piso visible y físico: X/Z de −5.2 a +5.2, superficie superior Y=0.
- Interior lateral entre caras de colliders: X=−5 a +5, ancho 10.
- Interior longitudinal fuera del hueco: Z=−5 a +4.95, largo 9.95.
- Abertura trasera: X=−1.25 a +1.25, Y=0 a 3.3.
- Cara inferior del techo físico: Y=4.5.
- No describir la superficie transitable como 100 m² exactos: esquinas, muebles y radio de jugador reducen el espacio útil.
- Centro de cápsula junto a paredes laterales: aproximadamente X=±4.7 como límite, antes de márgenes, objetos y chaflanes.

### Esquinas y hombros

Fuente: `src/game/world/ShipHull.tsx`.

- Cuatro chaflanes: centros `(sx*4.7,2.25,sz*4.7)`, con sx/sz en {−1,+1}.
- Giro Y: `−sx*sz*PI/4`.
- Panel y collider: dimensiones completas `(0.22,4.5,1.65)`.
- AABB horizontal de cada panel: `(0.22+1.65)/sqrt(2) ≈ 1.3223` en X y Z. Es solo una envolvente; no convertirla en collider rectangular.
- Hombros de techo: centros `(±4.56,4.03,0)`, semidimensiones `(0.75,0.1,5.2)`, giro Z=`side * −0.65` rad. Sus extremos inferiores llegan aproximadamente a Y=3.50, por encima del volumen normal de caminar.

## 3. Techo, ventanas, casco visual

Fuente: `ShipHull.tsx`.

### Techo

Bóveda elíptica, no techo plano visual:

```text
x = 5.1 * sin(theta)
y = 3.65 + 1.45 * cos(theta)
theta en [−PI/2,+PI/2]
```

- Arranque Y=3.65; coronación Y=5.10; ancho exterior 10.2.
- Casquetes en Z=−5.1 y +5.1.
- Segmento frontal opaco: centro Z=−4.35, largo 1.7, intervalo −5.2…−3.5.
- Segmento trasero opaco: centro Z=3.35, largo 3.7, intervalo 1.5…5.2.
- Zona longitudinal de lucernarios: centro Z=−1, largo 5, intervalo −3.5…1.5.
- Dos lucernarios curvos: theta −0.85…−0.18 y +0.18…+0.85 rad.
- Franja opaca central: theta −0.18…+0.18.
- Diferencia importante: techo visual máximo 5.1, techo físico plano 4.5. No asumir que todo el volumen de la bóveda es transitable.

### Ventanas

| Elemento           | Centro            | Tamaño del vidrio | Orientación |
| ------------------ | ----------------- | ----------------- | ----------- |
| Panorámica frontal | (0,2.3,−5.08)     | 8 × 2.1           | Plano XY    |
| Babor delantera    | (−5.08,2.3,−2.35) | 3.9 × 2           | Giro Y=PI/2 |
| Babor trasera      | (−5.08,2.3,2.35)  | 3.9 × 2           | Giro Y=PI/2 |
| Estribor delantera | (5.08,2.3,−2.35)  | 3.9 × 2           | Giro Y=PI/2 |
| Estribor trasera   | (5.08,2.3,2.35)   | 3.9 × 2           | Giro Y=PI/2 |

- Frontal: X=−4…4, Y=1.25…3.35.
- Laterales: Y=1.3…3.3; intervalos Z=−4.3…−0.4 y +0.4…+4.3. Los marcos pueden tapar bordes del vidrio.
- Pilar central lateral: centro Z=0, ancho longitudinal 0.8, Y=1.3…3.3.
- Popa opaca, sin ventana.
- Vidrio visual transparente con opacidad 0.055; el cerramiento físico es el collider de pared completo, no el mesh de vidrio.

### Alas exteriores

- Grupo de cada ala: `(side*4.9,0.35,0)`, escala `(side,1,1)`.
- Contorno 2D local: `(0,−2.7),(5.8,2.7),(6.4,4.3),(0,3.7)`; extrusión 0.22 y giro X=PI/2.
- Extremo lateral del contorno: X=±11.3 mundial. No es ancho de habitación ni área caminable.
- Detalles locales del ala: cuerpo `(3.8,0.12,2.6)` tamaño `(0.7,0.5,3.6)`; motor `(3.8,0.14,4.42)` tamaño `(0.5,0.16,0.035)`; baliza `(5.7,0.05,3.7)` tamaño `(0.05,0.08,0.75)`.
- Sin colliders ni interacción.

## 4. Jugador y cámara

Fuentes: `src/game/player/jump.ts`, `Player.tsx`, `src/game/Game.tsx`.

```ts
PLAYER_CAPSULE_HALF_HEIGHT = 0.65
PLAYER_CAPSULE_RADIUS = 0.3
PLAYER_EYE_OFFSET = 0.75
PLAYER_SPAWN_Y = 1
PLAYER_SPAWN_POSITION = [0, 1, 7]
JUMP_SPEED = 4
```

- Altura total cápsula: `2*0.65 + 2*0.3 = 1.9`.
- Centro apoyado ideal sobre piso: Y=0.95; ojos: `0.95+0.75=1.70`. La resolución física puede introducir pequeñas tolerancias.
- Ojos en instante inicial antes de asentarse: `(0,1.75,7)`.
- Rotación inicial cámara `(0,0.35,0)`: unos 20.05° hacia babor respecto a proa.
- Cámara: FOV vertical 65°, near 0.1, far 120. DPR limitado a [1,1.5].
- Física fija 1/60 s. Cuerpo con rotaciones bloqueadas y CCD.
- Física se pausa fuera de caminar y durante transiciones. Al enfocar una estación se desplaza la cámara; el cuerpo conserva el punto de aproximación.
- No cambiar controles FPS, Pointer Lock ni el tratamiento de mouse que resolvió tirones en Opera.

## 5. Inventario completo de interacciones físicas

Dimensiones visuales aproximadas en ejes mundiales X×Y×Z. Anclaje y centro de caja no siempre coinciden. Rotaciones listadas como yaw Y, salvo indicación.

| Objeto                                     | Anclaje / posición                                         | Giro Y | Envolvente visual aproximada | Collider completo                       |
| ------------------------------------------ | ---------------------------------------------------------- | ------ | ---------------------------- | --------------------------------------- |
| Central Archive: escritorio+monitor        | escritorio alrededor de (0,0,−3.7); monitor (0,1.55,−3.65) | 0      | 3×2.04×1.23                  | 3×0.96×1.2, centro (0,0.48,−3.7)        |
| Mesa holográfica                           | (2.15,0,0)                                                 | 0      | 2.1×1.07×2.7                 | 2.1×1.04×2.7, centro (2.15,0.52,0)      |
| Earth Communications                       | (−4.7,1.65,1)                                              | PI/2   | 0.26×1.1×1.3                 | 0.24×1.1×1.3                            |
| Personal Workstation                       | (3.25,1.65,4.65)                                           | PI     | 1.3×1.1×0.26                 | 1.3×1.1×0.24                            |
| Crew Dossier / CV                          | (−3.25,1.65,4.83)                                          | PI     | 1.8×2.52×0.12                | ninguno propio                          |
| Foto de proyecto                           | (−4.7,1.7,−1.7)                                            | PI/2   | 0.07×1×1.5                   | ninguno propio                          |
| Cafetera                                   | (−4.3,0,3.1)                                               | 0      | 0.8×1.5×0.72                 | 0.8×1.5×0.72, centro (−4.3,0.75,3.1)    |
| Interruptor de sala                        | (1.65,1.65,4.65)                                           | PI     | 0.62×0.82×0.25               | ninguno propio                          |
| Interruptor de esclusa                     | (−1.4,1.65,6.1)                                            | PI/2   | 0.25×0.82×0.62               | ninguno propio                          |
| Puerta/mamparo cerrado, detalles incluidos | (0,0,4.86)                                                 | 0      | 2.81×3.3×0.64 aprox.         | hoja 2.5×3.3×0.28, centro (0,1.65,4.86) |

Fuentes: `world/Workstation.tsx`, `Greybox.tsx`, `WallTerminal.tsx`, `CrewDossier.tsx`, `ProjectPhoto.tsx`, `CoffeeMachine.tsx`, `AuxiliarySwitch.tsx`, todos bajo `src/game/`.

### Detalles de geometría para reubicar sin romper funcionalidad

Central Archive:

- Mesa: centro `(0,0.9,−3.7)`, tamaño `(3,0.12,1.2)`.
- Patas: centros `(±1.22,0.43,−3.7)`, tamaño `(0.35,0.86,0.85)`.
- Soporte monitor: `(0,1.12,−3.75)`, tamaño `(0.12,0.4,0.12)`.
- Carcasa monitor: `(0,1.55,−3.65)`, tamaño `(1.65,0.98,0.16)`.
- Pantalla: `(0,1.55,−3.56)`, tamaño `(1.5,0.83,0.02)`.
- Teclado interactivo: `(0,0.99,−3.32)`, tamaño `(0.85,0.04,0.26)`.
- Solo monitor, marcas de pantalla y teclado llevan interaction=computer; no todo el escritorio.

Silla, NO interactiva:

- Collider centro `(0,0.65,−2.3)`, tamaño `(0.84,1.3,0.84)`.
- Huella física: X=−0.42…0.42, Z=−2.72…−1.88.
- Asiento `(0,0.67,−2.3)`, tamaño `(0.8,0.18,0.78)`.
- Respaldo `(0,1.03,−1.96)`, tamaño `(0.8,0.65,0.13)`.
- Brazos `(±0.43,0.88,−2.3)`, tamaño `(0.09,0.1,0.65)`.
- Envolvente visual aproximada 0.95×1.295×0.815; rango vertical 0.06…1.355. No confundir con collider.

Mesa holográfica, posiciones locales respecto a `(2.15,0,0)`:

- Base `(0,0.45,0)`, tamaño `(1.25,0.9,1.7)`.
- Tablero `(0,0.96,0)`, tamaño `(2.1,0.16,2.7)`.
- Panel interior `(0,1.045,0)`, tamaño `(1.8,0.015,2.4)`.
- Proyector `(0,1.055,0)`, tamaño `(1.35,0.012,1.8)`.
- Anillo `(0,1.07,0)`, radios 0.42/0.435, plano horizontal.
- Huella collider mundial: X=1.10…3.20; Z=−1.35…1.35.

Holograma, no collider y raycast ignorado:

- Grupo `(2.15,0,0)`.
- Retrato mundial `(2.15,2.12,0)`, plano 1.7×1.45; llega a Y=2.845.
- Cono mundial `(2.15,1.43,0)`, alto 0.7, radios 0.55/0.08.
- Anillos Y=1.082; radios 0.27,0.42,0.57 con ancho 0.013.
- Visible únicamente en modo hologram después de verificar la identidad. No asumir proyección encendida al entrar.
- Animación de tarjeta/brazo: relativa a cámara, temporal, sin ubicación fija en planta; `CrewIdentification.tsx`.

Terminales murales:

- Caja local 1.3×1.1×0.24; pantalla local `(0,0.03,0.13)`, tamaño 1.1×0.8.
- Personal tiene además panel decorativo de casco centrado `(3.25,1.65,4.89)`, tamaño 2.1×2.9×0.12; no es collider de la terminal.

CV mural:

- Marco local 1.8×2.5×0.1; imagen local `(0,0,0.056)`, tamaño 1.55×2.18.
- Luz superior local `(0,1.25,0.01)`, tamaño 1.8×0.035×0.1.
- Textura `/images/crew-dossier.webp`; descarga real `/documents/joaquin-pettinari-cv.pdf`.

Foto:

- Marco 1.5×1×0.06; imagen local `(0,0,0.04)`, plano 1.4×0.85.
- Usa `projectImages.routewise[0]`, extraída del proyecto existente. No es una foto personal inventada.

Café, posiciones locales:

- Mueble `(0,0.45,0)`, 0.8×0.9×0.72.
- Máquina `(0,1.2,−0.15)`, 0.8×0.6×0.38.
- Indicador `(0,1.35,0.05)`, 0.55×0.12.
- Boquilla `(0,1.05,0.08)`; taza `(0,0.98,0.18)` aparece al preparar/listo.
- Interacción independiente de las misiones. Comando opcional `npm install coffee` acciona la misma lógica.

## 6. Cámaras de enfoque e interacción

Fuente: `src/game/interaction/station.ts`.

| Modo           | Cámara XYZ      | LookAt XYZ       |
| -------------- | --------------- | ---------------- |
| computer       | (0,1.55,−2.55)  | (0,1.55,−3.57)   |
| hologram       | (2.15,1.8,2.8)  | (2.15,1.9,0)     |
| communications | (−2.9,1.65,1)   | (−4.7,1.65,1)    |
| personal       | (3.25,1.65,2.9) | (3.25,1.65,4.65) |
| photo          | (−2.9,1.7,−1.7) | (−4.7,1.7,−1.7)  |

- Raycast desde centro de cámara; primera superficie gana, incluso si no es interactiva.
- Alcance normal 2.8; mesa 4.5.
- Objetivos: computer, dossier, hologram, lighting, communications, personal, photo, coffee, bulkhead.
- Tablet T es DOM; no tiene caja/posición mundial. Apps, formulario y escritorio tampoco son objetos físicos separados.
- Cambiar posiciones exige revisar también poses de cámara, guía/mapa de tablet, marcadores, raycasts y pruebas de navegación.
- La cámara de computer está dentro de la huella horizontal de la silla, pero es un enfoque visual con física pausada; no usar esa posición como spawn del cuerpo.

## 7. Esclusa actual, medidas exactas

Fuente: `src/game/world/EntryAirlock.tsx`.

| Collider  | Centro          | Semidimensiones |
| --------- | --------------- | --------------- |
| Piso      | (0,−0.1,6.75)   | (1.6,0.1,1.55)  |
| Techo     | (0,3.7,6.55)    | (1.6,0.1,1.65)  |
| Fondo     | (0,1.8,8.2)     | (1.6,1.8,0.1)   |
| Laterales | (±1.5,1.8,6.55) | (0.1,1.8,1.65)  |

- Ancho interior: `2*(1.5−0.1)=2.8`.
- Altura interior: `3.7−0.1=3.6`.
- Paredes laterales Z=4.9…8.2; fondo cara interior Z=8.1.
- Piso Z=5.2…8.3; se une con piso principal en Z=5.2, Y=0.
- Hoja cerrada: centro Z=4.86, espesor 0.28; cara de entrada Z=5.0.
- Profundidad libre con hoja cerrada: `8.1−5.0=3.1`.
- Abertura nominal 2.5×3.3; centro de jugador dispone de aproximadamente `2.5−0.6=1.9` de ancho de trayectoria sin margen adicional.
- Marco fijo: jambas `(±1.3,1.65,4.86)` tamaño 0.1×3.3×0.32; dintel `(0,3.35,4.86)` tamaño 2.7×0.1×0.32. Sin collider propio; cerramiento físico adyacente en Greybox.
- Detalles de puerta: paneles de hojas locales `(±0.54,1.5,−0.17)` tamaño 1.04×2.85×0.12; consola decorativa local `(1.44,1.35,−0.05)` tamaño 0.23×0.38×0.15. Todo este grupo es objetivo bulkhead; la consola no es un objetivo aparte.
- Puerta actual no se desliza: al abrir se retiran hoja y collider juntos. No vuelve a cerrar.
- Antes de energía, E no la abre. Tras energía, E abre. Al cargar con energía persistida inicia abierta.
- No existe puerta exterior funcional: fondo cerrado con marcas geométricas.

## 8. Luces: posiciones actuales

Fuentes: `Game.tsx`, `world/CabinLighting.tsx`.

| Luz                   | Posición mundial                 | Intensidad normal / emergencia |
| --------------------- | -------------------------------- | ------------------------------ |
| Ambient               | sin posición relevante           | 0.65 / 0.25                    |
| Hemisphere            | sin posición de diseño relevante | 1.4 / 0.45                     |
| Directional frontal   | (4,8,−6)                         | 2.4 / 0.8                      |
| Directional posterior | (−3,4,5)                         | 1.6 / 0.35                     |
| Spot frontal          | (1.8,4.2,−4.6)                   | 65 / 18.2                      |
| Point lateral         | (−4.5,2.2,−1.5)                  | 10 / 2.8                       |
| Point alarma          | (0,3.15,4.15)                    | 0 / pulso 2…10                 |

- Baliza visual: grupo `(0,3.35,4.5)`, caja 0.72×0.2×0.22; lente local `(0,−0.04,−0.13)` tamaño 0.48×0.1×0.08.
- Spot: ángulo 0.85 rad, penumbra 0.7, distancia 14, decay 2. Sin target explícito en el componente.
- Point lateral: distancia 9; alarma distancia 8.
- Pulso alarma de 4 segundos; movimiento reducido lo estabiliza. Restauración con una caída suave durante 0.9 segundos.
- No agregar luces/sombras costosas solo por cambiar el layout; medir antes.

## 9. Exterior actual y coordenadas dinámicas

Fuentes: `SpaceExterior.tsx`, `AsteroidField.tsx`, `DistantShip.tsx`, `shuttleRoute.ts`.

Son elementos escénicos, NO navegables ni interactivos. Coordenadas siguientes locales al grupo orbital, coincidentes con mundo antes de comenzar su rotación.

| Objeto           | Posición inicial/local                     | Geometría / tamaño                                                |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Planeta azul     | (−25,10,−38)                               | esfera radio 13; rotación inicial (0.2,−0.5,0.3)                  |
| Luna             | (−8,18,−66)                                | esfera radio 3.4                                                  |
| Planeta distante | (44,8,−61)                                 | esfera radio 6.5; rotación (0.15,−0.4,−0.18)                      |
| Shuttle          | inicialmente (0,7,−26)                     | cuerpo octaedro escala (1.8,0.32,0.55), alas escala (0.65,0.09,2) |
| Estrellas        | distribución esférica radio 55…103         | 3 capas: 1100,550,170 puntos                                      |
| Asteroides       | 95 instancias; distribución indicada abajo | icosaedro irregular escalado                                      |

- Grupo orbital gira Y a 0.006 rad/s; estrellas añaden 0.012 rad/s; planeta azul añade rotación propia Y=0.035 rad/s.
- Transformación orbital de punto local: `xWorld=cos(a)*x+sin(a)*z`, `zWorld=−sin(a)*x+cos(a)*z`, `yWorld=y`.
- Shuttle: fase p=tiempo*0.025; posición `(24*sin(p),7,−43+17*cos(p))`. Tangente `(24*cos(p),0,−17*sin(p))`. Giro Y=`atan2(−tangente.z,tangente.x)`. Vuelo continuo en elipse, no ida/vuelta. Luego se aplica giro orbital padre.
- Asteroides: semilla 84013; X inicial `−44−random()*23`, Y `−8+random()*26`, Z `−18−random()*37`.
- Tamaño base `0.18+random()^2*1.9`, escalas independientes `size*(0.6+random())`. No existe un único tamaño común.
- Deriva asteroide X ±0.6, Y ±0.4; spin de magnitud 0.12…0.36 rad/s en Y y 0.6 veces en X.
- Estrellas: semilla 73129; tamaños de punto 0.075,0.14,0.24.
- Estos movimientos usan delta limitado a 0.05, se detienen con pestaña oculta o movimiento reducido. No se mueve el piso ni se balancea la cámara del jugador para simular órbita.
- Para obtener coordenadas exactas de cada estrella/roca hay que ejecutar los generadores con sus semillas y orden de llamadas del código; no inventar una lista manual de posiciones.

## 10. Diagnóstico espacial actual

1. Ya existe esclusa funcional; no hace falta crear otra ni reconstruir la sala.
2. La mesa está desplazada a estribor: mantiene libre el eje X=0.
3. Desde puerta abierta se ve la mesa en diagonal y el ventanal al frente. Desde spawn con puerta cerrada NO se ve la sala.
4. El retrato holográfico no está encendido en reposo; al entrar se ve la mesa.
5. Archivo frontal obstruye parcialmente el ventanal con su monitor, pero quedan vistas laterales amplias.
6. La silla interrumpe el eje central cerca del archivo. El recorrido debe rodearla.
7. Communications y foto se superponen parcialmente a ventanas laterales; no llenar esa pared de pantallas si se quiere preservar el espacio exterior.
8. Techo visual/colisión difieren; registrar antes de importar modelos.
9. Café mira actualmente hacia +Z (popa), no hacia el interior +X.
10. No existe panel de gravedad. La frase del logro de café no implica un sistema de gravedad implementado.

## 11. PROPUESTA pendiente de aprobación

Conservar sala, esclusa, piso, altura de jugador y estaciones. Cambios mínimos: orientar café hacia el interior, reservar un panel de gravedad, mejorar puerta con animación compatible con colisión.

| Elemento                    | Posición propuesta    | Giro Y   | Estado                  |
| --------------------------- | --------------------- | -------- | ----------------------- |
| Archive                     | escritorio (0,0,−3.7) | 0        | conservar               |
| Communications              | (−4.7,1.65,1)         | PI/2     | conservar               |
| Personal                    | (3.25,1.65,4.65)      | PI       | conservar               |
| Mesa                        | (2.15,0,0)            | 0        | conservar               |
| Café                        | (−4.3,0,3.1)          | PI/2     | solo giro propuesto     |
| Foto                        | (−4.7,1.7,−1.7)       | PI/2     | conservar primer módulo |
| Gravity control             | (4.85,1.55,0)         | −PI/2    | nuevo, NO implementado  |
| CV mural                    | (−3.25,1.65,4.83)     | PI       | conservar               |
| Esclusa/spawn/interruptores | actuales              | actuales | conservar               |

Gravity control: panel local 0.60×0.80×0.12; mundial 0.12×0.80×0.60. Montar sobre pilar central opaco de estribor, no sobre el vidrio. Efecto opcional y reversible de props flotantes, sin alterar física del jugador ni bloquear contenido.

### Circulación propuesta y cálculos

- Reservar eje X=−0.9…+0.9 (1.8 m) desde puerta hasta antes de la silla. Es una reserva de diseño, no un collider ni pasillo marcado existente.
- Mesa empieza X=1.1: deja 0.2 m respecto a esa reserva.
- Paso lateral derecho entre mesa y pared: `5−3.2=1.8` m geométricos.
- Panel gravedad propuesto: cara interior X=`4.85−0.12/2=4.79`; paso hasta mesa `4.79−3.2=1.59` m. Recorrido de centro de cápsula: aproximadamente `1.59−0.6=0.99` m antes de margen.
- Pasillos principales deseables ≥1.2 m, preferiblemente 1.5 m. Son objetivos de diseño, no certificación normativa.
- Mantener libre aproximación a mesa `(2.15,1.8,2.8)` y terminales según poses actuales.
- Llegar al Archive rodeando silla preferentemente por babor; no añadir muebles delante.
- Distancia horizontal puerta→centro mesa: `sqrt(2.15^2+4.86^2) ≈ 5.31` m; no significa interacción desde puerta, pues raycast tiene alcance 4.5 y mide superficie.
- Mantener rutas independientes a CV, perfil, empleo, educación, proyectos y contacto. No obligar a usar mesa para abrir Archive.

### Puerta propuesta

- Dos hojas correderas laterales, sin barrido hacia jugador.
- Abertura nominal actual 2.5×3.3; hoja por lado de aproximadamente 1.25 m de ancho.
- Estados explícitos closed → opening → open. Primera versión permanece abierta.
- Colliders acompañan hojas durante movimiento; no barrera invisible ni desaparición anticipada mientras hoja visual obstruye.
- Reservar bolsillos laterales dentro del mamparo y comprobar interferencia con interruptor cercano; no asumir que el detalle actual tiene ya esos bolsillos.
- Sin umbral elevado. Movimiento reducido permite apertura inmediata sincronizada.
- Si se añade cierre futuro, sensor de ocupación bloquea/revierte cierre; jamás atrapar jugador.
- No añadir puerta exterior hasta definir espacio de destino.

## 12. Plano cenital propuesto (no a escala)

Coordenadas del plano son (X,Z); Y se encuentra en las tablas.

```text
                          PROA / −Z
                   VENTANAL FRONTAL 8 m
           X=−5                              X=+5
Z=−5       /------------------------------------\
          /               ARCHIVE                \
         |                (0,−3.7)                |
         |                  silla                 |
         | PHOTO                                  |
         | (−4.7,−1.7)             +----------+   |
         |                         |  TABLE   |   |
Z=0      |       eje libre         | (2.15,0) | G |
         |                         | 2.1×2.7  |   |
         | COMMS                   +----------+   |
         | (−4.7,1)                               |
         |                                        |
         | COFFEE                                 |
         | (−4.3,3.1)                             |
         |  CV                         PERSONAL   |
         | (−3.25,4.83)               (3.25,4.65) |
Z≈5       \-------------+ 2.5 m +---------------/
                        | DOOR  |
                        |       |
Z=6.1                 L |       |
                        |       | ancho libre 2.8
Z=7                     | SPAWN |
                        | (0,7) |
Z=8.1                   +-------+
                          POPA / +Z

G: gravedad propuesta (4.85,0), todavía inexistente
L: interruptor de esclusa (−1.4,6.1)
Sala interior ~10×9.95, descontar esquinas/obstáculos
Esclusa cerrada: 2.8×3.1 libres, altura 3.6
```

## 13. Reglas para la siguiente IA / implementación futura

- Este documento aporta contexto; NO autoriza ejecutar la propuesta sin aprobación del usuario.
- Interfaces y narrativa en inglés; explicar gráficos y decisiones al usuario en español.
- Preservar cambios sin confirmar. No importar assets ni cambiar escena durante una auditoría.
- Reutilizar contenido profesional real, CV y capturas existentes. No inventar empleo, formación, proyectos o fotos personales.
- La aplicación arranca en 3D, sin pantalla inicial que obligue a elegir portfolio/juego. Animación de llegada definitiva pendiente.
- T abre tablet. Tutorial opcional, extras independientes. Tras energía se puede explorar libremente.
- Mantener Quick Portfolio Access DOM y contenido profesional accesible sin completar misiones ni depender de WebGL.
- Mantener E, Escape, Pointer Lock, movimiento independiente de FPS y limpieza de teclas al perder foco.
- Para mover una estación actualizar geometría, collider, poses de enfoque, objetivos, tablet y tests juntos.
- No alterar gravedad global para el extra de props flotantes.
- No introducir dependencias sin necesidad concreta; no optimizar por intuición.
- Antes de aprobar un layout implementado: probar entrada/esclusa, bordes, salto, rodear mesa/silla, aproximación y salida de todos los modos, Escape/T/E, tutorial omitido y acceso directo.
- Verificar visualmente desde ojos a 1.7 m y desde el spawn, no solo con plano cenital.
- Este informe no ejecutó nuevos tests, build ni mediciones de rendimiento: solo lectura de código y cálculos geométricos.

## 14. Archivos clave para contrastar

```text
AGENTS.md
gdd/CRUZ_DEL_SUR_GDD_v1.0.md
docs/architecture.md
docs/functional-progress.md
src/game/Game.tsx
src/game/player/Player.tsx
src/game/player/jump.ts
src/game/interaction/Interaction.tsx
src/game/interaction/station.ts
src/game/world/Greybox.tsx
src/game/world/EntryAirlock.tsx
src/game/world/ShipHull.tsx
src/game/world/Workstation.tsx
src/game/world/WallTerminal.tsx
src/game/world/CrewDossier.tsx
src/game/world/CrewHologram.tsx
src/game/world/CrewIdentification.tsx
src/game/world/CoffeeMachine.tsx
src/game/world/ProjectPhoto.tsx
src/game/world/AuxiliarySwitch.tsx
src/game/world/CabinLighting.tsx
src/game/world/SpaceExterior.tsx
src/game/world/AsteroidField.tsx
src/game/world/DistantShip.tsx
src/game/world/shuttleRoute.ts
src/game/ui/MissionTablet.tsx
src/data/portfolio.ts
src/data/projectImages.ts
e2e/airlock.spec.ts
e2e/station.spec.ts
e2e/journey.spec.ts
```
