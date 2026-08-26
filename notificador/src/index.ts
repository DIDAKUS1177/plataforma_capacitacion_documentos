interface Env {
  /** URL de la plataforma, sin barra final. */
  URL_PLATAFORMA: string;
  /** La misma CLAVE_NOTIFICACIONES que tiene la plataforma. */
  CLAVE_NOTIFICACIONES: string;
}

async function avisar(env: Env): Promise<string> {
  const respuesta = await fetch(`${env.URL_PLATAFORMA}/api/notificar`, {
    method: "POST",
    headers: { "x-clave": env.CLAVE_NOTIFICACIONES },
  });
  const texto = await respuesta.text();
  return `HTTP ${respuesta.status} ${texto}`;
}

export default {
  // Lo que corre cada 15 minutos.
  async scheduled(_evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      avisar(env).then(
        (r) => console.log("notificar:", r),
        (e) => console.error("notificar fallo:", e),
      ),
    );
  },

  // Y por HTTP, para poder dispararlo a mano sin esperar al reloj.
  async fetch(peticion: Request, env: Env): Promise<Response> {
    if (new URL(peticion.url).searchParams.get("clave") !== env.CLAVE_NOTIFICACIONES) {
      return new Response("No autorizado", { status: 401 });
    }
    return new Response(await avisar(env));
  },
};
