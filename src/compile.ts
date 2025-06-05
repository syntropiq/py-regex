import { PCRE, PCRERegex, PCREMatch } from '@syntropiq/libpcre-ts';

let _pcreInstance: any = null;
let _initPromise: Promise<any> | null = null;

/**
 * Get or create the singleton PCRE instance
 */
async function getPCREInstance(): Promise<any> {
  if (!_pcreInstance) {
    if (!_initPromise) {
      _initPromise = (async () => {
        const pcre = new PCRE();
        await pcre.init();
        _pcreInstance = pcre;
        return pcre;
      })();
    }
    await _initPromise;
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
  
  // Validate pattern before compilation
  if (!validatePattern(pattern)) {
    throw new Error(`Invalid regex pattern: '${pattern}'`);
  }
  
  // Convert named groups from Python to PCRE format
  const pcrePattern = convertNamedGroups(pattern);
  
  // Use ANCHORED and UTF8 options for Python-like fullmatch
  const opts = pcre.constants.ANCHORED | pcre.constants.UTF8;
  
  // Always anchor at both ends for fullmatch semantics
  const anchoredPattern = pcrePattern.startsWith('^') ? pcrePattern : '^' + pcrePattern;
  const finalPattern = anchoredPattern.endsWith('$') ? anchoredPattern : anchoredPattern + '$';
  
  try {
    return pcre.compile(finalPattern, opts);
  } catch (error: any) {
    throw new Error(`Failed to compile regex pattern '${pattern}': ${error?.message || error}`);
  }
}

/**
 * Compile a regex pattern using PCRE without fullmatch anchoring
 * Useful for partial matching or when you want to control anchoring manually
 */
export async function compileRegexPartial(pattern: string): Promise<PCRERegex> {
  const pcre = await getPCREInstance();
  
  // Validate pattern before compilation
  if (!validatePattern(pattern)) {
    throw new Error(`Invalid regex pattern: '${pattern}'`);
  }
  
  // Convert named groups from Python to PCRE format
  const pcrePattern = convertNamedGroups(pattern);
  
  // Use UTF8 option but not ANCHORED for partial matching (search functionality)
  const opts = pcre.constants.UTF8;
  
  try {
    return pcre.compile(pcrePattern, opts);
  } catch (error: any) {
    throw new Error(`Failed to compile regex pattern '${pattern}': ${error?.message || error}`);
  }
}

export async function compileRegexAnchored(pattern: string): Promise<PCRERegex> {
  const pcre = await getPCREInstance();
  
  // Validate pattern before compilation
  if (!validatePattern(pattern)) {
    throw new Error(`Invalid regex pattern: '${pattern}'`);
  }
  
  // Convert named groups from Python to PCRE format
  const pcrePattern = convertNamedGroups(pattern);
  
  // Use ANCHORED and UTF8 options for position-exact matching
  const opts = pcre.constants.ANCHORED | pcre.constants.UTF8;
  
  try {
    return pcre.compile(pcrePattern, opts);
  } catch (error: any) {
    throw new Error(`Failed to compile regex pattern '${pattern}': ${error?.message || error}`);
  }
}

/**
 * Validate regex pattern for common invalid constructs
 */
function validatePattern(pattern: string): boolean {
  // Check for invalid named group patterns
  const invalidNamedGroups = [
    /\(\?P<>\w*\)/,           // Empty named group (?P<>...)
    /\(\?P<\d+>/,             // Named group starting with digit (?P<123>...)
    /\(\?P<[^>]*$/,           // Unclosed named group (?P<name...
    /\(\?P\w+>/               // Malformed syntax (?Pname>...)
  ];
  
  for (const invalidPattern of invalidNamedGroups) {
    if (invalidPattern.test(pattern)) {
      return false;
    }
  }
  
  // Check for other invalid constructs
  const invalidConstructs = [
    /^\*/,                    // Starting with quantifier
    /\[(?![^\]]*\])/,         // Unclosed bracket
    /\((?![^)]*\))/           // Unclosed parenthesis (basic check)
  ];
  
  for (const invalidConstruct of invalidConstructs) {
    if (invalidConstruct.test(pattern)) {
      return false;
    }
  }
  
  return true;
}
