"""
Autoriza a la plataforma a enviar correo desde un buzón de Gmail (vía B).

Se corre UNA vez, en tu máquina. Abre el navegador, das permiso con la cuenta
desde la que quieres que salgan los correos, y el script guarda el refresh token
en `gmail-token.local.json` (ignorado por git). De ahí copias los valores a las
variables de entorno de Cloudflare.

Sirve con cuentas @gmail.com corrientes. La otra vía —delegación de dominio—
solo funciona si la empresa tiene Google Workspace con dominio propio.

Uso:
    python scripts/autorizar_gmail.py

Busca solo el cliente OAuth del proyecto de reportes. Si lo tienes en otro
lado, pásalo como argumento:
    python scripts/autorizar_gmail.py ruta/al/drive-oauth-client.json

Si la pantalla de consentimiento está en modo "Prueba", la cuenta tiene que
estar agregada como usuario de prueba en Google Cloud, y el navegador va a
advertir que la app no está verificada: es esperable, es tu propia app.
"""

import io
import json
import sys
from pathlib import Path

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    print("Falta la librería. Instálala con:")
    print("    pip install google-auth-oauthlib")
    raise SystemExit(1)

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "gmail-token.local.json"

# El cliente OAuth vive en el repo de reportes, al lado de este. Se buscan las
# ubicaciones probables para no depender de desde dónde se corra el comando.
CANDIDATOS = [
    RAIZ.parent
    / "ADC_Scripts_Generacion_de_reportes"
    / "ADEMINCOL-Central"
    / "backend"
    / "credentials"
    / "drive-oauth-client.json",
    RAIZ / "drive-oauth-client.json",
]


def _buscar_cliente() -> str:
    for ruta in CANDIDATOS:
        if ruta.exists():
            return str(ruta)
    print("No encontré el archivo de cliente OAuth. Lo busqué en:")
    for ruta in CANDIDATOS:
        print("   " + str(ruta))
    print("")
    print("Pásalo como argumento:")
    print("   python scripts/autorizar_gmail.py ruta/al/drive-oauth-client.json")
    raise SystemExit(1)


def main() -> int:
    cliente = sys.argv[1] if len(sys.argv) > 1 else _buscar_cliente()
    print("Cliente OAuth: " + cliente)
    print("")

    flujo = InstalledAppFlow.from_client_secrets_file(cliente, SCOPES)

    print("Se va a abrir el navegador.")
    print("Inicia sesión con la cuenta DESDE LA QUE deben salir los correos")
    print("y acepta el permiso de 'Enviar correo'.")
    print("")
    print("Si el navegador no abre solo, copia el enlace que aparezca abajo.")
    print("La terminal se queda esperando hasta que aceptes: es normal.")
    print("")

    try:
        # `prompt="consent"` fuerza que Google devuelva refresh_token: sin eso,
        # en una cuenta que ya autorizó antes vuelve solo el access token, que
        # dura una hora y no le sirve al servidor.
        cred = flujo.run_local_server(port=0, prompt="consent", open_browser=True)
    except Exception as e:  # noqa: BLE001 - interesa el mensaje crudo
        print("")
        print("La autorización no se completó: " + str(e))
        print("")
        print("Causas típicas:")
        print("  - Se cerró la pestaña antes de aceptar.")
        print("  - 'Acceso bloqueado': la pantalla de consentimiento del proyecto")
        print("    adcformatos está en modo Prueba y esta cuenta no está agregada")
        print("    como usuario de prueba en Google Cloud.")
        print("  - Un firewall bloqueó el servidor local del flujo.")
        return 1

    if not cred.refresh_token:
        print("Google no devolvió refresh token. Revoca el acceso de la app en")
        print("https://myaccount.google.com/permissions y vuelve a correr esto.")
        return 1

    datos = {
        "GMAIL_REMITENTE": "(el correo de la cuenta con la que acabas de entrar)",
        "GMAIL_CLIENT_ID": cred.client_id,
        "GMAIL_CLIENT_SECRET": cred.client_secret,
        "GMAIL_REFRESH_TOKEN": cred.refresh_token,
    }
    io.open(DESTINO, "w", encoding="utf-8").write(json.dumps(datos, indent=2))

    print("")
    print("Listo. Los valores quedaron en:")
    print("   " + str(DESTINO))
    print("")
    print("Qué hacer con ellos:")
    print("  1. Escribe tu correo en GMAIL_REMITENTE dentro de ese archivo.")
    print("  2. Cópialos a las variables de entorno de Cloudflare Pages.")
    print("     CLIENT_SECRET y REFRESH_TOKEN van marcados como Secret.")
    print("  3. Para probar en local, cópialos también a .dev.vars.")
    print("")
    print("Ese archivo está en .gitignore. No lo subas ni lo mandes por chat.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
