# CDS-01: integración de audio, etapa A

Fuente aprobada: [documento original](../CRUZ_DEL_SUR_CDS01_AUDIO_INTEGRATION_v1.md). Implementación: [manifest tipado](../../src/game/dialogueManifest.ts). Fecha: 21 de noviembre de 2026.

## Archivos y eventos

Los siete archivos suministrados existen en `public/audio/cds01/`. Se verificaron los frames MP3: MPEG-1 Layer III, mono, 44.100 Hz, 128 kbps, sin bytes residuales. Duraciones obtenidas de los frames; el navegador utiliza la duración real de sus metadatos cuando está disponible.

| Evento                   | Archivo real                            | Duración | Activación actual                                                                                                                 |
| ------------------------ | --------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `arrival`                | `IA_dialog_welcome_access.mp3`          | 19,409 s | Llegada con controles preparados; una vez por sesión.                                                                             |
| `crewVerified`           | `IA_dialog_access_granted.mp3`          | 3,318 s  | Callback de verificación de credenciales completada; la puerta conserva su apertura existente.                                    |
| `bridgeIntroduction`     | `IA_dialog_welcome_bridge.mp3`          | 9,796 s  | Cruce hacia la proa del punto medio del pasillo panorámico, caminando y dentro de sus límites; una vez.                           |
| `tacticalDiagnostics`    | `IA_dialog_table_result.mp3`            | 12,513 s | Entrar a la vista de la mesa táctica; muestra el informe y completa el objetivo, una vez por sesión.                              |
| `recoveryProcedureFound` | `IA_dialog_confirmation_files.mp3`      | 10,998 s | Desactivado: falta la lectura concreta de Recovery Procedures. Abrir el archivo profesional no equivale a este evento.            |
| `relayRestored`          | `IA_dialog_communications_restored.mp3` | 10,266 s | Desactivado: falta la reparación real del relé. Enviar/omitir el formulario no lo repara.                                         |
| `missionComplete`        | `IA_dialog_missions_completed.mp3`      | 12,042 s | Desactivado: falta la finalización narrativa y el relé restaurado. Completar las cinco tareas actuales no dispara esta grabación. |

El documento escribe `access_granated`; el archivo recibido se llama `access_granted`. Se conserva el nombre real, sin duplicarlo ni inventar una URL alternativa.

Las escenas 06, 07, 08, 10, 11, 12 y 14 no tienen una grabación suministrada. No se generaron audios ni rutas ficticias para ellas. Las ayudas existentes de tablet, archivo profesional, comunicaciones y dossier siguen siendo subtítulos sin grabación (`audioUrl: null`). Se retiraron las locuciones de las fases de energía y apertura de puerta.

## Reproducción y subtítulos

Un controlador posee el audio y el reloj del subtítulo activo. El sonido comienza apagado, como el ambiente existente, y comparte su botón Sound. Desactivar subtítulos no silencia la voz; desactivar sonido no oculta el texto. Activar sonido durante una frase continúa desde el tiempo transcurrido en lugar de repetirla desde el principio.

Pausa, suspensión y pestaña oculta congelan voz y reloj. Los eventos de buffering también detienen el reloj una vez iniciada la reproducción. Si el navegador rechaza `play()` o falla el archivo, el subtítulo sigue disponible; un clic real posterior permite reintentar un bloqueo de autoplay. Cambiar de frase, descartarla o desmontar limpia el audio, los listeners y los temporizadores.

Los eventos de mayor prioridad interrumpen; los restantes se encolan. Una frase ya vista no se vuelve a encolar durante esa sesión. Los tres eventos futuros se rechazan incluso si alguien intenta encolarlos directamente. La regla comprobable de finalización requiere ambos estados: historia completa y relé restaurado; no se crearon esos sistemas futuros.

La interfaz mínima identifica al asistente como CDS-01 y muestra actividad de voz a partir de reproducción real. No se rediseñó el HUD ni se añadieron requisitos al contacto, al CV o al contenido profesional.

## Verificación y límites

- Validación global: **275 pruebas en 85 archivos pasaron**. También pasaron
  cuatro E2E de Chromium: audio nativo, pausa de subtítulos, acreditación/tablet
  y cruce del pasillo. No es una ejecución de toda la suite E2E.
- La revisión detectó que el checkpoint era más estrecho que el pasillo: se
  deriva ahora del perfil físico compartido y la regresión unitaria verifica
  cruces laterales en ambos lados. Esa prueba se volvió a ejecutar tras el ajuste.
- El chequeo global de formato encontró tres JSON históricos ajenos a esta
  integración; los archivos de esta entrega se comprobaron por separado.

- Ejecutadas: 18 pruebas unitarias/DOM en seis archivos (`dialogue`, `dialoguePlayback`, `useDialogue`, `passageDialogue`, `AmbientAudio`, `StationAssistant`): todas pasaron.
- Ejecutados `npm run typecheck`, `npm run lint` y `npm run build`: pasaron en la validación global del agente principal.
- Aplicado Prettier a los archivos modificados. ESLint acotado no mostró errores; se corrigieron dos advertencias de dependencias mediante un alias explícito del mensaje.
- Las pruebas incluyen prioridad, eventos futuros desactivados, cruce direccional acotado, pausa/visibilidad, reloj independiente de sonido, buffering, rechazo de reproducción, limpieza y la carrera entre promesas antiguas de `play()` y una reanudación posterior.
- Las pruebas E2E existentes se adaptaron a las nuevas duraciones y eventos, eliminando la expectativa incorrecta de una misión narrativa completada por las cuatro tareas anteriores. La comprobación E2E con Audio nativo pasó: decodificó los siete MP3, observó avance real de reproducción, pausa/reanudación con Escape e independencia entre sonido y subtítulos. No utiliza un mock de reproducción. Las restantes regresiones de navegación se informan por separado.
- **Pendiente de revisión auditiva humana:** coincidencia palabra por palabra entre cada grabación y el texto aprobado. Se comprobaron archivos, formato y duración, no una transcripción. Los subtítulos provienen del documento aprobado; no se afirma que el audio haya sido transcrito.

## Organización

`dialogueManifest.ts` centraliza guiones, archivos, duraciones, prioridades y disponibilidad. `dialogue.ts` conserva las reglas puras de cola. `dialoguePlayback.ts` gestiona medios y tiempo. `useDialogue.ts` conecta su ciclo de vida con React y la visibilidad. `PassageDialogueCheckpoint.tsx` observa la posición real de la cámara usando refs, con el cruce definido en `passageDialogue.ts`. `Game.tsx` enlaza únicamente callbacks existentes y el checkpoint. `AmbientAudio`, `GameHud` y `StationAssistant` conectan sonido y presentación sin duplicar reglas.

## Subtítulos por frases (21 de noviembre)

La pantalla ahora recibe una frase breve del diálogo, no el guion completo. La llegada tiene siete cortes editoriales explícitos y la bienvenida al puente tres. Las demás líneas se segmentan por puntuación y un máximo de 76 caracteres. Concatenar las frases conserva exactamente el texto aprobado, comprobado para todo el manifest.

Los tiempos son **estimaciones ajustables proporcionales a la longitud de cada frase**, distribuidas sobre la duración del archivo; no son marcas de transcripción ni se afirma sincronización palabra por palabra. `captionPhrases` permite ajustar los cortes editoriales y `dialogueCaptions.ts` centraliza la estimación. La calibración auditiva sigue pendiente.

Los cambios de frase usan el mismo reloj del controlador de reproducción: tiempo real del medio cuando suena y tiempo transcurrido cuando está silenciado o bloqueado. Se reajustan al recibir metadatos, `timeupdate` y `seeked`; pausa, buffering y pestaña oculta mantienen la frase. Solo se publica estado React al cambiar la frase. Hay un temporizador para el siguiente corte y otro para finalizar la línea, ambos limpiados al pausar o desmontar; no existe un segundo audio ni un bucle de renderizado.

Validación de esta ampliación: 16 pruebas pasaron en cuatro archivos (`dialogueCaptions`, `dialoguePlayback`, `useDialogue`, `dialogue`), incluyendo conservación literal, límites de frases, avance, pausa, seek, duración real, silencio y limpieza. La validación visual del tamaño estable y E2E se realiza junto con los cambios de presentación.

La presentación comparte ancho, fuente, padding y columnas entre exploración y
terminal, reservando dos líneas y el espacio del botón de cierre incluso cuando
no aparece. Chromium comprobó avance de frases y medidas idénticas antes de
acercarse, frente a Crew Access, dentro del terminal y al salir. El E2E de audio
nativo también pasó, sin errores de consola ni excepciones. Validación global de
esta pasada: 279 pruebas en 86 archivos, typecheck, lint y build correctos.
El formato de los archivos cambiados pasa; el chequeo global sigue señalando los
tres JSON históricos de cabina/unified-ship mencionados arriba.
