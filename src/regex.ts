// Pythonic regex API wrapper for py-regex
import { compileRegex, compileRegexPartial, convertNamedGroups } from './compile';
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
  const namedGroups = fullmatchRegex.getNamedGroups() || {};
  
  return {
    fullmatch(text: string) {
      const m = fullmatchRegex.exec(text);
      if (!m) return null;
      return makeMatch(m, namedGroups);
    },
    match(text: string) {
      const m = partialRegex.exec(text);
      if (!m) return null;
      // Match must start at index 0
      if (m[0] && m[0].index === 0) {
        return makeMatch(m, namedGroups);
      }
      return null;
    },
    search(text: string) {
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
