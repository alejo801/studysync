# Bitácora de uso de IA

Proyecto: StudySync.AI
Estudiante: Luis Alejandro Perez Ordoñez
Funcionalidad: HU-01 Extraer información de una tarea a partir de un mensaje
Asistente usado: Claude (chat)

## Entradas

### Entrada 1

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso organizar el historial en pruebas en rojo, implementación en verde y refactor.
- **Decisión:** Aceptada
- **Por qué:** Demuestra el proceso TDD que pide el docente.
- **Verificación:** `git log --oneline` muestra las pruebas antes de la implementación.
- **Commit relacionado:** fa91b3e

### Entrada 2

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** Para comprobar que las pruebas fallan sin implementación, eliminar temporalmente `src/extraerTarea.ts`.
- **Decisión:** Aceptada con cambios
- **Por qué:** Borrar el archivo ponía en riesgo el código que ya funcionaba. Hice una copia de seguridad y commiteé primero solo `tests/`.
- **Verificación:** [COMPLETAR: qué viste al correr `npm test` sin `src/`]
- **Commit relacionado:** fa91b3e

### Entrada 3

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** Al revisar `git show --stat HEAD`, el asistente detectó que el commit de implementación arrastró `package.json`, `package-lock.json` y `tsconfig.json`, y propuso separarlo con `git reset HEAD~1`.
- **Decisión:** Aceptada
- **Por qué:** Cada commit debe tener un solo propósito.
- **Verificación:** El commit de implementación pasó de 4 archivos a 1 (solo `src/extraerTarea.ts`, 120 líneas) y `npm test` sigue con 10 de 10.
- **Commit relacionado:** 8d2e940 (configuración) y be03ba2 (implementación)

### Entrada 4

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente vio que `git diff package.json` solo cambiaba TypeScript de 7.0.2 a 6.0.3 y recomendó commitearlo aparte.
- **Decisión:** Aceptada
- **Por qué:** Es un cambio de configuración, no de funcionalidad.
- **Verificación:** `git --no-pager diff -- package.json` mostró únicamente ese cambio.
- **Commit relacionado:** 8d2e940

### Entrada 5

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente detectó caracteres como `CÃ¡lculo` y recomendó guardar los archivos como UTF-8.
- **Decisión:** Aceptada
- **Por qué:** La codificación dañaba comentarios y mensajes de error.
- **Verificación:** [COMPLETAR cuando lo corrijas: cómo confirmaste que las tildes se ven bien]
- **Commit relacionado:** [COMPLETAR: hash del commit de refactor]

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 4 |
| Aceptadas con cambios | 1 |
| Rechazadas | 0 |

## Errores que atraparon las pruebas

En la fase roja del TDD, antes de existir `src/extraerTarea.ts`, ejecuté `npm test` sobre el commit de pruebas (fa91b3e) y falló con el error `Cannot find module '../src/extraerTarea'`, lo que confirmó que las pruebas dependen de la implementación y que no pasan por accidente. Después de implementar la función (be03ba2), las 10 pruebas pasaron. No encontré errores de lógica en el código al ejecutarlas, pero las pruebas de los límites de urgencia (exactamente 48 horas es media, un minuto menos es alta, un minuto más de 7 días es baja) protegen los casos donde es más fácil equivocarse al comparar fechas.

## Reflexión final (5 a 8 líneas)

La ayuda de la IA fue clave para entender cómo aplicar TDD de verdad en Git. Me guio para armar commits atómicos —uno para la configuración, otro para las pruebas y otro para el código— y pilló detalles finos como un archivo arrastrado por error y la codificación UTF-8 que yo no había visto. La lección principal fue que el valor no está solo en que el test pase, sino en que el historial cuente la historia correcta. Aprendí a usar git show --stat para verificar cada cambio antes de confirmar. En el próximo módulo, arrancaré directo con el commit en rojo y revisaré la codificación del editor desde el minuto uno.