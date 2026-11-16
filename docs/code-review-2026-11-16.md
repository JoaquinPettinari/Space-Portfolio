# Revisión de calidad — 2026-11-16

## Alcance

Revisión de módulos de aplicación, orquestación, modos/entrada, física,
interacciones, renderizado, recursos GLTF, interfaces DOM, datos profesionales,
contacto/servidor y configuración/pruebas. Se inspeccionaron las herramientas de
assets activas y se buscaron patrones repetidos/rutas locales en el conjunto de
scripts históricos. No constituye una ejecución de cada receta histórica de
Blender ni una certificación de ausencia de errores. No se regeneraron assets,
no se editó Blender ni se añadieron dependencias. Se preservó el trabajo previo
sin confirmar (incluidas las mejoras de tablet y misiones).

La exploración del grafo de imports locales desde main, incluidos imports
asíncronos literales, no encontró ciclos alcanzables. El grafo no demuestra que
un módulo sea innecesario para herramientas externas: las utilidades de
geometría/acabados y sus pruebas históricas se conservan explícitamente.

## Hallazgos corregidos

- **P1 — Regresiones de entrada obsoletas.** airlock/station todavía buscaban un
  interruptor inicial retirado y journey esperaba progreso vacío, aunque la
  alimentación es automática. Se reemplazaron por comprobaciones de potencia
  inicial, identificación/puerta y sesión fresca. Se reutilizaron los helpers
  reales de cámara/observación y se corrigieron esperas de bajada de tablet y
  un selector oculto en viewport estrecho. No se simula Pointer Lock.
- **P2 — Trampas de foco divergentes.** Cuatro diálogos activos compartían lógica
  copiada con listas distintas; algunas omitían regiones desplazables y podían
  enfocar contenido oculto. dialogFocus unifica el comportamiento, incluye
  controles nativos/tabindex y filtra hidden, inert, disabled, display none y
  visibility hidden. Pruebas cubren recorrido en ambos sentidos y foco
  programático. No sustituye el resto de la gestión de entrada ni retorno de foco.
- **P2 — Preparación GLTF duplicada.** prepareShipModel centraliza clonación local
  de materiales transparentes y limpieza, conservando texturas/geometría y
  materiales opacos compartidos. La opción de vidrio single-pass permanece
  exclusiva de la envolvente. Prueba explícita de propiedad/disposición.
- **P2 — Suscripciones de movimiento reducido repetidas.** Ocho componentes
  activos comparten useReducedMotionRef; conserva lectura por ref e invalidate
  donde corresponde. Prueba de cambio dinámico y limpieza en StrictMode.
- **P2 — Datos de proyectos demasiado permisivos.** ProjectId literal y tuplas no
  vacías exigen imágenes para todos los proyectos antes de que las vistas
  accedan a la primera. El contrato anterior Record<string, Image[]> permitía
  datos incompletos sin error de compilación.
- **P2 — Targets repetidos entre tipo y runtime.** Una lista STATION_TARGETS
  produce el tipo y la guardia para userData desconocido de las mallas. Prueba
  rechaza objetos, arrays, null y cadenas ajenas sin casts inseguros.
- **P2 — Exportadores dependientes de un usuario local.** Los tres exportadores
  runtime vigentes localizan el checkout desde el blend guardado y fallan antes
  de exportar si no pertenece a uno. Se retiró su ruta personal fija. Sintaxis
  verificada con Python de Blender; no se ejecutó exportación ni se cambió escena.
- **P3 — Documento repetido.** crewDossier contiene href y nombre de descarga;
  Game, portfolio y escritorio lo consumen sin cambiar enlaces ni eventos.
- **P3 — Componentes sin consumidor.** Retirados EntryMenu y su prueba aislada,
  AuxiliarySwitch, CrewIdentification, AstronautArm, CrewHologram y
  HologramPanel/CSS. Sus sustitutos activos se mantienen. No se borraron modelos
  ni recetas de arte. Se aclara la documentación histórica de acabados.

## Retirada del espejo

Se eliminó CrewMirror, su montaje y su collider. No quedan render targets,
cámara secundaria ni avatar exclusivo del reflejo. La prueba crew-presence ahora
verifica subir y bajar la tablet usando teclas reales; deja de generar métricas
del espejo. Las capturas de la iteración anterior son evidencia histórica, no
el estado actual.

## Hallazgos pendientes

1. **P2 — Auditorías mezcladas con la suite E2E general (resuelto en la continuación).** La configuración base
   descubre también revisiones históricas que escriben docs/audits. Conviene
   una separación explícita de regresión y auditoría; no se ocultaron tests
   arbitrariamente para conseguir una suite verde. No se ejecutó toda esa
   colección como si fuera una regresión actual.
2. **P2 — Profiling acoplado a APIs privadas (resuelto en la continuación).** e2e/helpers/profileBridge.ts usa
   una ruta de caché Vite y _roots de Fiber, y altera DPR/raycast. Es una
   herramienta experimental, no un observador read-only. Requiere separar ese
   experimento antes de adoptarlo como verificación estable.
3. **P3 — Archivo histórico.** Persisten recetas de Blender con rutas de la
   máquina y utilidades de geometría/acabados no montadas en runtime. No deben
   confundirse con código de producción ni ejecutarse como pipeline portátil.
4. **P3 — Orquestación amplia.** Game/GameWorld coordinan numerosos callbacks;
   subtitle=null atraviesa terminales con soporte opcional. No se introdujo un
   store global ni un framework de estados solo para reducir props: una próxima
   extracción debe demostrar simplificación y preservar las transiciones.

Contacto conserva validación compartida, límites atómicos, idempotencia,
timeouts y respuestas de error cerradas. No se encontró un defecto concreto
que justificara modificar esas reglas en esta pasada.

## Validación

Resultados finales de typecheck, lint, unitarias y navegador registrados al
terminar la revisión. Build conserva el aviso previo de chunk grande. Los dos
JSON de auditorías antiguas de Blender siguen fuera del formato esperado;
no se reescriben informes ajenos a esta tarea. Journey completo y todos los
scripts de arte no se presentan como ejecutados.

### Resultado ejecutado

- `npm run typecheck`, `npm run lint`, `npm run build`: correctos.
- `npm run test -- --maxWorkers=2 --testTimeout=30000`: **222 pruebas correctas
  en65 archivos**,129s. La eliminación de la prueba de EntryMenu corresponde a
  retirar el componente sin consumidor, no a ocultar un fallo.
- Navegador: tablet1, monitores/HTML5, airlock1, station1, vidrio1 y navegación
  unificada1: **10 casos distintos correctos**, con entradas y Pointer Lock
  reales. El envío de contacto en el caso HTML usa respuestas explícitamente
  mockeadas; no acredita un envío real.
- La primera tanda navegador tuvo6casos correctos y un error ENOENT al cerrar
  la traza de navegación: dos procesos de Playwright escribían en test-results.
  Se repitieron navegación y vidrio con `--output artifacts/code-review-navigation`:
  ambos correctos. No se ocultó el fallo ni se presentó esa tanda como verde.
- Python de Blender verificó sintaxis de los tres exportadores y9casos de
  selección del checkout/fallo por fuente no guardada/fuente externa, sin
  importar bpy ni ejecutar exportaciones.
- `npm run format:check`: falla exclusivamente por los dos JSON históricos de
  Blender mencionados arriba. Los archivos de esta revisión están formateados.
- `git diff --check`: correcto. La búsqueda de `__GAME_DEBUG__` en dist/assets
  no encuentra la interfaz de desarrollo en producción. No quedan imports del
  espejo o de los componentes retirados en src.

La continuación separa las suites y reemplaza el helper privado por profiling
observacional. Los párrafos anteriores conservan el hallazgo original; el
contrato y comandos actuales están en [testing.md](testing.md).
