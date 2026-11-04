# Space Portfolio: instrucciones de desarrollo

## Alcance y comunicación

- Portfolio 3D de una habitación, construido incrementalmente. Consultar `docs/vision.md` y `docs/architecture.md`.
- Explicar conceptos nuevos de gráficos, vectores, física, cámara y GPU en español; el usuario ya conoce React y TypeScript.
- Preservar el trabajo existente y los cambios sin confirmar. No modificar archivos ajenos al objetivo ni eliminar trabajo sin autorización.
- La etapa B de configuración está aprobada. La alternativa accesible sigue siendo requisito del producto, pero su implementación está aplazada por el usuario. No implementar hitos futuros durante tareas de infraestructura.

## Diseño y código

- Preferir soluciones simples, composición, módulos enfocados y nombres claros. Aplicar SOLID cuando aporte valor; no construir un motor de juegos propio ni capas preventivas.
- Usar TypeScript estricto. Evitar `any`; justificar cualquier excepción. No duplicar reglas de juego.
- Conservar npm y la configuración funcional. Explicar el propósito de cada dependencia nueva; Zustand y GSAP requieren una necesidad concreta.
- Usar componentes funcionales. Separar presentación, entrada y reglas cuando facilite su comprensión o prueba. Mantener hooks enfocados y evitar estado y renders innecesarios.
- Usar elementos DOM accesibles para menús e información profesional.

## Escena, física y controles

- Usar `useFrame` para actualizaciones por cuadro y refs/objetos reutilizados para valores de alta frecuencia. No actualizar estado React ni crear objetos innecesarios en cada cuadro.
- Para desplazamientos integrados manualmente, multiplicar velocidad por delta. `Rapier.setLinvel` recibe velocidad en unidades por segundo: **no multiplicarla por delta**, porque Rapier integra el tiempo.
- Mantener movimiento independiente de FPS, normalizar diagonales y separar geometría visual de colisiones cuando resulte útil.
- Separar entrada de las reglas de movimiento. Limpiar teclas al perder foco, ocultar la página o liberar Pointer Lock. Menús abiertos deben detener controles de juego.
- Permitir Escape y liberación del cursor; nunca atrapar al visitante. Probar entrada, salida y reentrada en Pointer Lock.
- Preferir estados explícitos para modos nuevos. Mantener futuras misiones e interacciones comprobables sin WebGL y deterministas cuando sea práctico.
- Limpiar listeners y recursos propios al desmontar; respetar la gestión de recursos de Fiber y los recursos compartidos.

## UX y rendimiento

- Mantener instrucciones claras de teclado y mouse; considerar movimiento reducido.
- La versión publicada debe permitir omitir el juego y acceder a CV, proyectos y contacto sin misiones ni WebGL. Documentar esta deuda mientras esté aplazada.
- Medir antes de optimizar. Distinguir tamaño de descarga, tiempo de carga, tiempo de cuadro, draw calls y memoria GPU; un bundle pequeño no prueba fluidez.
- Evitar texturas/modelos sobredimensionados, luces y sombras costosas y postprocesado prematuro. Usar carga diferida cuando tenga una ventaja comprobable.
- Interfaces de observación para pruebas: tipadas, de solo lectura, sin datos sensibles, disponibles solo en desarrollo/test y ausentes de producción. No introducir atajos que eviten el comportamiento real.

## Pruebas y entrega

1. Inspeccionar el código pertinente y el estado de Git antes de cambiarlo.
2. Explicar el enfoque de cambios no triviales y sus sistemas afectados.
3. Implementar el cambio mínimo mantenible; añadir pruebas de comportamiento relevantes.
4. Ejecutar typecheck, lint, formato, pruebas pertinentes y build usando los scripts de `package.json`.
5. Para cambios de navegador/3D, verificar consola y excepciones y realizar comprobación funcional y visual cuando sea posible. Una captura no demuestra movimiento ni colisiones.
6. Revisar el diff, actualizar documentación necesaria y reportar comandos ejecutados, resultados, límites y comprobaciones manuales pendientes.

Nunca declarar que una prueba pasó sin ejecutarla correctamente. No ocultar fallos ni convertir funciones inexistentes en pruebas que pasan. Marcar explícitamente verificaciones bloqueadas o pendientes. No afirmar que un mock de Pointer Lock prueba Pointer Lock real. Las pruebas automatizadas no deben depender del servidor MCP.

## Roles especializados

Los roles se definen en `.codex/agents/`. Usarlos para subtareas acotadas cuando aporten valor; no ejecutar los cuatro para cada edición. La disponibilidad real depende de que la sesión cargue la configuración.

- `architecture_reviewer`: corrección, límites de componentes, TypeScript, duplicación y complejidad; revisión de solo lectura por defecto.
- `gameplay_engineer`: controles, cámara, física, interacción y explicación de conceptos 3D dentro del alcance solicitado.
- `qa_engineer`: pruebas unitarias, DOM y E2E, regresiones, consola y evidencia verificable.
- `graphics_performance`: mediciones reproducibles de renderizado, recursos y carga antes de optimizar.
