# Revisión general de la app — 2026-11-17

Revisión de código y pruebas existentes, sin modificar comportamiento ni modelos.
Se priorizaron estado de sesión, diálogos, controles, acceso al portfolio y contacto.
No constituye una auditoría exhaustiva ni una medición de rendimiento WebGL.
Los tres hallazgos siguientes describen el estado encontrado en la revisión.
Las correcciones posteriores están implementadas: admisión atómica antes de
consumir cuota, pausa del reloj con `showMouseHint` y ayuda con la ruta vigente.
La validación de esa corrección se registra al final del documento.

## 1. P1 · Las solicitudes bloqueadas consumen el cupo global de contacto

**Ubicación:** `server/contact.ts:109`, dentro de `RATE_SCRIPT`.

El script incrementa siempre los contadores de IP, remitente y límite global,
incluso si los primeros ya excedieron sus cuotas. Un mismo remitente puede hacer
51 solicitudes válidas dentro de la ventana: solo las primeras tres pueden ser
admitidas, pero el contador global llega a 51. Los visitantes nuevos también
reciben 429 hasta que expire la ventana global de una hora.

**Impacto:** si el endpoint está configurado y publicado, un único origen puede
impedir que otros visitantes usen el formulario sin llegar a enviar 50 mensajes.

**Corrección propuesta:** comprobar los límites antes de consumir la cuota
global y registrar la admisión de forma atómica. Mantener controles de abuso
por origen sin convertir solicitudes ya rechazadas en consumo global.

**Prueba necesaria:** ejecutar la lógica real del script contra Redis local o
un entorno compatible, saturar un origen y comprobar que otro conserva acceso.
Los tests actuales simulan la respuesta de Redis: no ejecutan el Lua. Este
hallazgo se deduce del código; no se hicieron solicitudes al servicio real.

## 2. P2 · Pausar con Escape puede hacer perder mensajes de IA

**Ubicaciones:** `src/game/Game.tsx:43` y `src/game/ui/GameHud.tsx:182`.

`useDialogue` recibe `paused: suspended`, condición usada al mostrar el portfolio
accesible. Sin embargo, el menú de pausa normal oculta el subtítulo mediante
`showMouseHint` sin detener su reloj. Al pausar durante una línea, esperar más
que su duración y volver, la línea ya venció. Como se marcó en `seen` al encolarla,
repetir la acción no la recupera.

**Impacto:** se pierden instrucciones mientras la propia interfaz dice que el
juego está pausado. También pueden consumirse mensajes pendientes de la cola.

**Corrección propuesta:** compartir una condición explícita de pausa del diálogo
con la visibilidad del menú. No confundirla con estar en una terminal, donde sí
deben seguir mostrándose y avanzando los mensajes.

**Prueba necesaria:** integración de menú + hook con reloj controlado: mostrar
una línea, pausar, avanzar el reloj, volver y comprobar el tiempo restante.
Las pruebas actuales verifican `paused` en el hook, pero no esta conexión con
el menú. No se reprodujo mediante Pointer Lock real en esta revisión.

## 3. P2 · Station Settings recomienda un atajo inexistente

**Ubicación:** `src/workstation/PersonalDesktop.tsx:277`.

La ayuda indica que Quick Portfolio Access está en la tablet mediante T y luego
R. El controlador actual no maneja R; `useStationControls.test.ts:17` verifica
explícitamente que se ignore. El visitante que sigue la instrucción permanece
con la tablet sostenida.

**Corrección propuesta:** indicar la ruta vigente: volver a caminar, abrir la
pausa con Escape y elegir **Read without 3D** para el portfolio DOM. El botón
**Quick Portfolio Access** de esa misma pausa abre el archivo dentro de la
experiencia 3D y no es equivalente a salir del renderer.

**Prueba necesaria:** comprobar que la ayuda describe una ruta disponible y
verificar la navegación mediante el control real, sin restaurar atajos por
accidente.

## Observaciones para la edición de diálogos

- El catálogo tiene 14 mensajes; `restored` no tiene disparador de producción.
- Los avisos de desbloqueo y apertura pueden ser reemplazados antes de mostrarse.
- Desactivar subtítulos no detiene ni reinicia la cola. Es una decisión que
  conviene revisar al reescribir la experiencia.
- Inventario completo: [ia-dialogos.md](ia-dialogos.md).

## Validación ejecutada

| Comprobación                                          | Resultado                                            |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Estado inicial de Git                                 | Limpio                                               |
| `npm run check`                                       | Se detuvo en formato; typecheck y lint habían pasado |
| `npm run test`                                        | 78 archivos, 258 pruebas aprobadas                   |
| `npm run build`                                       | Aprobado; aviso de chunk Game mayor de 500 kB        |
| Cotejo automatizado del inventario con `dialogue.ts`  | 14/14 IDs y textos exactos presentes                 |
| Formato de los documentos nuevos y `git diff --check` | Aprobados                                            |

El formato general reportó estos tres archivos preexistentes, que no se
modificaron para esta entrega:

- `docs/assets/cabin-master/assembly.json`
- `docs/assets/unified-ship/chairs-plants-refinement/audit.json`
- `docs/assets/unified-ship/consoles-orbit-refinement/audit.json`

El aviso del bundle no demuestra un problema de fluidez: falta medir carga y
tiempo de cuadro antes de proponer optimizaciones. No se ejecutaron E2E, pruebas
visuales, colisiones ni envíos reales de correo; no hubo cambios de runtime.
Las pruebas unitarias de controles emplean mocks y no prueban Pointer Lock nativo.

## Corrección posterior autorizada

- `CONTACT_RATE_SCRIPT` comprueba los tres límites antes de incrementar cualquier
  contador, dentro del mismo `EVAL`. Las solicitudes rechazadas no consumen cuota.
- `Game` pasa `suspended || controls.showMouseHint` al reloj de diálogos; una
  terminal abierta no lo pausa. No se modificaron textos ni duraciones de la IA.
- Station Settings explica la diferencia entre Read without 3D y el acceso al
  archivo dentro de la estación. Se actualizó su comprobación DOM.

Typecheck, lint, 258 pruebas unitarias y build aprobaron después de los cambios.
El formato global sigue señalando únicamente los tres JSON anteriores.
La nueva prueba de pausa en `e2e/dialogue.spec.ts` verifica con Pointer Lock real
que el subtítulo sobrevive a 11 segundos en el menú y vence al reanudar.
Esa prueba y la de navegación pausa/archivo aprobaron, sin errores de consola
ni excepciones. La segunda requirió sincronizar sus dos pulsaciones de T con
el estado visible de la tablet tras un fallo inicial; el reintento pasó.
Permanecen avisos de deprecación de Three/Rapier y precisión del shader.

La prueba `server/contactRateLimit.integration.ts` usa el script Lua real contra
Redis en loopback, con claves aisladas y sin correos. Se intentó ejecutarla,
pero falló el prerrequisito `redis-cli` (ENOENT); no se da por aprobada. Ejecutar
`node --test server/contactRateLimit.integration.ts` cuando Redis local esté
disponible. Cubre rechazo por remitente/IP sin consumo global, límite global y
expiración. Los tests HTTP existentes siguen usando transporte simulado.
