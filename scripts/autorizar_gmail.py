"""
Autoriza a la plataforma a enviar correo desde un buzón de Gmail (vía B).

Se corre UNA vez, en tu máquina. Abre el navegador, das permiso con la cuenta
desde la que quieres que salgan los correos, y el script guarda el refresh token
en `gmail-token.local.json` (ignorado por git). De ahí copias los tres valores a
las variables de entorno de Cloudflare.

Sirve con cuentas @gmail.com corrientes. La otra vía —delegación de dominio—
solo funciona si la empresa tiene Google Workspace con dominio propio.

Uso:
    pip install google-auth-oauthlib
    python scripts/autorizar_gmail.py ruta/al/drive-oauth-client.json

El archivo de cliente OAuth ya existe en el proyecto de reportes:
    ADEMINCOL-Central/backend/credentials/drive-oauth-client.json

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
    print("Falta la librería. Instálala con:\n    pip install google-auth-oauthlib")
    raise SystemExit(1)

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
DESTINO = Path(__file__).resolve().parent.parent / "gmail-token.local.json"


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    cliente = sys.argv[1]
    flujo = InstalledAppFlow.from_client_secrets_file(cliente, SCOPES)

    print("Se va a abrir el navegador.")
    print("Inicia sesión con la cuenta DESDE LA QUE deben salir los correos")
    print("y acepta el permiso de 'Enviar correo'.\n")

    # `prompt="consent"` fuerza que Google devuelva refresh_token: sin eso, en
    # una cuenta que ya autorizó antes vuelve solo el access token, que dura
    # una hora y no sirve para el servidor.
    cred = flujo.run_local_server(port=0, prompt="consent")

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

    print("\nListo. Los valores quedaron en:")
    print(f"   {DESTINO}")
    print("\nQué hacer con ellos:")
    print("  1. Copia los cuatro a las variables de entorno de Cloudflare Pages.")
    print("     GMAIL_CLIENT_SECRET y GMAIL_REFRESH_TOKEN van marcados como Secret.")
    print("  2. Para probar en local, cópialos también a .dev.vars.")
    print("\nEse archivo está en .gitignore. No lo subas ni lo mandes por chat.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
