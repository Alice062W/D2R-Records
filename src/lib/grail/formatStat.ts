// d2r.world prefixes additive-bonus stats with a "+" (e.g. "+20 to Strength",
// "+70% Enhanced Defense") that this project's data previously dropped
// entirely. The generator marks which stat codes get this treatment via a
// `signed` flag (see ADDITIVE_SIGN_CODES in scripts/generate-grail-data.mjs);
// these helpers apply it consistently across every stat renderer. Negative
// values already render their own "-" via plain number-to-string, so this
// only ever adds a "+", never touches negatives.
export function signedValue(value: number, signed?: boolean): string {
  return signed && value >= 0 ? `+${value}` : String(value);
}

export function signedRange(min: number, max: number, signed?: boolean): string {
  if (signed && min >= 0 && max >= 0) return `+${min}–${max}`;
  return `${min}–${max}`;
}
