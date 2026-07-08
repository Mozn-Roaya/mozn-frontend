/**
 * Tiny dependency-free fuzzy matcher for the command palette. Does a
 * subsequence match (every query char must appear in order) and scores the
 * quality of the match so results can be ranked: consecutive runs, matches at
 * word boundaries, and prefix matches all score higher. Returns the matched
 * character indices too, so callers can highlight the hit.
 *
 * Kept intentionally small — this powers a client-side palette over a handful
 * of nav items and a few hundred stations, not a search backend.
 */

export interface FuzzyMatch {
  score: number;
  /** Indices in `text` that matched, ascending. Empty for an empty query. */
  indices: number[];
}

// Word boundary = start of string or right after a separator. Matches there
// read as "the start of a word" and are weighted up (e.g. "ms" → "MyStation").
function isBoundary(text: string, i: number): boolean {
  if (i === 0) return true;
  const prev = text[i - 1];
  return prev === " " || prev === "-" || prev === "_" || prev === "/" || prev === "(";
}

/**
 * Score how well `query` fuzzy-matches `text`. Returns null when `text` doesn't
 * contain `query` as a subsequence. An empty query matches everything with a
 * neutral score (so callers can show a default list). Case-insensitive.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.trim().toLowerCase();
  if (!q) return { score: 0, indices: [] };

  const t = text.toLowerCase();
  const indices: number[] = [];

  let score = 0;
  let ti = 0;
  let prevMatch = -2; // index of the previous matched char in `text`

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;

    // Base point for the match.
    score += 1;
    // Adjacent to the previous match → strong signal of a real substring.
    if (found === prevMatch + 1) score += 6;
    // Landing on a word boundary is meaningful even across a gap.
    if (isBoundary(text, found)) score += 4;
    // Reward matches that stay near the front of the string.
    if (found < 4) score += 2;
    // Small penalty for skipped characters between matches.
    if (prevMatch >= 0) score -= Math.min(found - prevMatch - 1, 4);

    indices.push(found);
    prevMatch = found;
    ti = found + 1;
  }

  // Exact prefix and whole-string matches jump to the top.
  if (t.startsWith(q)) score += 12;
  if (t === q) score += 20;
  // Shorter targets are more specific for the same match, nudge them up.
  score += Math.max(0, 8 - Math.floor(text.length / 6));

  return { score, indices };
}

/**
 * Score a record against `query` by taking the best match across its
 * `keywords`, then (optionally) report the match indices on `label` alone so
 * only the visible text is highlighted. Returns null if no keyword matches.
 */
export function fuzzyRank(
  query: string,
  label: string,
  keywords: string[],
): FuzzyMatch | null {
  let best: FuzzyMatch | null = null;
  for (const kw of keywords) {
    const m = fuzzyMatch(query, kw);
    if (m && (!best || m.score > best.score)) best = m;
  }
  if (!best) return null;
  // Highlight against the displayed label; may differ from the winning keyword
  // (e.g. matched the Arabic name or region), in which case there's no highlight.
  const onLabel = fuzzyMatch(query, label);
  return { score: best.score, indices: onLabel?.indices ?? [] };
}
