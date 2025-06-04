// Comprehensive tests for compilation functionality
import { describe, it, expect } from 'vitest';
import { compileRegex, compileRegexPartial, convertNamedGroups } from '../src/compile';

describe('Compilation Functionality', () => {
  describe('convertNamedGroups()', () => {
    it('should convert Python named groups to PCRE format', () => {
      expect(convertNamedGroups('(?P<name>\\w+)')).toBe('(?<name>\\w+)');
      expect(convertNamedGroups('(?P<first>\\w+) (?P<last>\\w+)')).toBe('(?<first>\\w+) (?<last>\\w+)');
      expect(convertNamedGroups('(?P<date>\\d{4}-\\d{2}-\\d{2})')).toBe('(?<date>\\d{4}-\\d{2}-\\d{2})');
    });

    it('should handle patterns without named groups', () => {
      expect(convertNamedGroups('\\d+')).toBe('\\d+');
      expect(convertNamedGroups('(\\w+)')).toBe('(\\w+)');
      expect(convertNamedGroups('(?:non-capturing)')).toBe('(?:non-capturing)');
    });

    it('should handle mixed patterns', () => {
      expect(convertNamedGroups('(?P<name>\\w+) and (\\d+)')).toBe('(?<name>\\w+) and (\\d+)');
      expect(convertNamedGroups('start (?P<middle>\\w+) end')).toBe('start (?<middle>\\w+) end');
    });

    it('should handle multiple named groups', () => {
      const input = '(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})';
      const expected = '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})';
      expect(convertNamedGroups(input)).toBe(expected);
    });

    it('should handle complex group names', () => {
      expect(convertNamedGroups('(?P<group_name>\\w+)')).toBe('(?<group_name>\\w+)');
      expect(convertNamedGroups('(?P<group123>\\w+)')).toBe('(?<group123>\\w+)');
      expect(convertNamedGroups('(?P<CamelCase>\\w+)')).toBe('(?<CamelCase>\\w+)');
    });

    it('should handle edge cases', () => {
      expect(convertNamedGroups('')).toBe('');
      expect(convertNamedGroups('no groups here')).toBe('no groups here');
      expect(convertNamedGroups('(?P<a>x)(?P<b>y)')).toBe('(?<a>x)(?<b>y)');
    });
  });

  describe('compileRegex() - fullmatch semantics', () => {
    it('should compile basic patterns with anchoring', async () => {
      const regex = await compileRegex('\\d+');
      expect(regex.test('123', 0)).toBe(true);
      expect(regex.test('abc123', 0)).toBe(false); // Should not match partial
      expect(regex.test('123abc', 0)).toBe(false); // Should not match partial
    });

    it('should handle already anchored patterns', async () => {
      const regex1 = await compileRegex('^\\d+');
      const regex2 = await compileRegex('\\d+$');
      const regex3 = await compileRegex('^\\d+$');
      
      expect(regex1.test('123', 0)).toBe(true);
      expect(regex2.test('123', 0)).toBe(true);
      expect(regex3.test('123', 0)).toBe(true);
      
      expect(regex1.test('abc123', 0)).toBe(false);
      expect(regex2.test('123abc', 0)).toBe(false);
      expect(regex3.test('abc123abc', 0)).toBe(false);
    });

    it('should compile patterns with named groups', async () => {
      const regex = await compileRegex('(?P<name>\\w+)');
      const match = regex.exec('john');
      expect(match).not.toBeNull();
      if (match) {
        expect(match[0].value).toBe('john');
        const namedGroups = regex.getNamedGroups();
        expect(namedGroups).toHaveProperty('name');
      }
    });

    it('should handle complex patterns', async () => {
      const regex = await compileRegex('(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})');
      expect(regex.test('2025-06-03', 0)).toBe(true);
      expect(regex.test('25-06-03', 0)).toBe(false); // Wrong year format
      expect(regex.test('2025-6-3', 0)).toBe(false); // Wrong month/day format
      expect(regex.test('prefix2025-06-03', 0)).toBe(false); // Partial match
    });

    it('should handle Unicode patterns', async () => {
      const regex = await compileRegex('café|测试');
      expect(regex.test('café', 0)).toBe(true);
      expect(regex.test('测试', 0)).toBe(true);
      expect(regex.test('other', 0)).toBe(false);
    });

    it('should handle character classes and quantifiers', async () => {
      const regex = await compileRegex('[a-z]+\\d{2,4}');
      expect(regex.test('abc123', 0)).toBe(true);
      expect(regex.test('xyz99', 0)).toBe(true);
      expect(regex.test('test9999', 0)).toBe(true);
      expect(regex.test('ABC123', 0)).toBe(false); // Uppercase
      expect(regex.test('abc1', 0)).toBe(false); // Too few digits
      expect(regex.test('abc12345', 0)).toBe(false); // Too many digits
    });
  });

  describe('compileRegexPartial() - partial matching', () => {
    it('should allow partial matches', async () => {
      const regex = await compileRegexPartial('\\d+');
      expect(regex.test('123', 0)).toBe(true);
      expect(regex.test('abc123', 0)).toBe(false); // Doesn't start at position 0
      expect(regex.test('abc123', 3)).toBe(true); // Matches at position 3
      expect(regex.test('123abc', 0)).toBe(true); // Matches at start
    });

    it('should work without automatic anchoring', async () => {
      const regex = await compileRegexPartial('test');
      expect(regex.test('test', 0)).toBe(true);
      expect(regex.test('testing', 0)).toBe(true);
      expect(regex.test('pretest', 0)).toBe(false); // Doesn't start at 0
      expect(regex.test('pretest', 3)).toBe(true); // Matches at position 3
    });

    it('should handle named groups in partial mode', async () => {
      const regex = await compileRegexPartial('(?P<word>\\w+)');
      const match1 = regex.exec('hello world');
      const match2 = regex.exec('start hello');
      
      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();
      
      if (match1) {
        expect(match1[0].value).toBe('hello');
        const namedGroups = regex.getNamedGroups();
        expect(namedGroups).toHaveProperty('word');
      }
    });

    it('should handle overlapping matches', async () => {
      const regex = await compileRegexPartial('\\d{2}');
      expect(regex.test('12345', 0)).toBe(true); // Matches '12'
      expect(regex.test('12345', 1)).toBe(true); // Matches '23'
      expect(regex.test('12345', 2)).toBe(true); // Matches '34'
      expect(regex.test('12345', 3)).toBe(true); // Matches '45'
      expect(regex.test('12345', 4)).toBe(false); // Only one digit left
    });

    it('should handle anchored patterns in partial mode', async () => {
      const regex1 = await compileRegexPartial('^test');
      const regex2 = await compileRegexPartial('test$');
      
      // ^ should still anchor to start of string
      expect(regex1.test('test', 0)).toBe(true);
      expect(regex1.test('testing', 0)).toBe(true);
      expect(regex1.test('pretest', 0)).toBe(false);
      
      // $ should still anchor to end of string
      expect(regex2.test('test', 0)).toBe(true);
      expect(regex2.test('pretest', 0)).toBe(false); // Starts at wrong position
      expect(regex2.test('pretest', 3)).toBe(true); // Matches at end
      expect(regex2.test('testing', 0)).toBe(false); // Doesn't end with 'test'
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty patterns', async () => {
      const regex1 = await compileRegex('');
      const regex2 = await compileRegexPartial('');
      
      expect(regex1.test('', 0)).toBe(true);
      expect(regex1.test('anything', 0)).toBe(false);
      expect(regex2.test('', 0)).toBe(true);
      expect(regex2.test('anything', 0)).toBe(true); // Empty pattern matches at any position
    });

    it('should handle invalid regex patterns gracefully', async () => {
      // These should throw errors during compilation
      await expect(compileRegex('[')).rejects.toThrow();
      await expect(compileRegex('(?P<>invalid)')).rejects.toThrow();
      await expect(compileRegex('(?P<123>invalid)')).rejects.toThrow();
      await expect(compileRegexPartial('*invalid')).rejects.toThrow();
    });

    it('should handle very long patterns', async () => {
      const longPattern = 'a'.repeat(1000);
      const regex = await compileRegex(longPattern);
      const longText = 'a'.repeat(1000);
      const shortText = 'a'.repeat(999);
      
      expect(regex.test(longText, 0)).toBe(true);
      expect(regex.test(shortText, 0)).toBe(false);
    });

    it('should handle complex nested groups', async () => {
      const pattern = '(?P<outer>(?P<inner>\\w+)\\s+(\\d+))';
      const regex = await compileRegex(pattern);
      const match = regex.exec('test 123');
      
      expect(match).not.toBeNull();
      if (match) {
        const namedGroups = regex.getNamedGroups();
        expect(namedGroups).toHaveProperty('outer');
        expect(namedGroups).toHaveProperty('inner');
      }
    });

    it('should handle patterns with special PCRE features', async () => {
      // Test some PCRE-specific features that should work
      const regex1 = await compileRegex('(?:non-capturing)');
      const regex2 = await compileRegex('\\w+(?=\\s)'); // Positive lookahead
      const regex3 = await compileRegex('\\w+(?!\\d)'); // Negative lookahead
      
      expect(regex1.test('non-capturing', 0)).toBe(true);
      expect(regex2.test('word space', 0)).toBe(false); // fullmatch fails due to space
      expect(regex3.test('word123', 0)).toBe(false);
      expect(regex3.test('word', 0)).toBe(true);
    });
  });
});
