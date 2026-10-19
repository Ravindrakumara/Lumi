/** Moves a persisted store from its old localStorage key to a new one.
 *
 * The stores were keyed "rav-ai-*" from before the product was named Lumi.
 * Renaming the key outright would have signed every existing user out and
 * reset their settings, because zustand would look under the new name and
 * find nothing - so the old value is carried across once, the first time
 * the app runs after the rename. */
export function adoptLegacyKey(legacyKey: string, currentKey: string): void {
  try {
    if (localStorage.getItem(currentKey) !== null) return;
    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue === null) return;
    localStorage.setItem(currentKey, legacyValue);
    localStorage.removeItem(legacyKey);
  } catch {
    // Private mode / blocked storage: not worth breaking startup over.
    // Worst case the user signs in again.
  }
}
