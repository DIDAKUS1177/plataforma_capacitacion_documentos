"""
Crea (o completa) las hojas y encabezados del Sheet de capacitación.

Es idempotente: si una hoja ya existe, no la toca. Nunca borra ni renombra
nada — misma regla que con los Sheets de producción de AppSheet.

Uso:
    python scripts/init_sheet.py <ruta-al-service-account.json> [SHEET_ID]
"""

import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build

SHEET_ID_POR_DEFECTO = "1z0Wcc2-A0S6JCVjm_e3kfcXZgZMgr3g_VpOTMq6X3IU"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# El orden de las columnas es el mismo que escriben las funciones de
# functions/api/. Si se agrega una columna, va SIEMPRE al final.
HOJAS = {
    "constancias": [
        "fecha_hora", "curso_codigo", "curso_nombre", "curso_version", "nombre",
        "cedula", "correo", "cargo", "puntaje", "total_preguntas", "aprobado",
        "minutos_en_capacitacion", "acepto_declaracion", "autorizo_datos",
        "link_firma",
        # Agregadas al final (2026-08-21): la capacitación pasó a ser por
        # aplicación. Nunca reordenar ni renombrar las de arriba.
        "app_id", "app_nombre", "tecnica",
        # Agregadas al final (2026-08-24): campos que pide el F-SIG-19 para que
        # esta hoja sea el registro de asistencia oficial.
        "area_un", "modalidad", "tipo_actividad", "expositor",
        "hora_inicio", "hora_fin",
        # Agregada al final (2026-08-25): identificador aleatorio de la
        # constancia, el que lleva el QR de verificacion. Aleatorio y no
        # consecutivo a proposito: con ids seguidos cualquiera podria recorrer
        # la pagina publica y sacar nombres y cedulas.
        "id_constancia",
    ],
    # Quien EMPEZO la capacitacion. Se escribe al registrarse, antes de ver
    # nada, para que quede rastro de los que no terminan.
    "inicios": [
        "fecha_hora", "nombre", "cedula", "correo", "cargo", "area_un",
        "app_id", "app_nombre", "tecnica", "curso_codigo", "curso_version",
        "dispositivo",
    ],
    "respuestas_evaluacion": [
        "fecha_hora", "curso_codigo", "cedula", "numero_pregunta", "enunciado",
        "respondio", "correcta",
    ],
    "mejoras": [
        "id_mejora", "fecha_hora", "aplicacion", "tipo", "criticidad",
        "descripcion", "nombre", "correo", "estado", "responsable", "respuesta",
        "fecha_respuesta", "id_changelog",
    ],
}


def _letra_columna(indice: int) -> str:
    """0 -> 'A', 25 -> 'Z', 26 -> 'AA'."""
    letras = ""
    indice += 1
    while indice > 0:
        indice, resto = divmod(indice - 1, 26)
        letras = chr(65 + resto) + letras
    return letras


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    credenciales_path = sys.argv[1]
    sheet_id = sys.argv[2] if len(sys.argv) > 2 else SHEET_ID_POR_DEFECTO

    cred = service_account.Credentials.from_service_account_file(
        credenciales_path, scopes=SCOPES
    )
    svc = build("sheets", "v4", credentials=cred, cache_discovery=False)

    meta = svc.spreadsheets().get(spreadsheetId=sheet_id).execute()
    existentes = {h["properties"]["title"] for h in meta["sheets"]}
    print(f'Sheet: {meta["properties"]["title"]}')
    print(f"Hojas existentes: {sorted(existentes)}\n")

    # 1) Crear las hojas que falten.
    nuevas = [nombre for nombre in HOJAS if nombre not in existentes]
    if nuevas:
        svc.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={
                "requests": [
                    {"addSheet": {"properties": {"title": nombre}}} for nombre in nuevas
                ]
            },
        ).execute()
        print(f"Hojas creadas: {nuevas}")
    else:
        print("No hubo que crear hojas.")

    # 2) Escribir encabezados solo donde la fila 1 esté vacía.
    meta = svc.spreadsheets().get(spreadsheetId=sheet_id).execute()
    ids = {h["properties"]["title"]: h["properties"]["sheetId"] for h in meta["sheets"]}

    escritos = []
    formatos = []
    for nombre, encabezados in HOJAS.items():
        actual = (
            svc.spreadsheets()
            .values()
            .get(spreadsheetId=sheet_id, range=f"{nombre}!1:1")
            .execute()
            .get("values")
        )
        if actual:
            existentes = [c.strip() for c in actual[0]]
            # Solo se completan columnas que FALTEN AL FINAL. Si lo que ya está
            # no coincide con el principio de lo esperado, no se toca nada: sería
            # renombrar columnas con datos históricos debajo.
            if existentes != encabezados[: len(existentes)]:
                print(
                    f'"{nombre}": los encabezados actuales no coinciden con los '
                    f"esperados. NO se tocó nada.\n"
                    f"    actual:   {existentes}\n"
                    f"    esperado: {encabezados}"
                )
                continue

            faltantes = encabezados[len(existentes):]
            if not faltantes:
                print(f'"{nombre}": encabezados al día.')
                continue

            columna = _letra_columna(len(existentes))
            svc.spreadsheets().values().update(
                spreadsheetId=sheet_id,
                range=f"{nombre}!{columna}1",
                valueInputOption="RAW",
                body={"values": [faltantes]},
            ).execute()
            print(f'"{nombre}": columnas agregadas al final -> {faltantes}')
            continue

        svc.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range=f"{nombre}!A1",
            valueInputOption="RAW",
            body={"values": [encabezados]},
        ).execute()
        escritos.append(nombre)

        formatos.extend([
            {
                "repeatCell": {
                    "range": {
                        "sheetId": ids[nombre],
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "textFormat": {"bold": True},
                            "backgroundColor": {"red": 0.99, "green": 0.95, "blue": 0.95},
                        }
                    },
                    "fields": "userEnteredFormat(textFormat,backgroundColor)",
                }
            },
            {
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": ids[nombre],
                        "gridProperties": {"frozenRowCount": 1},
                    },
                    "fields": "gridProperties.frozenRowCount",
                }
            },
        ])

    if formatos:
        svc.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id, body={"requests": formatos}
        ).execute()

    print(f"\nEncabezados escritos en: {escritos or 'ninguna (ya estaban)'}")
    print("Listo. Ninguna hoja fue borrada ni renombrada.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
