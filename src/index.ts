export { compileRegex, compileRegexPartial, convertNamedGroups } from './pcre-compiler.js';
export { 
  escapeRegex, 
  substituteEdition, 
  substituteEditions, 
  getPCREPatternFromData 
} from './regex-utils.js';
export type { 
  RegexMatch, 
  PCRECompileOptions, 
  SubstitutionContext 
} from './types.js';
