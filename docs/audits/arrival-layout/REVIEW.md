# Llegada, nichos y mesa táctica

Corrección de las cinco capturas del usuario. Los cambios se integran en el
juego; no se sobrescribe el Blender abierto ni sus fuentes editables.

## Resultado

- El traje de primitivas se sustituye por una chaqueta EMU adaptada de
  NASA/Michael D. Carbajal: 41.642 triángulos, cinco materiales y 1.300.520 bytes.
  Se retiran únicamente las islas identificadas de los soportes y bloques
  ajenos a la prenda, preservando mangas y guantes. La malla completa queda
  dentro de su collider y separada más de 25 cm del marco real de la escotilla.
  [Fuente, adaptación y créditos](../../assets/nasa-emu/README.md).
- Se retiran la manta con sus costuras y la caja del asiento. Los demás
  equipamientos y la forma/colisiones del banco permanecen.
- La pared lleva dos filtros y dos armarios alternados. Las piezas completas
  conservan etiquetas, rejillas, puertas y tiradores. Los armarios se adelantan
  19 cm respecto de los montantes de pared y se alinean sus colliders.
- El acceso recibe un marco achaflanado con esquinas redondeadas `/--\`, sin
  invadir la abertura de circulación. Es una corrección del acceso interior,
  no un cambio de toda la envolvente exterior o del vidrio.
- Se integran los dos nichos pendientes de Blender mediante un GLB visual
  independiente (37.832 triángulos, 15 lotes y 3.113.116 bytes). Las hojas hornean
  su color a 256 px; fotos y pantallas conservan sus mapas. Los acabados de
  microbump de Blender no se presentan como shaders idénticos en runtime.
- La mesa usa un pivote central y una pose activa calculada respecto del visor
  transparente de su UI. Navegación y datos se agrupan a la izquierda; modelo y
  controles tienen más espacio. Las pruebas proyectan el casco en 64 ángulos,
  dos niveles de zoom y tres proporciones de pantalla.

Recetas de las copias de arquitectura:
[arrival-cleanup](../arrival-cleanup/README.md). La fuente y los GLB anteriores
se conservan; el runtime selecciona las copias `clean-*`.

## Comprobación nativa

`npm run test:audit -- arrival-layout-review.spec.ts` recorre llegada, escaneo,
puerta, pasillo, nichos y mesa mediante teclado/mouse reales. Comprueba zoom,
giro, datos de sistemas y regreso a Pointer Lock. Las capturas acompañan a este
informe. No se usa MCP ni se cambian posiciones desde diagnósticos.

El test de `evaEquipmentLayout` carga el traje y marco de escotilla reales con
GLTFLoader, comprueba que el collider contenga sus bounds y exige separación
lateral. Las pruebas del acceso usan Raycaster sobre su geometría, no mocks.

## Rendimiento: comparación controlada

La sesión actual no reproduce los ~17 ms de la revisión anterior. Se midió la
misma receta con los nichos montados y retirados temporalmente; después se
restauró su montaje. Los JSON de ambas ejecuciones se conservan junto a sus
capturas de mesa. El código final incluye los nichos.

| Vista de mesa,1280×720,DPR1 | Mediana |     p95 | Llamadas de muestra | Triángulos |
| --------------------------- | ------: | ------: | ------------------: | ---------: |
| Con nichos                  | 33,20ms | 45,50ms |                 159 |    499.848 |
| Sin nichos                  | 33,20ms | 45,60ms |                 150 |    466.480 |

Cada ejecución calienta 30 cuadros y registra 120 muestras del observador de
desarrollo; la cámara se alcanza con física e input real, por lo que la pose
final puede variar unos centímetros. No se debe interpretar la comparación
como un coste GPU nulo de los nichos: sí añaden geometría y llamadas. Las
medianas similares no los señalan como explicación de la caída observada.
Tampoco prueban que el cambio completo no tenga coste ni aíslan hardware,
compositor, otras tareas o el resto de la escena.

**No se lograron 60 FPS estables en esta sesión.** No se añadieron luces prácticas,
sombras, postprocesado ni callbacks por cuadro para las decoraciones. No se
reduce resolución ni se alteran controles para presentar una cifra mejor.

La medición de la ejecución final completa queda en `timing.json`.

## Checks ejecutados

```text
npm run typecheck
npm run lint
npm run test -- --maxWorkers=2
npm run test:audit -- arrival-layout-review.spec.ts
npm run test:e2e -- unified-interior.spec.ts next-phase.spec.ts --grep "optional tactical|locked door"
npm run test:e2e:production
npm run format:check
```

Pasaron 239 pruebas en 73 archivos con dos procesos, la auditoría nativa,
las dos regresiones seleccionadas y el smoke de producción con build real.
La primera ejecución completa con paralelismo automático agotó los5000ms de
`furnishingsAsset.test.ts`; la repetición redujo concurrencia, sin cambiar
la prueba ni sus límites de tiempo. La retirada de tres soportes anteriores
del estante evita que una barra cruce el nuevo tablero técnico.

El formato global mantiene dos advertencias anteriores en JSON de refinamientos
Blender; los archivos nuevos de esta pasada se formatean. El build conserva el
aviso de chunk JavaScript mayor de500kB. No se modifican esas deudas durante
esta corrección visual. Los diagnósticos de desarrollo siguen ausentes del
bundle publicado.
