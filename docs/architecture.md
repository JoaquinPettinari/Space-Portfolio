# Arquitectura

## Base existente

Aplicación de navegador con Vite, React, TypeScript, Three.js, React Three Fiber, Drei y Rapier. npm gestiona dependencias y scripts. No se necesita un framework de servidor ni un motor adicional.

- `src/main.tsx` monta React.
- `src/App.tsx` compone la aplicación y su experiencia 3D.
- `src/game/Game.tsx` coordina Canvas, luces, carga de física, estado de entrada y controles de cámara.
- `src/game/world/Greybox.tsx` construye la habitación y muebles con cajas y cuerpos fijos; son volúmenes provisionales, no interacciones.
- `src/game/player/Player.tsx` conecta entrada, velocidad del cuerpo físico y posición de cámara. La cápsula invisible representa el volumen del jugador.
- `src/index.css` define presentación DOM y superposiciones.

Mantener esta estructura pequeña. Extraer funciones de movimiento y componentes DOM cuando permitan pruebas claras; no añadir servicios, eventos globales o un gestor de estado sin necesidad.

## Decisiones técnicas

Fiber traduce JSX de la escena a objetos Three.js; los menús siguen siendo DOM. La cámara representa la mirada y sigue al cuerpo físico. Rapier calcula las colisiones contra cuerpos fijos.

La velocidad horizontal depende de la mirada proyectada al piso. Normalizar el vector de entrada evita acelerar en diagonal. `setLinvel` recibe unidades por segundo; Rapier integra el desplazamiento con su paso de física. Multiplicar esa velocidad por delta sería aplicar el tiempo dos veces. Los desplazamientos manuales sí necesitan delta.

Guardar teclas y valores por cuadro en refs. Reservar estado React para cambios de interfaz o modo. Liberar Pointer Lock y limpiar entrada al perder foco; Escape debe permitir volver al menú.

La física usa un paso fijo. `useBeforePhysicsStep` establece velocidad; Rapier con prioridad -1 actualiza e interpola su Object3D; luego la cámara sigue un anclaje hijo en `useFrame`. Esto evita seguir posiciones discretas de `translation()` y no agrega suavizado a la rotación. Los saltos angulares del mouse físico siguen pendientes de reproducción. Tamaño del bundle y fluidez gráfica son métricas diferentes. `App` carga el módulo 3D con `React.lazy` tras una acción explícita, reduciendo la descarga inicial sin reducir por sí mismo el peso total.

`movement.ts` contiene el cálculo de velocidad sin dependencia de React ni física; `EntryMenu.tsx` contiene la presentación DOM. `GameDiagnostics.tsx` se importa únicamente en desarrollo y devuelve observaciones copiadas, nunca setters. El flujo de producto aún no incluye la alternativa accesible.

## Estrategia de pruebas

- **Vitest:** reglas puras existentes, dirección, teclas opuestas, diagonal y movimiento desactivado.
- **React Testing Library:** estados de carga, entrada y error del menú DOM. No comprobar semántica de la escena WebGL mediante selectores DOM.
- **Playwright con Chromium:** carga, menú, canvas, consola y excepciones; activación y liberación real de Pointer Lock, movimiento y colisiones cuando el navegador lo permita.
- **Observación del juego:** cuando sea necesaria, interfaz tipada y de solo lectura disponible en desarrollo/test, sin exposición en producción. No permitir teletransportes o cambios de estado para simular éxito.
- **Pendientes de producto:** interacción E, terminal, misiones, CV/contacto y alternativa accesible. Añadir pruebas cuando se implementen; no presentar escenarios inexistentes como aprobados.

Playwright Test proporciona regresiones repetibles. Playwright MCP permite inspección interactiva por el agente. Configurar un servidor no equivale a haber verificado su conexión. Los tests no dependen del MCP. Si Pointer Lock o WebGL quedan limitados por el navegador, informar el bloqueo y la comprobación manual necesaria.

## Verificación y documentación

Consultar scripts y comandos de desarrollo en `package.json` y `README.md`. Las puertas de calidad son typecheck, lint, formato, pruebas pertinentes, build y verificación del navegador para cambios que lo requieran. Este documento describe la estrategia, no certifica resultados de ejecución.

Las instrucciones permanentes y responsabilidades de roles están en `AGENTS.md`; la dirección del producto y los hitos están en `docs/vision.md`. Registrar resultados y limitaciones de cada entrega sin confundir inspección de código o capturas con pruebas funcionales.
