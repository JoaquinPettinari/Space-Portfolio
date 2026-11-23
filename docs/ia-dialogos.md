# Diálogos de la IA de CRUZ DEL SUR

> **Inventario histórico del 17-11-2026.** La integración Stage A del 21-11-2026
> sustituye estos disparadores y textos. Consultar [estado actual CDS-01](audio/cds01-stage-a.md)
> y `src/game/dialogueManifest.ts`; las cantidades y el rótulo descritos abajo ya no son vigentes.

Inventario del código actual, revisado el 17 de noviembre de 2026. Documento
de trabajo para reescribir los textos y decidir sus nuevos disparadores.
No modifica el comportamiento de la app.

## Alcance

Hay **14 mensajes definidos: 13 conectados a eventos y 1 sin disparador actual**.
Son subtítulos predefinidos en inglés, identificados con el rótulo **IA**. No hay
generación de respuestas mediante un modelo ni voz sintetizada para estas líneas.
La onda que acompaña el texto es un SVG decorativo; música y sonidos de interacción
son sistemas separados.

Fuente de textos y duraciones: [dialogue.ts](../src/game/dialogue.ts).
Disparadores: [Game.tsx](../src/game/Game.tsx).

## Catálogo completo

Los tiempos indican la duración configurada desde que el mensaje pasa a ser el
actual. No son retrasos desde la acción: puede haber cola o reemplazo anticipado.

### 01 · `arrival` — Bienvenida · 10 segundos

> Welcome aboard CRUZ DEL SUR. Docking complete. Arrival systems online. Verify your credentials at Crew Access beside the secured bulkhead to enter the bridge.

- **Cuándo:** cuando `controls.ready` pasa a verdadero, al estar lista la escena.
- **Acción del visitante:** ninguna; no espera la primera captura del mouse.
- **Observación:** puede ser reemplazado por un aviso posterior de la puerta.

### 02 · `restored` — Luces restauradas · 6,5 segundos · INACTIVO

> Interior lighting online. Identify yourself at Crew Access to open the bridge bulkhead. Quick Portfolio Access remains available in your tablet.

- **Cuándo:** actualmente **nunca** desde el flujo de producción. Existe en el
  catálogo y en pruebas, pero no hay llamada que lo encole.
- **Contexto:** el protocolo arranca con `lighting` completado. No debe tratarse
  como un diálogo que el visitante escucha actualmente al encender luces.
- **Para revisar:** la frase sobre Quick Portfolio Access en la tablet puede
  pertenecer a un diseño anterior; no asumir que describe la interfaz vigente.

### 03 · `unlocking` — Desbloqueo · 4 segundos como máximo

> Bulkhead unlocking.

- **Cuándo:** la puerta pasa de `closed` a `unlocking`, tras la acreditación o
  una solicitud de apertura autorizada.
- **Condición:** `requestBridgeAccess` exige acreditación y puerta cerrada.
- **Tiempo físico:** el desbloqueo dura 0,35 s normalmente. El mensaje puede ser
  reemplazado por `opening` antes de agotar sus 4 s, o desaparecer de la cola.

### 04 · `opening` — Puerta en movimiento · 4 segundos como máximo

> Bulkhead opening. Keep clear of the moving leaves.

- **Cuándo:** la puerta entra en fase `opening`, después del desbloqueo.
- **Tiempo físico:** la apertura dura 1,4 s normalmente. `open` reemplaza este
  aviso si sigue visible o pendiente. Con movimiento reducido las fases avanzan
  sin esperar esas duraciones completas.

### 05 · `open` — Puerta abierta · 6 segundos

> Bulkhead open. Explore freely. All professional records remain available at the Central Archive.

- **Cuándo:** la puerta alcanza la fase `open`.
- **Condición:** no depende de que la guía de misiones esté activa.
- **Observación:** puede quedar detrás de `identity` u otro mensaje no relacionado
  con la secuencia de entrada; no tiene prioridad absoluta sobre toda la cola.

### 06 · `tabletPrompt` — Invitación a abrir la tablet · 4 segundos

> Press T to open your mission tablet.

- **Cuándo:** puerta abierta, actividad `tablet` todavía sin completar y guía
  distinta de `skipped`.
- **Acción esperada:** presionar T para levantar la tablet.
- **Supresión:** no se admite si ya se admitió `tablet`. Abrir la tablet elimina
  este aviso pendiente o lo reemplaza si era el actual.

### 07 · `tablet` — Explicación de la guía · 10 segundos

> Mission guidance is optional. Explore at your own pace. For professional information, visit the Central Archive at any time.

- **Cuándo:** el callback `onTabletOpened` se ejecuta al abrir la tablet, por
  teclado o mediante el control de apertura correspondiente.
- **Condición:** la guía no debe estar en `skipped`. Abrirla igualmente registra
  la actividad `tablet`, aunque no se encole este texto.
- **Repetición:** solo se admite una vez durante la sesión del componente.

### 08 · `identity` — Identificación aprobada · 6,5 segundos

> Identity verified. Welcome aboard, Engineer. Your personnel record is available.

- **Cuándo:** finaliza la animación de acreditación de Crew Access y se ejecuta
  `onIdentityVerified`. Se completa `crew` y se solicita abrir la puerta.
- **Secuencia:** apuntar al lector y presionar E; terminar el enfoque de cámara;
  presentar la tarjeta; completar la verificación.
- **Tiempo:** el gesto/verificación dura 1 s después del enfoque, con contacto
  a los 0,5 s. No equivale a 1 s desde presionar E. Movimiento reducido acorta
  el gesto; las pausas del lector también afectan el tiempo real.

### 09 · `archives` — Archivos revisados · 5 segundos

> Expedition archive reviewed. All records remain available at the main computer.

- **Cuándo:** Central Archive informa actividad `archives` o el alias histórico
  `diagnostics`, y `archives` aún no estaba completado.
- **Acciones:** consultar Service Record o abrir un proyecto en las vistas del
  archivo que notifican esa actividad.
- **No se dispara:** por el mero hecho de entrar al menú inicial del archivo.
  Quick Portfolio Access usa el contenido sin callback de misiones, así que sus
  acciones no generan este diálogo de la sesión 3D.

### 10 · `communications` — Presentación del contacto · 9 segundos

> Earth Communications. Messages are welcome in Spanish, English, Italian or Norwegian. Send Transmission sends a real message; Skip sends no email.

- **Cuándo:** modo `communications` y transición de cámara terminada.
- **Acción:** entrar a la terminal Earth Communications.
- **No depende:** de enviar el formulario ni de completar una misión previa.
- **Repetición:** volver a entrar no repite el mensaje en esa sesión.

### 11 · `transmissionAccepted` — Envío aceptado · 5 segundos

> Transmission accepted by the email provider.

- **Cuándo:** el formulario de la terminal recibe una respuesta HTTP exitosa de
  `/api/contact` con `accepted: true`, y notifica `accepted`.
- **Efecto asociado:** completa el objetivo `uplink`.
- **No se dispara:** al pulsar Send Transmission, abrir un enlace de correo,
  recibir un error o agotar el tiempo de espera. Aceptación no prueba entrega
  final ni lectura del destinatario.
- **Ámbito:** el formulario de Quick Portfolio Access no conecta este callback
  con la IA del juego.

### 12 · `transmissionSkipped` — Contacto omitido · 5 segundos

> Communications objective complete. No email was sent.

- **Cuándo:** pulsar Skip en el formulario de la terminal.
- **Efecto asociado:** completa `uplink` sin enviar correo.
- **Nota:** aceptar un envío y omitirlo tienen IDs distintos. Es posible que
  ambos textos se admitan durante una sesión si luego se realiza la otra acción;
  no son variantes de un único ID mutuamente excluyente.

### 13 · `dossier` — Objetivo del CV completado · 7 segundos

> Dossier objective complete. Your CV remains available at the Personal Workstation and Central Archive.

- **Cuándo:** se informa actividad `dossier`.
- **Acciones:** abrir/descargar el PDF o elegir Skip dossier en Personal
  Workstation; usar los enlaces de CV de Central Archive; activar la interacción
  de dossier que llama a `downloadDossier` desde el mundo.
- **Precisión:** se registra la acción sobre el enlace, no la finalización de
  una descarga. Solo abrir el icono/aplicación Crew Dossier.pdf no lo completa.
- **Ámbito:** los enlaces del portfolio accesible no notifican a esta IA.

### 14 · `complete` — Protocolo completo · 8 segundos

> Recovery protocol complete. All station facilities are available. Enjoy your stay aboard CRUZ DEL SUR.

- **Cuándo:** están completados los cuatro objetivos actuales: `crew`,
  `archives`, `uplink` y `dossier`.
- **Condición:** los indicadores internos `lighting` y `tablet` no forman parte
  de esos cuatro objetivos. Omitir contacto o dossier también puede completarlos.
- **Guía omitida:** este aviso no comprueba `guidance`; puede aparecer igualmente.
- **Cola:** no interrumpe automáticamente el mensaje de la última actividad.

## Reglas que afectan lo que realmente se ve

1. **Una vez por sesión del componente.** `seen` registra el ID al encolarlo,
   no cuando el visitante termina de leerlo. Reabrir una estación no lo repite.
   Recargar/remontar Game reinicia la lista. Abrir el portfolio accesible conserva
   Game suspendido y no reinicia los diálogos.
2. **Un mensaje actual y una cola.** Los mensajes normales esperan su turno.
   No hay retraso de diálogo específico de 0,5 s; ese tiempo pertenece al contacto
   físico del gesto de acreditación.
3. **Entrada progresiva.** Orden especial: `arrival → restored → unlocking →
opening → open`. Un evento nuevo de ese grupo elimina los pendientes del
   mismo grupo y reemplaza al actual si también pertenece al grupo. Los eventos
   anteriores a uno ya admitido se descartan.
4. **No se garantiza ver cada fase.** Durante `identity`, los avisos rápidos
   `unlocking` y `opening` pueden ser sustituidos en la cola por `open`.
5. **Pausa real del reloj.** Se detiene con Game suspendido por Quick Portfolio
   Access o con la pestaña oculta. Conserva el tiempo restante.
6. **Pausa con Escape.** El menú oculta el overlay mediante `showMouseHint` y
   detiene el reloj del diálogo. Al volver se conserva el tiempo restante.
   Esta conexión se corrigió después del inventario inicial; los textos no cambiaron.
7. **Subtítulos desactivados.** El ajuste oculta el texto, pero no frena la cola
   ni borra `seen`. Activarlos después no recupera mensajes ya vencidos.
8. **Omitir la guía no silencia toda la IA.** Suprime los avisos de tablet bajo
   las condiciones indicadas. Identidad, puerta, actividades y cierre mantienen
   sus disparadores; no se limpia automáticamente la cola.
9. **Cierre manual.** Se ofrece el botón Dismiss message cuando el modo es
   `walking` y `tabletOpen` es falso. En terminales el cierre es por tiempo.
   Actualmente `tabletOpen` es una constante falsa en los controles: la tablet
   sostenida se representa mediante `tabletMode`.
10. **No hay conversación ramificada.** Las decisiones Send/Skip generan eventos;
    no existe un diálogo de preguntas/respuestas con la IA.

## Textos cercanos que no son diálogos de IA

No se incluyen como mensajes hablados: objetivos del HUD, instrucciones de teclas,
pantallas del lector, estados/errores del formulario, respuestas de Command
Terminal, etiquetas de pantallas 3D y rótulos horneados en los modelos.
Se editan en sus respectivos componentes, no en `dialogueMessages`.

## Mapa de archivos para la próxima edición

| Qué cambiar                                         | Fuente                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Texto exacto, duración, deduplicación y prioridades | [dialogue.ts](../src/game/dialogue.ts)                                                                       |
| Momento de encolado y conexión con misiones         | [Game.tsx](../src/game/Game.tsx)                                                                             |
| Temporizador y pausas                               | [useDialogue.ts](../src/game/useDialogue.ts)                                                                 |
| Rótulo IA, onda y botón de cierre                   | [StationAssistant.tsx](../src/game/ui/StationAssistant.tsx)                                                  |
| Posición y visibilidad del overlay                  | [GameHud.tsx](../src/game/ui/GameHud.tsx)                                                                    |
| Apertura de tablet y estados de control             | [useStationControls.ts](../src/game/useStationControls.ts)                                                   |
| Objetivos y progreso                                | [missions.ts](../src/game/missions.ts), [protocol.ts](../src/game/protocol.ts)                               |
| Gesto de acreditación                               | [CrewAccess.tsx](../src/game/world/CrewAccess.tsx), [identification.ts](../src/game/world/identification.ts) |
| Fases y tiempos de puerta                           | [bulkhead.ts](../src/game/world/bulkhead.ts)                                                                 |
| Acciones de archivo                                 | [PortfolioContent.tsx](../src/portfolio/PortfolioContent.tsx)                                                |
| Envío y omisión del contacto                        | [ContactForm.tsx](../src/contact/ContactForm.tsx)                                                            |
| Apertura/descarga/omisión de CV                     | [PersonalDesktop.tsx](../src/workstation/PersonalDesktop.tsx)                                                |

Pruebas existentes relevantes: `dialogue.test.ts`, `useDialogue.test.ts`,
`StationAssistant.test.tsx`, pruebas de misiones, acreditación, puerta y contacto.
Este inventario distingue la lectura del código de una comprobación en navegador:
no se ha recorrido cada diálogo manualmente para producir este documento.
