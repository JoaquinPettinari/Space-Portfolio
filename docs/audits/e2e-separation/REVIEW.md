# Separación E2E y profiling — 2026-11-16

## Resultado

Regresión, auditorías y producción tienen selecciones y destinos explícitos.
El inventario contiene 55 casos funcionales en 19 specs,14 auditorías en 10 specs y
un smoke de producción. No se movieron ni eliminaron specs. La prueba de
clasificación comprueba exhaustividad y ausencia de solapamientos incluso en
subdirectorios futuros. Los comandos están en [testing.md](../../testing.md).

El profiling del puente usa la interfaz readonly de desarrollo y el protocolo
público CDP de Chromium. Se eliminaron la importación desde el caché de Vite,
_roots de Fiber, la sustitución de raycasts y el cambio de DPR. El renderer y la
escena conservan sus valores. La sesión de profiling se cierra en finally.
El test comprueba120 muestras con drawcalls/triángulos positivos, DPR estable y
perfil CPU no vacío con intervalo temporal válido. El archivo bridge.cpuprofile
y el JSON de observaciones se adjuntan al reporte de auditoría.

Los perfiles CPU añaden sobrecarga y se ejecutaron en un equipo que también
verificaba regresiones: no se presentan sus tiempos como un benchmark aislado
de FPS ni como evidencia de 60 FPS constantes. No se añadieron dependencias,
modelos, luces, sombras ni cambios de física.

## Regresiones puestas al día

La ejecución amplia descubrió expectativas de versiones anteriores: botón de
tablet retirado, iluminación0.65 en vez de 0.5, seis misiones en vez de cuatro,
marcadores con el separador antiguo, retrato ausente, galería anterior,
waypoints dentro de consolas y coordenadas de la antigua llegada. Se actualizaron
usando la UI actual y constantes de geometría, manteniendo comprobaciones de
colisión, parada al soltar teclas, salto, retorno y carga real de imágenes/PDF.

El helper de entrada utiliza el botón real Resume mission cuando hay pausa,
en lugar de intentar atravesar su backdrop. Se espera el final de transiciones
antes de enviar nuevos controles. Escape de terminal vuelve a caminar; la
siguiente pulsación libera el cursor, ambas acciones verificadas. No se añadieron
atajos de estado ni setters al observador para conseguir resultados correctos.

Se restituyó el control táctil de tablet mediante un botón DOM solo para
pointer:coarse, llamando al control existente. El test usa tap real, sin teclado
ni Pointer Lock. El grupo de instrucciones tiene role=group y nombre accesible.

## Verificación ejecutada y límites

- `npm run typecheck`, `npm run lint`, `npm run build`: correctos. Se conserva
  el aviso anterior de chunk grande.
- `npm run test -- --maxWorkers=2 --testTimeout=30000`:223 pruebas correctas,
  66 archivos. La prueba de inventario volvió a ejecutarse al cerrar:1/1.
- Listados CLI:55 regresiones,14 auditorías,1 producción. Compatibilidad: monitor36,
  arrival36, passage29, refined13 casos. Los listados no equivalen a ejecutar
  las recetas históricas.
- Tanda amplia funcional:30 correctos y25 fallidos, con fixtures anteriores a las
  correcciones. No se presenta como verde. Hubo una primera exploración parcial
  interrumpida antes de esa tanda para corregir readiness y presupuesto de carga.
- Repetición de fallidos con fixtures actualizados:19 correctos y5 fallidos.
  El caso de esquina cambió de título y se verificó explícitamente por separado:
  1correcto con teclado/colisiones reales.
- Repetición final de los cinco restantes:5 correctos. Así se verificaron los
  55 escenarios a lo largo de las tandas; **no se afirma una nueva ejecución
  única de los55 en verde después de la última edición**.
- `PROFILE_BRIDGE=1 npm run test:audit -- roof-performance.spec.ts`:correcto,
  incluido perfil CPU real y compilación GPU sin errores. Se verificó de nuevo
  al añadir las aserciones de contenido del CPU profile.
- `npm run test:e2e:production`:correcto con configuración final, CSP real,
  navegación de tablet/archivo/HTML y ausencia de **GAME_DEBUG**.
- Acceso táctil y esquina también pasaron en ejecuciones focalizadas con
  artefactos independientes. No se usaron mocks de Pointer Lock ni del movimiento.
  Los casos de contacto de red que usan mocks no acreditan envío real de correo.
- Las14 auditorías completas no se ejecutaron; algunas son recetas históricas de
  assets. La auditoría de profiling sí se ejecutó.
- Formato global conserva únicamente los dos informes antiguos de Blender fuera
  de formato. Los archivos de esta tarea se formatearon; git diff --check correcto.

Los JSON discovery-failures y first-rerun-failures conservan las listas originales
de IDs fallidos. final-rerun corresponde a la última tanda de cinco, no a55 casos.
Los artefactos de ejecución viven en test-results y playwright-report separados
por configuración; no forman parte de los assets de producción.
