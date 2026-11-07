# Visión del portfolio

Un pequeño videojuego en primera persona que también funciona como portfolio profesional. El visitante explora una habitación de una nave espacial y descubre experiencia, proyectos, CV y contacto. El proyecto sirve para aprender gráficos 3D y desarrollo de juegos sobre una base de React y TypeScript.

La ambientación y los detalles son flexibles. Priorizamos una habitación pequeña, controles cómodos y versiones jugables antes de ampliar la experiencia.

## Estado y próximos hitos

| Hito               | Alcance                                              | Estado                                         |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------- |
| v0.1 Greybox       | Piso, paredes, cámara, WASD y mouse con Pointer Lock | Implementado; seguir verificando controles     |
| v0.2 Física        | Rapier, cápsula del jugador y colisiones             | Implementado; validar regresiones en navegador |
| v0.3 Interacciones | Mirada, distancia y tecla E                          | Pendiente                                      |
| v0.4 Computadora   | Interfaz de sistema ficticio y regreso al modo FPS   | Pendiente                                      |
| v0.5 Misiones      | Objetivos y progresión comprobable                   | Pendiente                                      |
| v0.6 Espacio       | Ventana, estrellas, planeta e iluminación            | Pendiente                                      |
| v0.7 Assets        | Sustituir volúmenes por modelos GLTF                 | Pendiente                                      |
| v0.8 Audio         | Ambiente e interacciones                             | Pendiente                                      |
| v0.9 Pulido        | Materiales, animación y rendimiento medido           | Pendiente                                      |
| v1.0 Portfolio     | CV, proyectos, experiencia, contacto y publicación   | Pendiente                                      |

El usuario confirmó que la entrada sin aceleración resolvió los tirones del mouse en Opera.

## Acceso a la información

La versión publicada debe ofrecer una alternativa rápida y accesible para quien no quiera o no pueda jugar, también sin WebGL. CV y contacto no deben depender de completar misiones. El aplazamiento inicial terminó con el GDD de CRUZ DEL SUR: Quick Portfolio Access ya permite consultar la información sin WebGL ni misiones.

## Etapa actual aprobada

Observatorio azul con ventanas y techo de vidrio, mesa central, silla y computadora. Se implementan sentarse, enfoque de pantalla y regreso a caminar; las aplicaciones internas quedan para más adelante. Estrellas en movimiento, planeta rotatorio y puerta trasera cerrada completan esta primera ambientación. La tabla de hitos describe el plan original: las bases de v0.3, v0.4 y v0.6 se adelantaron por pedido del usuario. No incorporar Zustand ni GSAP sin una necesidad concreta.

## CRUZ DEL SUR v1.0

El GDD en `gdd/CRUZ_DEL_SUR_GDD_v1.0.md` sustituye la secuencia histórica de hitos como fuente de verdad de producto. La fase actual implementa iluminación auxiliar, protocolo opcional persistente y tablet. Se preservan controles, colisiones y acceso libre a las estaciones. La fase 2 incorpora Quick Portfolio Access sin WebGL y Central Archive con contenido DOM compartido; la siguiente fase desarrolla la identificación de tripulación y el asistente. El backend de contacto queda para después por decisión del usuario; se prepararán los formularios sin simular envíos exitosos. Los assets complejos y la cinemática exterior quedan fuera de esta primera implementación funcional.

## Corrección de entrada y fase 3

La app arranca dentro de la estación sin pantalla para elegir recorrido. Tras encender luces, el HUD explica cómo omitir el tutorial visitando la computadora principal. El usuario requiere una animación inicial futura; queda pendiente y no se reemplaza por un menú. El acceso rápido es secundario en pausa/fallback. Fase 3 incorpora identificación provisional con tarjeta, retrato real, escaneo opcional con sonido y asistente textual descartable.
