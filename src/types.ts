/**
 * Type definitions for PCRE utilities
 * Note: These types are placeholders - projects using this must install @syntropiq/libpcre-ts
 */

// Placeholder types for when @syntropiq/libpcre-ts is not available during build
// These will be overridden by the actual types when the library is installed
export interface PCRE {
  init(): Promise<void>;
  compile(pattern: string, flags?: number): PCRERegex;
  constants: {
    ANCHORED: number;
    UTF8: number;
  };
}

export interface PCRERegex {
  match(text: string): any;
  test(text: string): boolean;
}

/**
 * Basic regex match result interface
 */
export interface RegexMatch {
  matched: boolean;
  groups?: Record<string, string>;
  fullMatch?: string;
}

/**
 * Configuration for PCRE compilation
 */
export interface PCRECompileOptions {
  anchored?: boolean;
  utf8?: boolean;
  caseInsensitive?: boolean;
  multiline?: boolean;
}

/**
 * Template substitution context
 */
export interface SubstitutionContext {
  variables: Record<string, string>;
  regexData?: any;
  customSubstitutions?: Record<string, string>;
}
