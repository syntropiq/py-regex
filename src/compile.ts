import { PCRE, PCRERegex, PCREMatch } from '@syntropiq/libpcre-ts';

let _pcreInstance: any = null;

/**
 * Get or create the singleton PCRE instance
 */
async function getPCREInstance(): Promise<any> {
  if (!_pcreInstance) {
    _pcreInstance = new PCRE();
    await _pcreInstance.init();
  }
  return _pcreInstance;
}

/**
 * Convert Python named capture groups (?P<name>...) to PCRE format (?<name>...)
 */
export function convertNamedGroups(pattern: string): string {
  return pattern.replace(/\(\?P<([^>]+)>/g, '(?<$1>');
}

/**
 * Compile a PCRE regex with fullmatch semantics (like Python's re.fullmatch).
 * Anchors the pattern at both ends and uses ANCHORED, UTF8, and UNICODE options.
 */
export async function compileRegex(pattern: string): Promise<PCRERegex> {
  const pcre = await getPCREInstance();
  
  // Convert named groups from Python to PCRE format
  const pcrePattern = convertNamedGroups(pattern);
  
  // Use ANCHORED and UTF8 options for Python-like fullmatch
  const opts = pcre.constants.ANCHORED | pcre.constants.UTF8;
  
  // Always anchor at both ends for fullmatch semantics
  const anchoredPattern = pcrePattern.startsWith('^') ? pcrePattern : '^' + pcrePattern;
  const finalPattern = anchoredPattern.endsWith('$') ? anchoredPattern : anchoredPattern + '$';
  
  return pcre.compile(finalPattern, opts);
}

/**
 * Compile a regex pattern using PCRE without fullmatch anchoring
 * Useful for partial matching or when you want to control anchoring manually
 */
export async function compileRegexPartial(pattern: string): Promise<PCRERegex> {
  const pcre = await getPCREInstance();
  
  // Convert named groups from Python to PCRE format
  const pcrePattern = convertNamedGroups(pattern);
  
  // Use UTF8 option but not ANCHORED for partial matching
  const opts = pcre.constants.UTF8;
  
  return pcre.compile(pcrePattern, opts);
}
