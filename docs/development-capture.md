# Capturas en desarrollo

El archivo local `.env` contiene `DEV_MODE=true`. La plantilla `.env.example`
usa `false` para que el comportamiento sea opt-in. Vite debe reiniciarse si se
cambia ese valor; normalmente lo hace automáticamente al detectar el archivo.

Con el modo activo, cambiar de ventana u ocultar la pestaña libera Pointer Lock,
detiene los controles y oculta la pausa automática para permitir capturas. Volver
a la ventana no captura el mouse: hace falta un clic o una acción de reanudar.
Escape sigue abriendo la pausa explícita. Una pausa abierta intencionalmente
no se cierra por perder foco.

La opción se evalúa únicamente al servir desarrollo. `vite build` fuerza el
booleano a `false`, incluso con DEV_MODE=true o un mode personalizado. Servir en
mode production también lo desactiva. El cliente recibe un único booleano por
`define`; no se expone el resto de las variables del servidor ni se amplía el
prefijo público VITE_.

Las pruebas unitarias verifican ambos órdenes de blur/unlock, pérdida de
visibilidad, controles detenidos, ausencia de captura automática y Escape
explícito. No simulan una garantía de Pointer Lock real del navegador; esa
comprobación corresponde a la prueba nativa de integración.
