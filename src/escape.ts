/**
 * Escape special regex characters in a string to match Python's re.escape() behavior
 * This includes escaping spaces, which is crucial for Python regex compatibility
 */
export function escapeRegex(str: string): string {
  // Include space in the character class to match Python's re.escape() behavior
  return str.replace(/[.*+?^${}()|[\]\\ ]/g, '\\$&');
}

/**
 * Insert edition_name in place of $edition placeholder.
 */
export function substituteEdition(regex: string, editionName: string): string {
  return regex.replace(/\$\{?edition\}?/g, escapeRegex(editionName));
}

/**
 * Insert edition strings for the given edition into a regex with an $edition placeholder.
 * Creates alternation groups for all variations of an edition.
 * 
 * Example:
 *     substituteEditions('\\d+ $edition \\d+', 'Foo.', {'Foo. Var.': 'Foo.'})
 *     Result: ["\\d+ (?:Foo\\.|Foo\\. Var\\.) \\d+"]
 */
export function substituteEditions(
  regex: string, 
  editionName: string, 
  variations: Record<string, string>
): string[] {
  if (!regex.includes('$edition') && !regex.includes('${edition}')) {
    return [regex];
  }
  
  const editionStrings = [editionName];
  for (const [k, v] of Object.entries(variations)) {
    if (v === editionName) {
      editionStrings.push(k);
    }
  }
  
  // Create a single regex with alternation group like Python does
  const escapedEditions = editionStrings.map(edition => escapeRegex(edition));
  const editionGroup = `(?:${escapedEditions.join('|')})`;
  const substitutedRegex = regex.replace(/\$\{?edition\}?/g, editionGroup);
  
  return [substitutedRegex];
}

/**
 * Get a PCRE pattern from pre-converted regex data with substitutions applied.
 * This navigates nested JSON structures to find regex patterns and applies variable substitutions.
 */
export function getPCREPatternFromData(
  regexData: any, 
  templatePath: string, 
  substitutions: Record<string, string> = {}
): string {
  // Navigate to the template in the regex data structure
  const pathParts = templatePath.split('.');
  let current = regexData;
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      throw new Error(`Template path '${templatePath}' not found in regex data`);
    }
  }
  
  // Handle nested structures where the actual pattern is in an empty string key
  if (typeof current === 'object' && '' in current) {
    current = current[''];
  }
  
  if (typeof current !== 'string') {
    throw new Error(`Template at '${templatePath}' is not a string pattern`);
  }
  
  let pattern = current;
  
  // Apply predefined variable substitutions from regex data
  const variableMap: Record<string, string> = {
    '$volume': regexData.volume?.[''] || '(?<volume>\\d+)',
    '$page': regexData.page?.[''] || '(?<page>\\d+)',
    '$page_with_commas': regexData.page?.with_commas || '(?<page>\\d(?:[\\d,]*\\d)?)',
    '$page_with_commas_and_suffix': regexData.page?.with_commas_and_suffix || '(?<page>\\d(?:[\\d,]*\\d)?[A-Z]?)',
    '$page_with_letter': regexData.page?.with_letter || '(?<page>\\d+[a-zA-Z])',
    '$page_with_periods': regexData.page?.with_periods || '(?<page>\\d(?:[\\d.]*\\d)?)',
    '$page_with_roman_numerals': regexData.page?.with_roman_numerals || '(?<page>[cC]?(?:[xX][cC]|[xX][lL]|[lL]?[xX]{1,3})(?:[iI][xX]|[iI][vV]|[vV]?[iI]{0,3})|(?:[cC]?[lL]?)(?:[iI][xX]|[iI][vV]|[vV]?[iI]{1,3})|(?:[lL][vV]|[cC][vV]|[cC][lL]|[cC][lL][vV]))',
    '$law_section': regexData.law?.section || '(?<section>(?:\\d+(?:[.:\\-]\\d+){0,3})|(?:\\d+(?:\\((?:[a-zA-Z]{1}|\\d{1,2})\\))+))',
    '$law_subject': regexData.law?.subject || '(?<subject>[A-Z][.\\-\'A-Za-z]*(?: [A-Z][.\\-\'A-Za-z]*| &){,4})',
    '$law_day': regexData.law?.day || '(?<day>\\d{1,2}),?',
    '$law_month': regexData.law?.month || '(?<month>[A-Z][a-z]+\\.?)',
    '$law_year': regexData.law?.year || '(?<year>1\\d{3}|20\\d{2})'
  };
  
  // Apply predefined variable substitutions
  for (const [variable, replacement] of Object.entries(variableMap)) {
    const regex = new RegExp(`\\$\\{?${variable.slice(1)}\\}?`, 'g');
    pattern = pattern.replace(regex, replacement);
  }
  
  // Apply custom substitutions passed as parameters
  for (const [key, value] of Object.entries(substitutions)) {
    const regex = new RegExp(`\\$\\{?${key}\\}?`, 'g');
    pattern = pattern.replace(regex, value);
  }
  
  return pattern;
}
