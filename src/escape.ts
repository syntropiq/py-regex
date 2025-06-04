/**
 * Escape special regex characters in a string to match Python's re.escape() behavior
 * This includes escaping spaces, which is crucial for Python regex compatibility
 */
export function escapeRegex(str: string): string {
  // Include space in the character class to match Python's re.escape() behavior
  return str.replace(/[.*+?^${}()|[\]\\ ]/g, '\\$&');
}