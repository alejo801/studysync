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
- **Por qué:** Borrar el archivo ponía en riesgo el código que ya funcionaba. En su lugar commiteé primero solo `tests/` y ejecuté las pruebas sobre ese commit.
- **Verificación:** `npm test` sobre fa91b3e falló con `Cannot find module '../src/extraerTarea'`.
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
- **Prompt o sugerencia:** El asistente afirmó que los archivos tenían la codificación dañada (`CÃ¡lculo`) y recomendó guardarlos de nuevo como UTF-8.
- **Decisión:** Rechazada
- **Por qué:** Los caracteres raros aparecían al leer los archivos con `Get-Content` en PowerShell, pero la salida de `npm test` y el texto pegado desde el editor muestran bien las tildes. Era un problema de visualización de la terminal, no de los archivos.
- **Verificación:** `npm test` muestra "título" y "Cálculo" correctamente y el código se ve bien en el editor.
- **Commit relacionado:** Ninguno (no hubo cambios)

### Entrada 6

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso reemplazar los números 3600000, 48 y 168 de `calcularUrgencia` por constantes con nombre (`MS_POR_HORA`, `HORAS_URGENCIA_ALTA`, `HORAS_URGENCIA_MEDIA`).
- **Decisión:** Aceptada
- **Por qué:** Los números sueltos no explican su significado; con nombres, la regla de urgencia se lee igual que en el README y es más fácil de cambiar.
- **Verificación:** `npm test` siguió con 10 de 10 sin modificar las pruebas, y los operadores `<` y `<=` quedaron iguales.
- **Commit relacionado:** 007021f

### Entrada 7

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** Al ejecutar el linter apareció no-explicit-any en leerRespuesta. El asistente propuso reemplazar any por unknown y validar cada campo con funciones de verificación (`esObjeto`, `esTextoNoVacio`, `esFechaValida`, esPlataforma`).
- **Decisión:** Aceptada
- **Por qué:** any apaga la comprobación de tipos justo donde llega texto no confiable del modelo de lenguaje. Con unknown, el compilador obliga a validar antes de usar cada dato.
- **Verificación:** `npm run` lint pasó de 2 errores a 0 (el segundo se resolvió en la entrada 8) y npm test pasa con las 10 pruebas anteriores sin modificarlas y 5 nuevas.
- **Commit relacionado:** 8dd61b3

### Entrada 8

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** El linter marcó _prompt sin usar en tests/extraerTarea.test.ts. El asistente propuso no editar la prueba y, en su lugar, configurar la regla con argsIgnorePattern: "^_" en eslint.config.mjs.
- **Decisión:** Aceptada
- **Por qué:** La regla del curso dice que no se modifican pruebas para que pasen, y el guion bajo es la convención para un parámetro que se deja sin usar a propósito (el modelo falso no necesita leer el prompt).
- **Verificación:**`npm run` lint queda sin errores y git diff tests/extraerTarea.test.ts no muestra cambios.
- **Commit relacionado:** ea90b39

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 6 |
| Aceptadas con cambios | 1 |
| Rechazadas | 1 |

## Errores que atraparon las pruebas

En la fase roja del TDD, antes de existir src/extraerTarea.ts, ejecuté npm test sobre el commit de pruebas (fa91b3e) y falló con el error Cannot find module '../src/extraerTarea', lo que confirmó que las pruebas dependen de la implementación y que no pasan por accidente. Después de implementar la función (be03ba2), las 10 pruebas pasaron. No encontré errores de lógica en el código al ejecutarlas, pero las pruebas de los límites de urgencia (exactamente 48 horas es media, un minuto menos es alta, un minuto más de 7 días es baja) protegen los casos donde es más fácil equivocarse al comparar fechas.

En la semana 6 también se comprobó que las validaciones de los datos recibidos del modelo funcionaran correctamente. Las 5 pruebas nuevas permitieron complementar las 10 anteriores, llegando a un total de 15 pruebas aprobadas. Además, se verificó que los cambios realizados para corregir los problemas detectados por ESLint no afectaran el funcionamiento de la aplicación. De esta manera, se mantuvieron las pruebas originales y se comprobó que el código siguiera funcionando después de las mejoras.

## Reflexión final

La ayuda de la IA fue clave para entender cómo aplicar TDD de verdad en Git. Me guio para armar commits con un solo propósito: uno para la configuración, otro para las pruebas y otro para el código. También detectó un archivo arrastrado por error en un commit. Aprendí que no basta con que el test pase: el historial debe contar la historia correcta, y conviene verificar cada cambio con git show --stat. También aprendí a no aceptar todo sin comprobarlo: una sugerencia sobre la codificación resultó ser un problema de la terminal. En el próximo módulo empezaré directo con el commit en rojo.

En la semana 6 también utilicé la IA como apoyo para mejorar la calidad del código. Aprendí la importancia de utilizar unknown en lugar de any cuando se reciben datos del modelo, porque así es necesario comprobar que la información tenga el formato correcto antes de utilizarla. También corregí los problemas detectados por ESLint sin modificar las pruebas originales. Por último, realicé la revisión de seguridad y documenté los resultados en revision_seguridad.md. Esta semana entendí que no se trata solamente de hacer que el programa funcione, sino también de revisar que el código sea claro, seguro y esté bien organizado.