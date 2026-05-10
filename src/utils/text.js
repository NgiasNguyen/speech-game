/**
 * Lowercase, trim, collapse spaces.
 * @param {string} value
 */
export function basicNormalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove Vietnamese diacritics for fuzzy matching.
 * @param {string} value
 */
export function foldVietnamese(value) {
  return basicNormalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

/**
 * Text used for comparing user speech to accepted answers.
 * @param {string} value
 */
export function normalizeForMatch(value) {
  return foldVietnamese(value);
}
