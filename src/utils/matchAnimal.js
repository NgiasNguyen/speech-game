import { normalizeForMatch } from "./text.js";

/**
 * @param {string} spokenRaw
 * @param {{ answer: string, aliases: string[] }} animal
 */
export function doesTranscriptMatchAnimal(spokenRaw, animal) {
  const spoken = normalizeForMatch(spokenRaw);
  if (!spoken) return false;

  const needles = /** @type {string[]} */ ([
    animal.answer,
    ...(animal.aliases || []),
  ])
    .map((s) => normalizeForMatch(s))
    .filter(Boolean);

  for (const n of needles) {
    if (!n) continue;
    if (spoken === n || spoken.includes(n)) return true;
  }
  return false;
}
