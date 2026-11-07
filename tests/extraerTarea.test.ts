import {
  extraerTarea,
  MensajeVacioError,
  MensajeSinTareaError,
  RespuestaModeloError,
} from "../src/extraerTarea";

// Fecha de "hoy" para todas las pruebas: sábado 24/10/2026 a las 10:00.
const hoy = new Date("2026-10-24T10:00:00");

// Crea un modelo falso que responde siempre lo mismo, sin usar la API real.
function modeloFalso(respuesta: unknown) {
  return jest.fn(async (_prompt: string) =>
    typeof respuesta === "string" ? respuesta : JSON.stringify(respuesta)
  );
}

// Crea la respuesta del modelo con una tarea; los campos se pueden cambiar.
function respuestaConTarea(cambios: Record<string, unknown> = {}) {
  return {
    tarea: {
      titulo: "Taller de Cálculo Integral",
      materia: "Cálculo Integral",
      fechaLimite: "2026-10-29T23:59",
      plataforma: "Moodle",
      ...cambios,
    },
  };
}

const mensajeCalculo =
  "el profe de Cálculo mandó por el grupo de WhatsApp que el taller de integrales es para este jueves a las 11:59pm por Moodle";

describe("extraerTarea (HU-01)", () => {
  // ---------- Casos normales ----------

  test("extrae título, materia, fecha, plataforma y urgencia media del mensaje de Cálculo", async () => {
    const tarea = await extraerTarea(
      mensajeCalculo,
      hoy,
      modeloFalso(respuestaConTarea())
    );

    expect(tarea).toEqual({
      titulo: "Taller de Cálculo Integral",
      materia: "Cálculo Integral",
      fechaLimite: "2026-10-29T23:59",
      plataforma: "Moodle",
      urgencia: "media",
    });
  });

  test("una entrega para mañana por Teams tiene urgencia alta", async () => {
    const modelo = modeloFalso(
      respuestaConTarea({
        titulo: "Proyecto final de Programación Web",
        materia: "Programación Web",
        fechaLimite: "2026-10-25T18:00",
        plataforma: "Teams",
      })
    );

    const tarea = await extraerTarea(
      "mañana a las 6 pm se entrega el proyecto final de Programación Web por Teams",
      hoy,
      modelo
    );

    expect(tarea.plataforma).toBe("Teams");
    expect(tarea.fechaLimite).toBe("2026-10-25T18:00");
    expect(tarea.urgencia).toBe("alta");
  });

  // ---------- Casos límite ----------

  test("exactamente 48 horas antes de la fecha límite es urgencia media", async () => {
    const modelo = modeloFalso(respuestaConTarea({ fechaLimite: "2026-10-26T10:00" }));

    const tarea = await extraerTarea(mensajeCalculo, hoy, modelo);

    expect(tarea.urgencia).toBe("media");
  });

  test("un minuto menos de 48 horas es urgencia alta", async () => {
    const modelo = modeloFalso(respuestaConTarea({ fechaLimite: "2026-10-26T09:59" }));

    const tarea = await extraerTarea(mensajeCalculo, hoy, modelo);

    expect(tarea.urgencia).toBe("alta");
  });

  test("un minuto más de 7 días es urgencia baja", async () => {
    const modelo = modeloFalso(respuestaConTarea({ fechaLimite: "2026-10-31T10:01" }));

    const tarea = await extraerTarea(mensajeCalculo, hoy, modelo);

    expect(tarea.urgencia).toBe("baja");
  });

  test("si el mensaje no menciona plataforma, la plataforma queda en null", async () => {
    const modelo = modeloFalso(
      respuestaConTarea({
        titulo: "Informe de Química",
        materia: "Química",
        fechaLimite: "2026-10-25T08:00",
        plataforma: null,
      })
    );

    const tarea = await extraerTarea(
      "mañana entregamos el informe de Química a las 8:00 am",
      hoy,
      modelo
    );

    expect(tarea.plataforma).toBeNull();
    expect(tarea.urgencia).toBe("alta");
  });

  test("si el mensaje no menciona fecha, la fecha queda en null y la urgencia es media", async () => {
    const modelo = modeloFalso(respuestaConTarea({ fechaLimite: null }));

    const tarea = await extraerTarea(
      "recuerden entregar el quiz de Física por Q10",
      hoy,
      modelo
    );

    expect(tarea.fechaLimite).toBeNull();
    expect(tarea.urgencia).toBe("media");
  });

  // ---------- Casos de error ----------

  test("un mensaje sin tarea lanza MensajeSinTareaError", async () => {
    const modelo = modeloFalso({ tarea: null });

    const resultado = extraerTarea("hola, ¿cómo van con el parcial?", hoy, modelo);

    await expect(resultado).rejects.toThrow(MensajeSinTareaError);
    await expect(resultado).rejects.toThrow(
      "No encontré ninguna tarea en este mensaje"
    );
  });

  test("un mensaje vacío lanza MensajeVacioError y no llama al modelo", async () => {
    const modelo = modeloFalso(respuestaConTarea());

    await expect(extraerTarea("   ", hoy, modelo)).rejects.toThrow(
      MensajeVacioError
    );
    expect(modelo).not.toHaveBeenCalled();
  });

  test("una respuesta del modelo que no es JSON lanza RespuestaModeloError", async () => {
    const modelo = modeloFalso("esto no es json");

    await expect(extraerTarea(mensajeCalculo, hoy, modelo)).rejects.toThrow(
      RespuestaModeloError
    );
  });
});