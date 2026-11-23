# Recurso de manos y tablet para la app

`public/models/cruz-del-sur-hand-interactions.glb` se deriva de los maestros
enlazados, sin guardarlos ni alterar las poses originales. Se regenera con
Blender 5.3 en segundo plano y `scripts/assets/export-hand-interactions.py`.

## Contrato de escena

| Raíz              | Contenido                                                | Clips                          |
| ----------------- | -------------------------------------------------------- | ------------------------------ |
| `TABLET_ASSEMBLY` | Carcasa y ambas manos; hijo animado `TABLET_MOTION`      | `tablet_raise`, `tablet_lower` |
| `CARD_GESTURE`    | Mano derecha, credencial y `CARD_CONTACT`                | `card_present`                 |
| `RADIO_GESTURE`   | Mano derecha, `RADIO_FINGERTIP` y `RADIO_BUTTON_CONTACT` | `radio_press`                  |

El espacio glTF usa Y vertical y +Z hacia el usuario. Las raíces de tarjeta y
radio se colocan en el centro de la superficie de contacto de la app, sin sumar
otra curva de acercamiento. La animación ya contiene acercamiento y retirada.

### Agarre de tablet

`tablet-grip.json` es la pose específica de sostén para ambas manos. El generador
`animate-hand-gestures.py` la aplica a las escenas de subir y bajar, con claves
explícitas de los huesos; no depende de la pose manual abierta del maestro.
La fila de nudillos se orienta verticalmente junto al canto: cuatro dedos
paralelos descansan detrás y el pulgar se opone sobre el bisel frontal. El giro
del rig es de 35° y la muñeca compensa otros 30°, permitiendo que los antebrazos
bajen sin perder la orientación de la mano. Las articulaciones de los cuatro
dedos usan flexión moderada, sin abducción artificial para alcanzar el marco.

`refine-tablet-grip.py` produce un candidato para inspección frontal, lateral y
trasera. `finalize-tablet-grip.py` guarda la configuración y preserva
`hand-gestures-before-tablet-grip.blend`; compara las poses de tarjeta y radio en
cinco cuadros y comprueba los hashes de los maestros antes de promoverlo.
`grip-integration/validation.json` registra diferencia máxima **0** para esos
gestos. El test `handInteractionModel.test.ts` verifica sobre el GLB diez grupos
de vértices distales deformados frente a triángulos reales de la carcasa, con
tolerancia de 4 mm. No se reemplaza esa verificación por marcadores fijos.

Las referencias estáticas de `mission-tablet.blend` siguen siendo el montaje
anterior; la fuente de la pose integrada es `tablet-grip.json` y el derivado
`hand-gestures.blend`. Las mallas base y las poses de tarjeta/radio permanecen
sin cambios.

`CARD_CONTACT` es el centro de la cara posterior de la tarjeta: queda en el
origen entre 0,50 y 0,90 s. `RADIO_FINGERTIP` sigue el hueso distal del índice,
calibrado sobre la superficie de piel evaluada. `RADIO_BUTTON_CONTACT` contiene
el movimiento de la cara del botón: Z=0 a 0,50 s, Z=−0,018 m a 0,58 s, permanece
presionado hasta 0,68 s y vuelve a Z=0 a 0,72 s. No se exporta el soporte de radio
del estudio; la tecla real de la app sigue ese anclaje.

`SCREEN_UI` está bajo `TABLET_MOTION`, en [0, 0, 0,0158], sin rotación adicional.
El área de interfaz mide 0,335 × 0,199 m. La maqueta de UI, luces, cámaras y
lector de revisión se excluyen. React conserva la responsabilidad de la pantalla
y las acciones; los clips no contienen código ni sonido.

## Materiales y geometría

Cada mano usa atlas de color, rugosidad y normal de 1024², horneados desde los
materiales procedurales originales en espacio de reposo. Las costuras y refuerzos
siguen siendo geometría con pesos. Los parámetros metálicos y emisivos de los
instrumentos se conservan. La carcasa conserva colores y valores PBR; su ruido
procedural de microrelieve no se interpreta automáticamente como shader WebGL.

La conversión corrige además `KHR_materials_sheen`: la versión comprobada del
exportador escribía el tinte blanco con intensidad 1, omitiendo el peso original
del material. Eso volvía claros los guantes grafito aunque su atlas fuera
correcto. El recurso deriva `sheenColorFactor` de `Sheen Tint × Sheen Weight`
(0,065 para el guante), sin alterar el albedo ni la iluminación de la app.
`sheen-comparison.png` muestra la comparación real en Chromium, con la misma
cámara, iluminación, resolución 1200×600 y DPR 1. `check-sheen-browser.mjs`
reproduce esa comprobación local; no es una medición de rendimiento.

El skinning glTF es lineal. La exportación desactiva `preserve_volume` de Blender
y calibra la punta con esa misma deformación. No supone equivalencia automática
entre dual quaternion de Blender y la deformación WebGL.

El exportador combina las piezas de cada mano, preserva grupos de huesos y
reutiliza datos de la mano derecha. Después elimina payloads binarios idénticos
sin cuantización ni cambios de silueta. `runtime-export.json` registra tamaño
antes/después y hashes de los maestros. No se incorporó Draco ni un decodificador
externo.

## Verificación y límites de rendimiento

`validate-runtime-export.mjs` carga geometría y animaciones con GLTFLoader y
AnimationMixer. Sólo omite texturas para ejecutar en Node: la apariencia requiere
verificación de navegador. Registra las muestras en `runtime-validation.json` y
comprueba tanto el marcador del índice como los vértices realmente deformados
contra la cara del botón durante la presión. La tolerancia es 0,5 mm.

Los conteos de primitivas/triángulos por raíz son presupuesto geométrico, **no**
mediciones de draw calls o FPS. Ocultar las otras dos raíces evita dibujarlas,
pero el archivo y sus texturas permanecen cargados. La mano de autoría contiene
unas 86.400 caras trianguladas después de aplicar detalles; no se afirma que sea
una densidad óptima para móviles. El tiempo de carga, DPR, tiempo de cuadro y
memoria GPU deben medirse en la app antes de decidir una reducción de geometría.

## Integración verificada en la app

La captura `runtime-app-tablet.png` muestra el GLB final con interfaz React real;
`runtime-app-portrait.png` verifica el encaje vertical. Se revisó la corrección
del brillo textil en Chromium: guante grafito, manga marfil y costuras visibles.

Validación del 20-11-2026:

- `npm run typecheck`, `npm run lint` y `npm run build`: correctos. Vite mantiene
  el aviso existente del tamaño del chunk principal.
- `npm run test -- --maxWorkers=1`: 82 archivos, 269 pruebas correctas.
- Tras los últimos ajustes se repitieron las 11 pruebas de modelos y gestos:
  correctas, incluyendo piel deformada a menos de 0,5 mm del botón y reinicio
  del mixer después de la limpieza de StrictMode.
- Playwright: recorridos de acreditación/tablet y radio correctos, con teclado,
  ratón y Pointer Lock nativos; sin errores de consola ni excepciones. Se
  comprueba contacto antes de acción, pantalla vertical y reversión con T.
- `npm run format:check` sólo marca tres JSON previos ajenos a esta tarea:
  `cabin-master/assembly.json`, `chairs-plants-refinement/audit.json` y
  `consoles-orbit-refinement/audit.json`. Formato de los cambios y diff correctos.

Las pruebas de navegador guardan conteos de un cuadro con y sin tablet; esto no
constituye una medición sostenida de FPS ni una prueba en hardware móvil.

Validación del agarre corregido (21-11-2026): 11 pruebas focalizadas correctas
en modelo, tablet, identificación y pulsación; typecheck, lint y build correctos.
El recorrido Playwright de tablet/acreditación pasó con entrada nativa, sin
errores ni excepciones, incluyendo apertura, reversión, cierre y formato vertical.
Se revisaron ambas capturas; `runtime-app-tablet-grip.png` muestra la pose actual
en la app. Los avisos existentes de deprecación y compilador gráfico permanecen.

Pulido de tarjeta y radio (21-11-2026): los dedos libres quedan recogidos con
flexión gradual; el pulgar de radio queda más próximo a la mano. Se conservan
exactamente la pinza índice/pulgar de tarjeta, el índice de radio, las trayectorias,
los tiempos de contacto y ambas animaciones de tablet. La comparación del derivado
en seis cuadros registra diferencia cero en esas transformaciones y conserva los
SHA de los dos maestros (`card-radio-review/validation.json`). Los adornos unidos
a huesos de dedos modificados sí acompañan la nueva pose.

`contact-hand-poses.json` contiene exclusivamente las rotaciones Euler XYZ en
radianes de los huesos modificados, separadas por `card` y `radio`. Tanto
`animate-hand-gestures.py` como `refine-contact-hand-poses.py` leen esa configuración.
El segundo genera un candidato; `finalize-contact-poses.py` verifica invariantes,
conserva `hand-gestures-before-contact-polish.blend` y lo promueve. Después se ejecuta
el exportador habitual. Las vistas Workbench de frente y perfil están en
`card-radio-review/candidate/`; sirven para revisar silueta/contacto, no para medir
materiales finales ni rendimiento en navegador. No se agregaron geometría,
texturas, luces ni trabajo por cuadro.

Continuidad de manga de radio: el exportador agrega exclusivamente al rig de radio
el hueso `RADIO_SLEEVE_END`, hijo de `forearm` y nunca antecesor de la muñeca.
Su cabeza de reposo está en `(0, 0, -0.225)` m de Blender. El gradiente smoothstep
va de Z `-0.045` a `-0.225`, limitado a tela marfil, costuras y franja naranja con
peso original completo de antebrazo. Puño, instrumento, palma y dedos conservan
sus pesos. Se copia la malla de radio antes de modificar pesos: tablet y tarjeta
conservan el skin compartido original. Los maestros y el derivado `.blend` no
cambian; `runtime-before-arm-extension.glb` conserva la versión previa.

En glTF, `RADIO_SLEEVE_END` tiene padre `forearm_1`, posición local
`[0, -0.004999995, 0]`, escala unitaria y cuaternión aproximadamente `[1, 0, 0, 0]`.
Después de muestrear la animación, `handSleeve.ts` convierte el punto
`[0.18, -0.5, 0.08]` relativo a la cámara al espacio del padre y lo asigna a
`bone.position`, conservando rotación y escala. La tapa queda detrás de la cámara;
no se mueve la muñeca ni se introduce una segunda malla de manga.
El hueso está en `[0.026638, -0.000455, 0.373811]` dentro de `RADIO_GESTURE` a 0,58 s.
La auditoría `sleeve-audit.mjs` permite reproducir esas medidas. La exportación
pesa 16.624.272 bytes: 581.096 más por separar los pesos de radio; no aumenta
triángulos, materiales ni resolución de texturas. Esto no demuestra un cambio de FPS.

Verificación final de tarjeta/radio (21-11-2026):

- 13 pruebas focalizadas en cinco archivos: modelo real, manga, tablet,
  identificación y pulsación. La pinza mantiene piel distal en caras opuestas
  de la tarjeta durante aproximación, apoyo y retirada (tolerancia 2 mm).
  El índice permanece a menos de 0,5 mm de la tecla en seis muestras de presión
  y liberación. La extensión de manga conserva los vértices de la mano.
- Playwright con entrada nativa: acreditación/tablet y todas las teclas de radio
  correctas; contacto observado antes de la acción, sin errores ni excepciones.
  Capturas revisadas: `runtime-app-card-contact.png` y
  `runtime-app-radio-contact.png`. Los avisos previos de WebGL/deprecación siguen.
- Se corrigió la observación de radio: actualizar reproducción ya no reemplaza
  `userData` ni borra el gesto en curso. El recorrido espera inicio y fin de cada
  pulsación; arma el observador de teclado antes de enviar E. La navegación vuelve
  a apuntar con mouse nativo tras salir del terminal. Los primeros intentos fallidos
  detectaron esos problemas de sincronización y navegación; no se omitieron pasos.
- Typecheck, lint, build y formato de archivos modificados correctos. El chequeo
  global de formato conserva tres JSON previos ajenos a esta tarea. Build conserva
  el aviso de tamaño de chunk. No se midió rendimiento sostenido ni hardware móvil.

La prolongación es una deformación visual de manga, no un brazo anatómico con
codo o IK: los pliegues se estiran según la distancia al botón. Se mantiene la
interacción existente y se evita que aparezca un antebrazo cortado en el aire.
