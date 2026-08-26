"""
Pone lista desplegable y colores en la columna `estado` de la hoja `mejoras`.

Sin esto, cada quien escribe el estado como quiere ("en analisis", "En
Análisis", "revisando") y la pantalla de consulta no sabe qué color darle.

Los seis valores son los mismos que reconoce src/pages/ConsultaPage.tsx.

Uso:
    python scripts/validacion_estados.py <ruta-al-service-account.json>
"""

import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build

SHEET_ID = "1z0Wcc2-A0S6JCVjm_e3kfcXZgZMgr3g_VpOTMq6X3IU"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
HOJA = "mejoras"
COL_ESTADO = 8  # columna I

# (valor, color de fondo). Los mismos tonos que usa la pantalla de consulta.
ESTADOS = [
    ("Recibida", (0.94, 0.95, 0.96)),
    ("En análisis", (0.99, 0.95, 0.78)),
    ("Aceptada", (0.85, 0.93, 0.99)),
    ("Implementada", (0.85, 0.96, 0.90)),
    ("Rechazada", (0.99, 0.90, 0.90)),
    ("Duplicada", (0.94, 0.95, 0.96)),
]


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    cred = service_account.Credentials.from_service_account_file(sys.argv[1], scopes=SCOPES)
    svc = build("sheets", "v4", credentials=cred, cache_discovery=False)

    meta = svc.spreadsheets().get(spreadsheetId=SHEET_ID).execute()
    hoja_id = None
    for h in meta["sheets"]:
        if h["properties"]["title"] == HOJA:
            hoja_id = h["properties"]["sheetId"]
    if hoja_id is None:
        print(f'No existe la hoja "{HOJA}".')
        return 1

    # Desde la fila 2 (la 1 son encabezados) hasta el final de la hoja.
    rango = {
        "sheetId": hoja_id,
        "startRowIndex": 1,
        "startColumnIndex": COL_ESTADO,
        "endColumnIndex": COL_ESTADO + 1,
    }

    peticiones = [
        {
            "setDataValidation": {
                "range": rango,
                "rule": {
                    "condition": {
                        "type": "ONE_OF_LIST",
                        "values": [{"userEnteredValue": v} for v, _ in ESTADOS],
                    },
                    # Avisa pero no bloquea: si alguien pega datos de otra
                    # parte, se marca la celda en vez de perderse el pegado.
                    "strict": False,
                    "showCustomUi": True,
                    "inputMessage": "Elige uno de los seis estados.",
                },
            }
        }
    ]

    # Un color por estado, para verlo de un vistazo sin abrir cada fila.
    for valor, (r, g, b) in ESTADOS:
        peticiones.append(
            {
                "addConditionalFormatRule": {
                    "rule": {
                        "ranges": [rango],
                        "booleanRule": {
                            "condition": {
                                "type": "TEXT_EQ",
                                "values": [{"userEnteredValue": valor}],
                            },
                            "format": {"backgroundColor": {"red": r, "green": g, "blue": b}},
                        },
                    },
                    "index": 0,
                }
            }
        )

    svc.spreadsheets().batchUpdate(
        spreadsheetId=SHEET_ID, body={"requests": peticiones}
    ).execute()

    print(f'Columna "estado" de "{HOJA}": lista desplegable y colores puestos.')
    print("Estados: " + " · ".join(v for v, _ in ESTADOS))
    print("\nNo bloquea lo que ya está escrito: solo lo marca si no coincide.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
