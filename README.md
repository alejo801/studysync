# StudySync.AI

## 1. Qué es

StudySync.AI es un gestor de tareas y entregas para estudiantes con asistente de IA. El estudiante pega el mensaje informal de un profesor (por ejemplo, «el taller de integrales es para este jueves a las 11:59 pm por Moodle») y el sistema extrae la tarea: título, materia, fecha límite, plataforma y urgencia.

Este repositorio contiene el primer incremento del proyecto: la función `extraerTarea` (historia de usuario HU-01), con sus pruebas, su revisión de código y seguridad, y la bitácora de uso de IA. La interfaz (Ionic) y la API quedan para los siguientes incrementos.

## 2. Requisitos

- Node.js 20 o superior (probado con la versión 24)
- npm (viene con Node.js)
- Git

## 3. Instalación

```bash
git clone https://github.com/alejo801/studysync.git
cd studysync
npm install
```

## 4. Ejecución

Este incremento no tiene interfaz ni servidor: es una función que se usa desde código. Recibe el mensaje, la fecha de hoy y una función que llama al modelo de lenguaje. Ejemplo con un modelo simulado:

```ts
import { extraerTarea } from "./src/extraerTarea";

const modeloSimulado = async () =>
  JSON.stringify({
    tarea: { titulo: "Taller de Cálculo Integral", materia: "Cálculo Integral", fechaLimite: "2026-10-29T23:59", plataforma: "Moodle" },
  });

extraerTarea("el taller de integrales es para este jueves a las 11:59pm por Moodle", new Date(), modeloSimulado)
  .then(console.log);
```

Cuando se conecte la API real del modelo de lenguaje, la clave irá en una variable de entorno: copia `.env.example` como `.env` y reemplaza el valor. El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

## 5. Pruebas

```bash
npm test
```

Ejecuta las 15 pruebas con Jest: 10 de la semana 5 y 5 nuevas de la revisión de la semana 6. Para pasar el linter (ESLint con reglas de seguridad):

```bash
npm run lint
```

## 6. Estructura

```
studysync/
├── src/
│   └── extraerTarea.ts            # función extraerTarea y sus errores
├── tests/
│   ├── extraerTarea.test.ts       # pruebas de la semana 5
│   └── extraerTarea.revision.test.ts  # pruebas nuevas de la semana 6
├── bitacora_ia.md                 # registro de uso de IA
├── revision_seguridad.md          # informe de revisión de código y seguridad
├── eslint.config.mjs              # configuración del linter
├── .env.example                   # ejemplo de variables de entorno
├── jest.config.js
├── tsconfig.json
└── package.json
```

## 7. Uso de IA

Se usó Claude (Anthropic, en chat) para proponer las pruebas, la implementación, el refactor, la revisión de código y los borradores del README y de los docstrings. Cada sugerencia se verificó con las pruebas, el linter o la lectura del código. Las decisiones están en `bitacora_ia.md` y la revisión de seguridad con IA, en `revision_seguridad.md`.

## 8. Autor y licencia

Autor: Luis Alejandro Perez Ordoñez. Licencia: ISC.

---

## Funcionalidad de la semana 5: HU-01 extraer la tarea de un mensaje

### Historia de usuario

**HU-01.** Como estudiante, quiero pegar un mensaje informal de un profesor y que el asistente extraiga título, materia, fecha límite, plataforma y urgencia, para no tener que anotar los datos a mano. Necesidad de origen: N-03. Prioridad: Must.

**Criterio de aceptación**

- **Escenario 1: extracción correcta.** Dado que hoy es sábado 24/10/2026 y pego el mensaje «el profe de Cálculo mandó por el grupo de WhatsApp que el taller de integrales es para este jueves a las 11:59pm por Moodle», cuando presiono enviar, entonces el asistente muestra una tarjeta con título «Taller de Cálculo Integral», materia «Cálculo Integral», fecha límite jueves 29/10/2026 23:59, plataforma «Moodle» y urgencia «Media».
- **Escenario 2 (error): mensaje sin tarea.** Dado que pego el texto «hola, ¿cómo van con el parcial?», cuando presiono enviar, entonces el asistente no crea ninguna tarjeta y responde «No encontré ninguna tarea en este mensaje».

### Contrato de la función

Archivo: `src/extraerTarea.ts`

```ts
type Plataforma = "WhatsApp" | "Moodle" | "Teams" | "Q10" | "Canvas";
type Urgencia = "alta" | "media" | "baja";

interface Tarea {
  titulo: string;
  materia: string;
  fechaLimite: string | null;   // formato "AAAA-MM-DDTHH:mm", hora local
  plataforma: Plataforma | null;
  urgencia: Urgencia;
}

type ModeloLenguaje = (prompt: string) => Promise<string>;

function extraerTarea(
  mensaje: string,
  hoy: Date,
  modelo: ModeloLenguaje
): Promise<Tarea>;
```

**Qué recibe**

- `mensaje`: el texto informal que pegó el estudiante.
- `hoy`: la fecha y hora actuales. Se pasa como parámetro para poder probar fechas como «este jueves» o «mañana» sin depender del reloj.
- `modelo`: la función que llama al modelo de lenguaje. Recibe un prompt y devuelve un texto JSON. En las pruebas se reemplaza por una función falsa, para que sean rápidas y no usen la API.

**Respuesta esperada del modelo (JSON)**

```json
{ "tarea": { "titulo": "...", "materia": "...", "fechaLimite": "2026-10-29T23:59", "plataforma": "Moodle" } }
```

Si el mensaje no contiene ninguna tarea, el modelo responde `{ "tarea": null }`.

**Qué devuelve**

Una `Tarea` con los cinco campos. La función calcula la urgencia a partir de la fecha límite y de `hoy`:

| Tiempo que falta | Urgencia |
|---|---|
| Menos de 48 horas (incluye fechas ya vencidas) | alta |
| Desde 48 horas hasta 7 días (168 horas), inclusive | media |
| Más de 7 días | baja |

**Errores (lanza una excepción)**

| Situación | Error | Mensaje |
|---|---|---|
| El mensaje está vacío o solo tiene espacios (no se llama al modelo) | `MensajeVacioError` | «El mensaje está vacío» |
| El modelo responde `{ "tarea": null }` | `MensajeSinTareaError` | «No encontré ninguna tarea en este mensaje» |
| El modelo responde algo que no es JSON válido, sin los campos obligatorios, con título o materia vacíos, con una plataforma que no está en la lista o con una fecha que no existe | `RespuestaModeloError` | «No pude interpretar la respuesta del asistente» |

**Supuestos y casos límite**

- La regla de urgencia (48 horas y 7 días) es un supuesto del proyecto, tomado del prototipo y no de la encuesta (pregunta pendiente P-01).
- Si el mensaje no menciona plataforma, `plataforma` es `null`.
- Si el mensaje no menciona fecha, `fechaLimite` es `null` y la urgencia es `media` (supuesto; HU-04 trata este caso con más detalle).
- Exactamente 48 horas de diferencia es `media`. Exactamente 168 horas es `media`; un minuto más es `baja`.
- Las fechas se manejan en hora local, sin zonas horarias.

### Ejemplos de entrada y salida

**Ejemplo 1 (caso normal)**

- Entrada: mensaje «el profe de Cálculo mandó por el grupo de WhatsApp que el taller de integrales es para este jueves a las 11:59pm por Moodle»; hoy = 2026-10-24 10:00.
- Salida:

```json
{
  "titulo": "Taller de Cálculo Integral",
  "materia": "Cálculo Integral",
  "fechaLimite": "2026-10-29T23:59",
  "plataforma": "Moodle",
  "urgencia": "media"
}
```

**Ejemplo 2 (caso límite: sin plataforma)**

- Entrada: mensaje «mañana entregamos el informe de Química a las 8:00 am»; hoy = 2026-10-24 10:00.
- Salida:

```json
{
  "titulo": "Informe de Química",
  "materia": "Química",
  "fechaLimite": "2026-10-25T08:00",
  "plataforma": null,
  "urgencia": "alta"
}
```

**Ejemplo 3 (caso de error)**

- Entrada: mensaje «hola, ¿cómo van con el parcial?».
- Resultado: lanza `MensajeSinTareaError` con el mensaje «No encontré ninguna tarea en este mensaje».

