/**
 * @template T
 * @param {T[]} arr
 */
export function randomItem(arr) {
  if (!arr.length) return undefined;
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}
