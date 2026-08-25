"""
Convierte el material (diapositivas y manual) a imágenes para mostrarlo dentro
de la plataforma.

Por qué imágenes y no el PDF embebido: en el navegador del celular el visor de
PDF a veces no renderiza y termina descargando el archivo, que es justo lo que
no queremos en campo. Además pesan mucho menos: las 16 diapositivas pasan de
7,3 MB a ~860 KB, y el manual de 4,1 MB a ~1,8 MB, y se cargan una por una.

Uso:
    python scripts/generar_imagenes.py [ruta-a-soffice]

Necesita LibreOffice para convertir el .pptx a PDF (el manual ya es PDF), y
PyMuPDF para rasterizar. Escribe en public/material/ y genera un indice.json
con la cantidad de páginas de cada cosa.
"""

import io
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Falta PyMuPDF. Instálalo con:")
    print("    pip install pymupdf")
    raise SystemExit(1)

RAIZ = Path(__file__).resolve().parent.parent
MATERIAL = RAIZ / "material"
DESTINO = RAIZ / "public" / "material"

# 96 dpi y calidad 78 es el punto donde el texto de las diapositivas sigue
# legible en un celular y cada página pesa ~50 KB.
DPI = 96
CALIDAD = 78

SOFFICE_POSIBLES = [
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
]

PIEZAS = [
    # (carpeta destino, archivo fuente, ¿hay que convertirlo a PDF primero?)
    ("diapositivas", "presentacion_capacitacion_v2.pptx", True),
    ("manual", "IT-OPE-C-12_instructivo_generacion_automatica_reportes_rev01.pdf", False),
]


def _encontrar_soffice() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1]
    for ruta in SOFFICE_POSIBLES:
        if Path(ruta).exists():
            return ruta
    encontrado = shutil.which("soffice") or shutil.which("libreoffice")
    if encontrado:
        return encontrado
    print("No encontré LibreOffice. Pásalo como argumento:")
    print("    python scripts/generar_imagenes.py 'C:/Program Files/LibreOffice/program/soffice.exe'")
    raise SystemExit(1)


def _a_pdf(origen: Path, temporal: Path) -> Path:
    soffice = _encontrar_soffice()
    subprocess.run(
        [soffice, "--headless", "--norestore", "--convert-to", "pdf",
         "--outdir", str(temporal), str(origen)],
        check=True, capture_output=True,
    )
    pdf = temporal / (origen.stem + ".pdf")
    if not pdf.exists():
        raise SystemExit(f"LibreOffice no produjo {pdf}")
    return pdf


def main() -> int:
    indice = {}

    with tempfile.TemporaryDirectory() as tmp:
        temporal = Path(tmp)

        for carpeta, archivo, convertir in PIEZAS:
            origen = MATERIAL / archivo
            if not origen.exists():
                print(f'FALTA: {origen}')
                return 1

            pdf = _a_pdf(origen, temporal) if convertir else origen
            salida = DESTINO / carpeta
            salida.mkdir(parents=True, exist_ok=True)

            # Se borran las imágenes anteriores para que no queden páginas
            # huérfanas si el documento encoge.
            for viejo in salida.glob("*.jpg"):
                viejo.unlink()

            doc = fitz.open(pdf)
            pesos = 0
            for n in range(len(doc)):
                pix = doc[n].get_pixmap(dpi=DPI)
                datos = pix.tobytes("jpeg", jpg_quality=CALIDAD)
                nombre = salida / ("%02d.jpg" % (n + 1))
                io.open(nombre, "wb").write(datos)
                pesos += len(datos)

            indice[carpeta] = len(doc)
            print(f'{carpeta}: {len(doc)} páginas, {round(pesos / 1024)} KB')
            doc.close()

    io.open(DESTINO / "indice.json", "w", encoding="utf-8").write(
        json.dumps(indice, indent=2) + "\n"
    )
    print(f"\nÍndice: {DESTINO / 'indice.json'}")
    print(json.dumps(indice))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
