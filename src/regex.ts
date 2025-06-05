// Pythonic regex API wrapper for py-regex
import { compileRegex, compileRegexPartial, compileRegexAnchored, convertNamedGroups } from './compile';
import { escapeRegex } from './escape';

export interface Match {
  group(nameOrIndex: string | number): string | undefined;
  groups: Record<string, string>;
  fullMatch: string;
}

export interface Pattern {
  fullmatch(text: string): Match | null;
  match(text: string): Match | null;
  search(text: string): Match | null;
  test(text: string): boolean;
}

function makeMatch(pcreMatch: import('@syntropiq/libpcre-ts').PCREMatch[], namedGroups: { [name: string]: number }): Match {
  // Map group names to values
  const groups: Record<string, string> = {};
  for (const [name, idx] of Object.entries(namedGroups || {})) {
    if (pcreMatch[idx] && pcreMatch[idx].value !== undefined) {
      groups[name] = pcreMatch[idx].value;
    }
  }
  // group(0) is the full match
  return {
    group(nameOrIndex: string | number) {
      if (typeof nameOrIndex === 'number') {
        return pcreMatch[nameOrIndex]?.value;
      } else if (nameOrIndex in groups) {
        return groups[nameOrIndex];
      }
      return undefined;
    },
    groups,
    fullMatch: pcreMatch[0]?.value || '',
  };
}

async function compile(pattern: string, flags?: string): Promise<Pattern> {
  // TODO: support flags
  const fullmatchRegex = await compileRegex(pattern);
  const partialRegex = await compileRegexPartial(pattern);
  const anchoredRegex = await compileRegexAnchored(pattern);
  const namedGroups = fullmatchRegex.getNamedGroups() || {};
  
  return {
    fullmatch(text: string) {
      const m = fullmatchRegex.exec(text);
      if (!m) return null;
      return makeMatch(m, namedGroups);
    },
    match(text: string) {
      // Use anchored regex for position-exact matching at start of string
      const m = anchoredRegex.exec(text, 0);
      if (!m) return null;
      return makeMatch(m, namedGroups);
    },
    search(text: string) {
      // Use partial regex for finding matches anywhere in string
      const m = partialRegex.exec(text);
      if (!m) return null;
      return makeMatch(m, namedGroups);
    },
    test(text: string) {
      return fullmatchRegex.test(text, 0);
    },
  };
}

export const regex = {
  compile,
  escape: escapeRegex,
};
