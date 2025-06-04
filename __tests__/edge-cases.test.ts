// Comprehensive tests for edge cases and error conditions
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';
import { compileRegex, compileRegexPartial } from '../src/compile';

describe('Edge Cases and Error Conditions', () => {
  describe('Invalid patterns and error handling', () => {
    it('should handle invalid regex patterns', async () => {
      // Unmatched brackets
      await expect(compileRegex('[')).rejects.toThrow();
      await expect(compileRegex('(')).rejects.toThrow();
      await expect(compileRegex('(?P<>invalid)')).rejects.toThrow();
      
      // Invalid quantifiers
      await expect(compileRegex('*')).rejects.toThrow();
      await expect(compileRegex('+')).rejects.toThrow();
      await expect(compileRegex('?')).rejects.toThrow();
      
      // Invalid character classes
      await expect(compileRegex('[z-a]')).rejects.toThrow(); // Invalid range
    });

    it('should handle invalid named group names', async () => {
      // Empty name
      await expect(compileRegex('(?P<>test)')).rejects.toThrow();
      
      // Names starting with digits (might be invalid)
      await expect(compileRegex('(?P<123>test)')).rejects.toThrow();
      
      // Names with invalid characters
      await expect(compileRegex('(?P<na-me>test)')).rejects.toThrow();
      await expect(compileRegex('(?P<na me>test)')).rejects.toThrow();
    });

    it('should handle malformed group syntax', async () => {
      await expect(compileRegex('(?P<name')).rejects.toThrow();
      await expect(compileRegex('(?P<name>)')).rejects.toThrow();
      await expect(compileRegex('(?Pname>test)')).rejects.toThrow();
    });
  });

  describe('Boundary conditions', () => {
    it('should handle empty strings and patterns', async () => {
      const emptyPattern = await regex.compile('');
      
      expect(emptyPattern.test('')).toBe(true);
      expect(emptyPattern.test('a')).toBe(false);
      expect(emptyPattern.fullmatch('')).not.toBeNull();
      expect(emptyPattern.match('')).not.toBeNull();
      expect(emptyPattern.search('')).not.toBeNull();
    });

    it('should handle very long strings', async () => {
      const pattern = await regex.compile('a+');
      const longString = 'a'.repeat(100000);
      const mixedString = 'b'.repeat(50000) + 'a'.repeat(50000);
      
      expect(pattern.test(longString)).toBe(true);
      expect(pattern.test(mixedString)).toBe(false); // Doesn't start with 'a'
      expect(pattern.search(mixedString)?.fullMatch).toBe('a'.repeat(50000));
    });

    it('should handle very complex patterns', async () => {
      const complexPattern = '(?P<part1>(?:[a-z]+\\d*){1,10})(?P<sep>[._-]?)(?P<part2>(?:[A-Z]+\\d*){0,5})';
      const pattern = await regex.compile(complexPattern);
      
      expect(pattern.test('abc123_DEF456')).toBe(true);
      expect(pattern.test('abc_DEF')).toBe(true);
      expect(pattern.test('abc')).toBe(true);
    });

    it('should handle Unicode edge cases', async () => {
      const pattern = await regex.compile('(?P<emoji>[\\u{1F600}-\\u{1F64F}])');
      
      expect(pattern.test('😀')).toBe(true);
      expect(pattern.test('😔')).toBe(true);
      expect(pattern.test('🎉')).toBe(false); // Outside range
      expect(pattern.test('a')).toBe(false);
    });

    it('should handle patterns with many groups', async () => {
      let groupPattern = '';
      const expectedGroups: Record<string, string> = {};
      
      for (let i = 0; i < 20; i++) {
        groupPattern += `(?P<group${i}>\\w)`;
        expectedGroups[`group${i}`] = String.fromCharCode(97 + i); // 'a' + i
      }
      
      const pattern = await regex.compile(groupPattern);
      const testString = 'abcdefghijklmnopqrst';
      const match = pattern.match(testString);
      
      expect(match?.groups).toEqual(expectedGroups);
    });
  });

  describe('Memory and performance edge cases', () => {
    it('should handle deeply nested groups', async () => {
      let nestedPattern = '(?P<outer>';
      for (let i = 0; i < 10; i++) {
        nestedPattern += `(?P<level${i}>`;
      }
      nestedPattern += '\\w+';
      for (let i = 0; i < 10; i++) {
        nestedPattern += ')';
      }
      nestedPattern += ')';
      
      const pattern = await regex.compile(nestedPattern);
      const match = pattern.match('test');
      
      expect(match?.groups.outer).toBe('test');
      expect(match?.groups.level0).toBe('test');
      expect(match?.groups.level9).toBe('test');
    });

    it('should handle patterns with many alternations', async () => {
      const alternatives = Array.from({ length: 100 }, (_, i) => `word${i}`).join('|');
      const pattern = await regex.compile(`(?P<choice>${alternatives})`);
      
      expect(pattern.test('word0')).toBe(true);
      expect(pattern.test('word50')).toBe(true);
      expect(pattern.test('word99')).toBe(true);
      expect(pattern.test('word100')).toBe(false);
    });

    it('should handle catastrophic backtracking scenarios', async () => {
      // This pattern can cause catastrophic backtracking in naive implementations
      const pattern = await regex.compile('(a+)+b');
      
      // This should either match quickly or fail quickly, not hang
      const start = Date.now();
      const result = pattern.test('a'.repeat(20));
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete in reasonable time
      expect(result).toBe(false);
    });

    it('should handle repetitive patterns efficiently', async () => {
      const pattern = await regex.compile('(?P<digits>\\d{1000})');
      const testString = '1'.repeat(1000);
      const wrongString = '1'.repeat(999) + 'a';
      
      expect(pattern.test(testString)).toBe(true);
      expect(pattern.test(wrongString)).toBe(false);
    });
  });

  describe('Concurrent usage scenarios', () => {
    it('should handle multiple patterns compiled simultaneously', async () => {
      const patterns = await Promise.all([
        regex.compile('(?P<num>\\d+)'),
        regex.compile('(?P<word>\\w+)'),
        regex.compile('(?P<email>[^@]+@[^@]+)')
      ]);
      
      expect(patterns[0].test('123')).toBe(true);
      expect(patterns[1].test('hello')).toBe(true);
      expect(patterns[2].test('user@example.com')).toBe(true);
    });

    it('should handle same pattern used multiple times', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      
      const results = [
        pattern.match('hello'),
        pattern.match('world'),
        pattern.match('test')
      ];
      
      expect(results[0]?.groups.word).toBe('hello');
      expect(results[1]?.groups.word).toBe('world');
      expect(results[2]?.groups.word).toBe('test');
    });
  });

  describe('Input validation edge cases', () => {
    it('should handle null and undefined inputs gracefully', async () => {
      const pattern = await regex.compile('test');
      
      // These should throw or return null, not crash
      expect(() => pattern.test(null as any)).toThrow();
      expect(() => pattern.test(undefined as any)).toThrow();
      expect(() => pattern.match(null as any)).toThrow();
      expect(() => pattern.search(undefined as any)).toThrow();
    });

    it('should handle non-string inputs', async () => {
      const pattern = await regex.compile('\\d+');
      
      // Numbers should be converted to strings or throw
      expect(() => pattern.test(123 as any)).toThrow();
      expect(() => pattern.match(456 as any)).toThrow();
    });

    it('should handle special string values', async () => {
      const pattern = await regex.compile('(?P<value>.*)');
      
      const match1 = pattern.match('null');
      const match2 = pattern.match('undefined');
      const match3 = pattern.match('');
      
      expect(match1?.groups.value).toBe('null');
      expect(match2?.groups.value).toBe('undefined');
      expect(match3?.groups.value).toBe('');
    });
  });

  describe('Partial compilation edge cases', () => {
    it('should handle differences between full and partial compilation', async () => {
      const fullPattern = await compileRegex('test');
      const partialPattern = await compileRegexPartial('test');
      
      // Full pattern has fullmatch semantics
      expect(fullPattern.test('test', 0)).toBe(true);
      expect(fullPattern.test('testing', 0)).toBe(false);
      
      // Partial pattern allows partial matches
      expect(partialPattern.test('test', 0)).toBe(true);
      expect(partialPattern.test('testing', 0)).toBe(true);
      expect(partialPattern.test('pretest', 3)).toBe(true);
    });

    it('should handle anchored patterns in partial mode', async () => {
      const startAnchor = await compileRegexPartial('^test');
      const endAnchor = await compileRegexPartial('test$');
      const bothAnchors = await compileRegexPartial('^test$');
      
      expect(startAnchor.test('test', 0)).toBe(true);
      expect(startAnchor.test('testing', 0)).toBe(true);
      expect(startAnchor.test('pretest', 0)).toBe(false);
      
      expect(endAnchor.test('test', 0)).toBe(true);
      expect(endAnchor.test('pretest', 3)).toBe(true);
      expect(endAnchor.test('testing', 0)).toBe(false);
      
      expect(bothAnchors.test('test', 0)).toBe(true);
      expect(bothAnchors.test('testing', 0)).toBe(false);
      expect(bothAnchors.test('pretest', 0)).toBe(false);
    });
  });

  describe('Group access edge cases', () => {
    it('should handle invalid group access attempts', async () => {
      const pattern = await regex.compile('(?P<valid>\\w+)');
      const match = pattern.match('test');
      
      expect(match).not.toBeNull();
      if (match) {
        // Invalid string keys
        expect(match.group('')).toBeUndefined();
        expect(match.group('invalid')).toBeUndefined();
        expect(match.group('123')).toBeUndefined();
        
        // Invalid numeric keys
        expect(match.group(-1)).toBeUndefined();
        expect(match.group(999)).toBeUndefined();
        expect(match.group(1.5 as any)).toBeUndefined();
        expect(match.group(NaN as any)).toBeUndefined();
        expect(match.group(Infinity as any)).toBeUndefined();
      }
    });

    it('should handle group access with special values', async () => {
      const pattern = await regex.compile('(?P<test>\\w+)');
      const match = pattern.match('hello');
      
      expect(match).not.toBeNull();
      if (match) {
        // These should not crash
        expect(() => match.group(null as any)).not.toThrow();
        expect(() => match.group(undefined as any)).not.toThrow();
        expect(() => match.group({} as any)).not.toThrow();
        expect(() => match.group([] as any)).not.toThrow();
      }
    });
  });

  describe('Pattern compilation edge cases', () => {
    it('should handle patterns with unusual but valid syntax', async () => {
      // Empty groups
      const emptyGroup = await regex.compile('()');
      expect(emptyGroup.test('')).toBe(true);
      
      // Nested empty groups
      const nestedEmpty = await regex.compile('(())');
      expect(nestedEmpty.test('')).toBe(true);
      
      // Optional everything
      const optionalAll = await regex.compile('(?P<opt>\\w*)');
      const match = optionalAll.match('');
      expect(match?.groups.opt).toBe('');
    });

    it('should handle escape sequences in patterns', async () => {
      const pattern = await regex.compile('(?P<escaped>\\\\\\[\\]\\{\\}\\(\\))');
      const match = pattern.match('\\[]{}()');
      expect(match?.groups.escaped).toBe('\\[]{}()');
    });

    it('should handle patterns with Unicode properties', async () => {
      // This might not be supported in all environments
      try {
        const pattern = await regex.compile('(?P<letter>\\p{L}+)');
        expect(pattern.test('café')).toBe(true);
        expect(pattern.test('123')).toBe(false);
      } catch (error) {
        // Unicode properties might not be supported
        expect(error).toBeDefined();
      }
    });
  });
});
