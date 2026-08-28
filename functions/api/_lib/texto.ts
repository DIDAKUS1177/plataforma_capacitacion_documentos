/**
 * El Excel de RR. HH. viene todo en MAYÚSCULAS SOSTENIDAS. Se pasa a formato
 * normal para que la constancia no parezca un grito, respetando las partículas
 * que en español van en minúscula.
 */

const MINUSCULAS = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "o", "u",
  "en", "con", "para", "por", "sin", "a", "al", "da", "do",
]);

export function titulo(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra, i) =>
      i > 0 && MINUSCULAS.has(palabra)
        ? palabra
        : palabra.charAt(0).toUpperCase() + palabra.slice(1),
    )
    .join(" ");
}
