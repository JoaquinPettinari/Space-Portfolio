# Space Portfolio — Greybox FPS

## Ejecutar

- `npm install`
- `npm run dev`: abrir la URL local en un navegador de escritorio.
- `npm run lint`, `npm run format:check`, `npm run build`: controles de calidad.
- `npm run typecheck`: TypeScript estricto para aplicación, herramientas y E2E.
- `npm test`: Vitest y pruebas DOM con React Testing Library.
- `npm run test:e2e`: Chromium contra Vite en el puerto 4173; inicia y detiene su servidor.
- `npm run test:e2e:production`: compila y prueba producción en el puerto 4174.
- `npm run test:e2e:headed`: diagnóstico visible en Chromium.
- `npm run check`: tipos, lint, formato, tests unitarios/DOM y build. Ejecutar E2E por separado.

Después de clonar: `npm ci` y `npx playwright install chromium`.

## Controles

Pulsar **Entrar / continuar**, caminar con **WASD**, mirar con el **mouse** y pulsar **Escape** para liberar el cursor y pausar. Al perder foco se libera el mouse y se limpian las teclas. Por ahora requiere teclado y mouse.

Primero pulsar **Cargar experiencia 3D**. Esto difiere la descarga de Three.js y Rapier. No es la alternativa accesible del portfolio, que está aplazada.

## Estructura

- `src/App.tsx`: contenedor de la aplicación.
- `src/game/Game.tsx`: Canvas, luces, física, captura del mouse y menú.
- `src/game/world/Greybox.tsx`: piso, cuatro paredes y muebles provisionales.
- `src/game/player/Player.tsx`: teclado, movimiento y cápsula física del jugador.

## Qué estamos aprendiendo

**Coordenadas:** una unidad representa un metro; Y es altura. La habitación tiene 10 × 10 metros interiores y paredes de 3 metros. Los bloques se posicionan por su centro. El piso ahora es una caja con grosor para darle un volumen de colisión.

**Mesh y collider:** el mesh es lo visible; el collider es el volumen que usa Rapier para resolver contactos. Los muebles y paredes usan cuerpos `fixed` con colliders cúbicos. El jugador usa una cápsula dinámica con rotaciones bloqueadas para no volcarse.

**Pointer Lock:** Drei captura el mouse después de un clic explícito para orientar la cámara sin llegar al borde de la pantalla. Escape libera la captura. No todos los navegadores embebidos permiten esta API: probar en Chrome, Edge o Firefox de escritorio si falla.

**Vectores:** obtenemos la dirección de la cámara, quitamos su componente vertical y calculamos una perpendicular para desplazarnos lateralmente. Normalizamos el vector combinado para que las diagonales tengan la misma velocidad. Se reutilizan vectores mediante refs para evitar crearlos en cada cuadro.

**Bucle:** `useBeforePhysicsStep` actualiza la velocidad antes de cada paso de Rapier. La física corre con prioridad -1; después `useFrame` sigue un anclaje interpolado del cuerpo. Seguir `body.translation()` directamente producía posiciones discretas a 60 Hz y podía causar tirones entre cuadros. La velocidad es de 3 metros/segundo y Rapier integra el tiempo con pasos de 1/60 s; no multiplicamos `setLinvel` por delta. Si moviéramos una posición manualmente, usaríamos desplazamiento = velocidad × delta.

**Estado:** React administra menú y captura; las refs guardan teclas y objetos que cambian continuamente. No actualizamos estado React por cada cuadro.

## Comprobación manual

1. Entrar y comprobar mouse y WASD.
2. Mantener W frente al escritorio: debe impedir atravesarlo.
3. Caminar contra las cuatro paredes y las cajas; probar también las esquinas en diagonal.
4. Comparar movimiento frontal y diagonal: misma velocidad.
5. Pulsar Escape mientras se camina: debe aparecer el menú y detenerse.
6. Volver a entrar sin tocar teclas: no debe seguir caminando.
7. Cambiar de pestaña mientras se camina y volver: debe quedar pausado.

Verificado con Chromium de Playwright: Pointer Lock real, rotación con movimientos pequeños, Escape/reentrada, movimiento, parada en espacio libre y colisiones contra escritorio y pared lateral. No hay mocks ni teletransportes. Los saltos angulares intermitentes del mouse del usuario todavía requieren comprobación en su equipo; estas pruebas no certifican ese hardware.

## Agentes y MCP

`AGENTS.md` contiene las reglas duraderas. `.codex/agents/` define `architecture_reviewer`, `gameplay_engineer`, `qa_engineer` y `graphics_performance`. Sus TOML están validados; su selección automática en una nueva sesión no se ha verificado. Reabrir el proyecto/sesión si no aparecen. No se cambiaron modelos ni permisos globales.

`.codex/config.toml` registra Playwright MCP por proyecto confiable. `playwright.mcp.config.json` selecciona un perfil aislado y Chromium Headless Shell: el canal Chrome for Testing falló con `spawn UNKNOWN` en esta instalación Windows. No se desactivaron protecciones del sistema para resolverlo.

Desde la raíz del repositorio:

```powershell
npx @playwright/mcp install-browser chrome-for-testing
codex mcp list
npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
# En otra terminal:
node scripts/verify-mcp.mjs http://127.0.0.1:4175
```

El MCP y el runner pueden necesitar revisiones distintas de Chromium. Se verificaron handshake MCP, listado de herramientas, navegación, clic, captura y lectura de consola por STDIO. La sesión de Codex actual no añade herramientas dinámicamente: reiniciar su conexión MCP o abrir otra sesión para usarlas directamente. Los tests no dependen del MCP. Referencias: [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp), [agentes](https://learn.chatgpt.com/docs/agent-configuration/subagents), [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp).

## Observación y resultados de esta configuración

En desarrollo, `window.__GAME_DEBUG__.snapshot()` devuelve copias de posición/rotación de cámara, captura del cursor, último delta del mouse, draw calls, triángulos y tiempo del último cuadro. No modifica el juego. La importación está excluida en producción y se comprueba con una prueba contra el build.

- Typecheck, lint, formato, 7 pruebas unitarias/DOM y build: ejecutados correctamente.
- 4 escenarios Chromium de desarrollo y 1 escenario de producción: ejecutados correctamente.
- Capturas: `artifacts/station-menu.png`, `artifacts/station-desk.png` y `artifacts/mcp-station.png` (ignoradas por Git).
- Sin errores de consola ni excepciones inesperadas en esos escenarios. Persisten advertencias de deprecación de Three.Clock e inicialización Rapier; MCP además registró advertencias ReadPixels del controlador gráfico al capturar.
- JS inicial: de 3.356 kB / 1.150 kB gzip a 193 kB / 61 kB gzip aproximadamente. Módulo 3D diferido: 3.162 kB / 1.089 kB gzip. El aviso de chunk grande sigue visible: diferir carga no reduce todo el motor ni garantiza FPS.
- Actualización compatible de Vite a 8.3.5 y parches transitivos de seguridad. `npm audit` sigue reportando 13 avisos moderados relacionados con minimatch en herramientas de lint; no se aplicó `--force` ni downgrades incompatibles.

Pendientes: alternativa accesible, validación manual del mouse físico, medición sostenida de frame time en hardware real y optimización de assets cuando existan. Visión en `docs/vision.md`; decisiones en `docs/architecture.md`.

## Siguiente etapa

Raycasting desde el centro de la cámara, distancia máxima de interacción y tecla E sobre la computadora. Luego construiremos la interfaz del terminal. Todavía no hay salto, controles táctiles, modelos finales ni misiones.

Referencias: https://r3f.docs.pmnd.rs/api/hooks · https://drei.docs.pmnd.rs/controls/introduction · https://github.com/pmndrs/react-three-rapier
