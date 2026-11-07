export type Plataforma = "WhatsApp" | "Moodle" | "Teams" | "Q10" | "Canvas";
export type Urgencia = "alta" | "media" | "baja";

export interface Tarea {
  titulo: string;
  materia: string;
  fechaLimite: string | null; // formato "AAAA-MM-DDTHH:mm", hora local
  plataforma: Plataforma | null;
  urgencia: Urgencia;
}

// Función que llama al modelo de lenguaje: recibe un prompt y devuelve texto JSON.
export type ModeloLenguaje = (prompt: string) => Promise<string>;

export class MensajeVacioError extends Error {
  constructor() {
    super("El mensaje está vacío");
    this.name = "MensajeVacioError";
  }
}

export class MensajeSinTareaError extends Error {
  constructor() {
    super("No encontré ninguna tarea en este mensaje");
    this.name = "MensajeSinTareaError";
  }
}

export class RespuestaModeloError extends Error {
  constructor() {
    super("No pude interpretar la respuesta del asistente");
    this.name = "RespuestaModeloError";
  }
}

const PLATAFORMAS: Plataforma[] = ["WhatsApp", "Moodle", "Teams", "Q10", "Canvas"];

// Convierte una fecha a texto "AAAA-MM-DDTHH:mm" en hora local.
function aTextoLocal(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`
  );
}

// Arma las instrucciones que se le envían al modelo de lenguaje.
function construirPrompt(mensaje: string, hoy: Date): string {
  const dia = hoy.toLocaleDateString("es-CO", { weekday: "long" });
  return [
    "Eres un asistente que extrae tareas de mensajes informales de profesores.",
    `Hoy es ${dia}, ${aTextoLocal(hoy)}.`,
    "Responde solo con JSON, sin texto adicional, con este formato:",
    '{ "tarea": { "titulo": "...", "materia": "...", "fechaLimite": "AAAA-MM-DDTHH:mm" o null, "plataforma": "WhatsApp" | "Moodle" | "Teams" | "Q10" | "Canvas" o null } }',
    'Si el mensaje no contiene ninguna tarea, responde: { "tarea": null }',
    `Mensaje: ${mensaje}`,
  ].join("\n");
}

// Calcula la urgencia según el tiempo que falta para la fecha límite.
function calcularUrgencia(fechaLimite: string | null, hoy: Date): Urgencia {
  if (fechaLimite === null) {
    return "media";
  }
  const horas = (new Date(fechaLimite).getTime() - hoy.getTime()) / 3600000;
  if (horas < 48) {
    return "alta";
  }
  if (horas <= 168) {
    return "media";
  }
  return "baja";
}

// Lee el texto del modelo y devuelve los datos de la tarea, o null si no hay tarea.
function leerRespuesta(texto: string): Omit<Tarea, "urgencia"> | null {
  let datos: any;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new RespuestaModeloError();
  }

  if (typeof datos !== "object" || datos === null || !("tarea" in datos)) {
    throw new RespuestaModeloError();
  }
  if (datos.tarea === null) {
    return null;
  }

  const { titulo, materia, fechaLimite = null, plataforma = null } = datos.tarea;
  const fechaValida =
    fechaLimite === null ||
    (typeof fechaLimite === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaLimite));
  const plataformaValida = plataforma === null || PLATAFORMAS.includes(plataforma);

  if (typeof titulo !== "string" || typeof materia !== "string" || !fechaValida || !plataformaValida) {
    throw new RespuestaModeloError();
  }
  return { titulo, materia, fechaLimite, plataforma };
}

export async function extraerTarea(
  mensaje: string,
  hoy: Date,
  modelo: ModeloLenguaje
): Promise<Tarea> {
  if (mensaje.trim() === "") {
    throw new MensajeVacioError();
  }

  const respuesta = await modelo(construirPrompt(mensaje, hoy));
  const datos = leerRespuesta(respuesta);

  if (datos === null) {
    throw new MensajeSinTareaError();
  }

  return { ...datos, urgencia: calcularUrgencia(datos.fechaLimite, hoy) };
}