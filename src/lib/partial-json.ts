/** Best-effort parse of JSON that is still being written.
 *
 *  A streamed model response is valid JSON only at the very end. To render
 *  bullets as they arrive we close whatever is currently open — strings,
 *  arrays, objects — and parse that. Anything half-written is dropped by the
 *  caller rather than shown.
 */
export function parsePartial<T = unknown>(text: string): T | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* still in flight — repair below */
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of trimmed) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{" || char === "[") stack.push(char);
    if (char === "}" || char === "]") stack.pop();
  }

  let repaired = trimmed;
  if (inString) repaired += '"';

  // Drop a trailing comma or a dangling key before closing.
  repaired = repaired.replace(/,\s*$/, "").replace(/,\s*"[^"]*"\s*:\s*$/, "");

  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]";
  }

  try {
    return JSON.parse(repaired) as T;
  } catch {
    return null;
  }
}
