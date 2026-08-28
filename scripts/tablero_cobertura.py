"""
Crea las hojas `cobertura` y `pendientes` en el Sheet de la plataforma.

Los números son FÓRMULAS, no valores copiados: se actualizan solos a medida que
la gente se capacita. Lo único que hay que volver a correr es esto, y solo si
RR. HH. agrega un área nueva, para que aparezca su fila.

Vive en el Sheet y no en la plataforma web a propósito: son datos de gestión
—quién falta, con nombre y correo— y la plataforma la abre cualquiera que tenga
el enlace.

Uso:
    python scripts/tablero_cobertura.py <service-account.json>
"""

import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build

SHEET_ID = "1z0Wcc2-A0S6JCVjm_e3kfcXZgZMgr3g_VpOTMq6X3IU"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# Columnas en `personal`: A cedula · B nombre · C correo · D cargo ·
#                         E categoria · F area · G area_trabajo · H lugar
COL_PERSONAL = {"categoria": "E", "area": "F", "lugar": "H"}

# En `constancias` la cédula es la F; en `inicios`, la C.
CED_CONSTANCIA = "constancias!$F$2:$F"
CED_INICIO = "inicios!$C$2:$C"
CED_PERSONAL = "personal!$A$2:$A"

# "Capacitada" = su cédula aparece al menos una vez en constancias.
CAPACITADA = f"(COUNTIF({CED_CONSTANCIA},{CED_PERSONAL})>0)"


def _bloque(titulo: str, columna: str, valores: list, fila_inicio: int):
    """Una tabla de cobertura agrupada por el contenido de una columna."""
    rango = f"personal!${columna}$2:${columna}"
    filas = [[titulo, "", "", "", ""], ["", "Personas", "Capacitadas", "Faltan", "Cobertura"]]
    r = fila_inicio + 2
    for valor in valores:
        filas.append(
            [
                valor,
                f"=COUNTIF({rango},$A{r})",
                f"=SUMPRODUCT(({rango}=$A{r})*{CAPACITADA})",
                f"=B{r}-C{r}",
                f"=IFERROR(C{r}/B{r},0)",
            ]
        )
        r += 1
    return filas


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    cred = service_account.Credentials.from_service_account_file(sys.argv[1], scopes=SCOPES)
    svc = build("sheets", "v4", credentials=cred, cache_discovery=False)

    # Los valores de cada agrupación salen del propio listado, para no
    # inventar áreas que no existen ni olvidar una.
    datos = (
        svc.spreadsheets()
        .values()
        .get(spreadsheetId=SHEET_ID, range="personal")
        .execute()
        .get("values", [])
    )
    enc = datos[0]
    filas_personal = datos[1:]

    def distintos(nombre_col: str):
        i = enc.index(nombre_col)
        vistos = []
        for f in filas_personal:
            v = (f[i] if i < len(f) else "").strip()
            if v and v not in vistos:
                vistos.append(v)
        return sorted(vistos)

    areas = distintos("area")
    categorias = distintos("categoria")
    lugares = distintos("lugar")

    hoja = [
        ["COBERTURA DE CAPACITACIÓN", "", "", "", ""],
        ["Los números se actualizan solos. Vuelve a correr el script solo si RR. HH. agrega un área.", "", "", "", ""],
        ["", "", "", "", ""],
        ["TODO EL PERSONAL", "", "", "", ""],
        ["Personas en el listado", "=COUNTA(personal!A2:A)", "", "", ""],
        ["Capacitadas", f"=SUMPRODUCT((personal!$A$2:$A<>\"\")*{CAPACITADA})", "", "", ""],
        ["Faltan", "=B5-B6", "", "", ""],
        ["Cobertura", "=IFERROR(B6/B5,0)", "", "", ""],
        [
            "Empezaron y no terminaron",
            f"=SUMPRODUCT((personal!$A$2:$A<>\"\")*(COUNTIF({CED_INICIO},{CED_PERSONAL})>0)*(COUNTIF({CED_CONSTANCIA},{CED_PERSONAL})=0))",
            "", "", "",
        ],
        ["Constancias emitidas", "=COUNTA(constancias!A2:A)", "", "", ""],
        ["", "", "", "", ""],
        ["SOLO OPERACIONES", "", "", "", ""],
        ["Es el personal que ejecuta inspecciones: la cobertura que de verdad importa.", "", "", "", ""],
        ["Personas", '=COUNTIF(personal!$F$2:$F,"OPERACIONES")', "", "", ""],
        ["Capacitadas", f'=SUMPRODUCT((personal!$F$2:$F="OPERACIONES")*{CAPACITADA})', "", "", ""],
        ["Faltan", "=B14-B15", "", "", ""],
        ["Cobertura", "=IFERROR(B15/B14,0)", "", "", ""],
        ["", "", "", "", ""],
    ]

    fila = len(hoja) + 1
    for titulo, clave, valores in [
        ("POR ÁREA", "area", areas),
        ("POR CATEGORÍA", "categoria", categorias),
        ("POR LUGAR DE TRABAJO", "lugar", lugares),
    ]:
        bloque = _bloque(titulo, COL_PERSONAL[clave], valores, fila)
        hoja.extend(bloque)
        hoja.append(["", "", "", "", ""])
        fila += len(bloque) + 1

    _escribir(svc, "cobertura", hoja)

    # --- quiénes faltan, en su propia hoja para que la lista crezca libre ----
    pendientes = [
        ["QUIÉNES FALTAN POR CAPACITARSE", "", "", "", "", ""],
        ["Se actualiza sola. Sale de cruzar `personal` con `constancias`.", "", "", "", "", ""],
        ["Nombre", "Cédula", "Área", "Cargo", "Correo", "¿Ya empezó?"],
        [
            f'=SORT(FILTER({{personal!B2:B,personal!A2:A,personal!F2:F,personal!D2:D,personal!C2:C}},'
            f'(personal!A2:A<>"")*(COUNTIF({CED_CONSTANCIA},personal!A2:A)=0)),3,TRUE,1,TRUE)',
            "", "", "", "",
            f'=MAP(B4:B,LAMBDA(c,IF(c="","",IF(COUNTIF({CED_INICIO},c)>0,"Empezó, sin terminar",""))))',
        ],
    ]
    _escribir(svc, "pendientes", pendientes)

    print("Hojas `cobertura` y `pendientes` listas.")
    print(f"  áreas: {len(areas)} · categorías: {len(categorias)} · lugares: {len(lugares)}")
    return 0


def _escribir(svc, nombre: str, filas: list) -> None:
    meta = svc.spreadsheets().get(spreadsheetId=SHEET_ID).execute()
    ids = {h["properties"]["title"]: h["properties"]["sheetId"] for h in meta["sheets"]}

    if nombre not in ids:
        svc.spreadsheets().batchUpdate(
            spreadsheetId=SHEET_ID,
            body={"requests": [{"addSheet": {"properties": {"title": nombre}}}]},
        ).execute()
        meta = svc.spreadsheets().get(spreadsheetId=SHEET_ID).execute()
        ids = {h["properties"]["title"]: h["properties"]["sheetId"] for h in meta["sheets"]}

    svc.spreadsheets().values().clear(spreadsheetId=SHEET_ID, range=nombre, body={}).execute()
    svc.spreadsheets().values().update(
        spreadsheetId=SHEET_ID,
        range=f"{nombre}!A1",
        # USER_ENTERED para que las fórmulas se guarden como fórmulas.
        valueInputOption="USER_ENTERED",
        body={"values": filas},
    ).execute()

    hoja_id = ids[nombre]
    peticiones = [
        {
            "repeatCell": {
                "range": {"sheetId": hoja_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {
                    "userEnteredFormat": {
                        "textFormat": {"bold": True, "fontSize": 13},
                        "backgroundColor": {"red": 0.86, "green": 0.15, "blue": 0.15},
                    }
                },
                "fields": "userEnteredFormat(textFormat,backgroundColor)",
            }
        },
        {
            "repeatCell": {
                "range": {"sheetId": hoja_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"foregroundColor": {
                    "red": 1, "green": 1, "blue": 1}}}},
                "fields": "userEnteredFormat.textFormat.foregroundColor",
            }
        },
        {
            "updateSheetProperties": {
                "properties": {"sheetId": hoja_id, "gridProperties": {"frozenRowCount": 1}},
                "fields": "gridProperties.frozenRowCount",
            }
        },
        {
            "updateDimensionProperties": {
                "range": {"sheetId": hoja_id, "dimension": "COLUMNS",
                          "startIndex": 0, "endIndex": 1},
                "properties": {"pixelSize": 340},
                "fields": "pixelSize",
            }
        },
    ]

    # La columna de cobertura, en porcentaje.
    if nombre == "cobertura":
        peticiones.append(
            {
                "repeatCell": {
                    "range": {"sheetId": hoja_id, "startColumnIndex": 1, "endColumnIndex": 5},
                    "cell": {"userEnteredFormat": {"horizontalAlignment": "RIGHT"}},
                    "fields": "userEnteredFormat.horizontalAlignment",
                }
            }
        )
        peticiones.append(
            {
                "repeatCell": {
                    "range": {"sheetId": hoja_id, "startColumnIndex": 4, "endColumnIndex": 5},
                    "cell": {"userEnteredFormat": {"numberFormat": {
                        "type": "PERCENT", "pattern": "0%"}}},
                    "fields": "userEnteredFormat.numberFormat",
                }
            }
        )
        # B8 y B17 son las dos coberturas del resumen.
        for f in (7, 16):
            peticiones.append(
                {
                    "repeatCell": {
                        "range": {"sheetId": hoja_id, "startRowIndex": f, "endRowIndex": f + 1,
                                  "startColumnIndex": 1, "endColumnIndex": 2},
                        "cell": {"userEnteredFormat": {"numberFormat": {
                            "type": "PERCENT", "pattern": "0%"}}},
                        "fields": "userEnteredFormat.numberFormat",
                    }
                }
            )

    svc.spreadsheets().batchUpdate(spreadsheetId=SHEET_ID, body={"requests": peticiones}).execute()


if __name__ == "__main__":
    raise SystemExit(main())
