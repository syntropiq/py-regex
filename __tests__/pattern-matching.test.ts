// Comprehensive tests for pattern matching methods (fullmatch, match, search, test)
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';

describe('Pattern Matching Methods', () => {
  describe('Pattern.test()', () => {
    it('should return boolean for fullmatch semantics', async () => {
      const pattern = await regex.compile('\\d+');
      
      expect(pattern.test('123')).toBe(true);
      expect(pattern.test('abc')).toBe(false);
      expect(pattern.test('123abc')).toBe(false); // Partial match not allowed
      expect(pattern.test('abc123')).toBe(false); // Partial match not allowed
      expect(pattern.test('')).toBe(false);
    });

    it('should work with complex patterns', async () => {
      const pattern = await regex.compile('(?P<protocol>https?)://(?P<domain>[^/]+)');
      
      expect(pattern.test('http://example.com')).toBe(true);
      expect(pattern.test('https://example.com')).toBe(true);
      expect(pattern.test('ftp://example.com')).toBe(false);
      expect(pattern.test('http://example.com/path')).toBe(false); // Extra content
      expect(pattern.test('prefix http://example.com')).toBe(false); // Prefix
    });

    it('should handle Unicode text', async () => {
      const pattern = await regex.compile('[\\p{L}]+', 'u');
      
      expect(pattern.test('café')).toBe(true);
      expect(pattern.test('测试')).toBe(true);
      expect(pattern.test('🎉')).toBe(false); // Emoji is not a letter
      expect(pattern.test('123')).toBe(false);
    });
  });

  describe('Pattern.fullmatch()', () => {
    it('should return Match object for exact matches', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      
      const match = pattern.fullmatch('hello');
      expect(match).not.toBeNull();
      if (match) {
        expect(match.fullMatch).toBe('hello');
        expect(match.groups.word).toBe('hello');
        expect(match.group(0)).toBe('hello');
        expect(match.group('word')).toBe('hello');
      }
    });

    it('should return null for partial matches', async () => {
      const pattern = await regex.compile('test');
      
      expect(pattern.fullmatch('test')).not.toBeNull();
      expect(pattern.fullmatch('testing')).toBeNull();
      expect(pattern.fullmatch('pretest')).toBeNull();
      expect(pattern.fullmatch('pretesting')).toBeNull();
    });

    it('should handle empty strings and empty patterns', async () => {
      const emptyPattern = await regex.compile('');
      const pattern = await regex.compile('\\w*'); // Zero or more word chars
      
      expect(emptyPattern.fullmatch('')).not.toBeNull();
      expect(emptyPattern.fullmatch('a')).toBeNull();
      expect(pattern.fullmatch('')).not.toBeNull();
      expect(pattern.fullmatch('abc')).not.toBeNull();
    });

    it('should work with complex patterns and multiple groups', async () => {
      const pattern = await regex.compile('(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})');
      
      const match = pattern.fullmatch('2025-06-03');
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups.year).toBe('2025');
        expect(match.groups.month).toBe('06');
        expect(match.groups.day).toBe('03');
        expect(match.group(0)).toBe('2025-06-03');
        expect(match.group(1)).toBe('2025');
        expect(match.group(2)).toBe('06');
        expect(match.group(3)).toBe('03');
      }
    });

    it('should handle alternation patterns', async () => {
      const pattern = await regex.compile('(?P<color>red|green|blue)');
      
      const match1 = pattern.fullmatch('red');
      const match2 = pattern.fullmatch('green');
      const match3 = pattern.fullmatch('blue');
      const match4 = pattern.fullmatch('yellow');
      
      expect(match1?.groups.color).toBe('red');
      expect(match2?.groups.color).toBe('green');
      expect(match3?.groups.color).toBe('blue');
      expect(match4).toBeNull();
    });
  });

  describe('Pattern.match()', () => {
    it('should match from start of string', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      
      const match1 = pattern.match('hello world');
      const match2 = pattern.match(' hello');
      
      expect(match1).not.toBeNull();
      if (match1) {
        expect(match1.groups.word).toBe('hello');
        expect(match1.fullMatch).toBe('hello');
      }
      
      expect(match2).toBeNull(); // Doesn't start with word character
    });

    it('should handle patterns that consume full string', async () => {
      const pattern = await regex.compile('\\w+');
      
      const match1 = pattern.match('hello');
      const match2 = pattern.match('hello world');
      
      expect(match1?.fullMatch).toBe('hello');
      expect(match2?.fullMatch).toBe('hello'); // Only matches first word
    });

    it('should work with anchored patterns', async () => {
      const pattern = await regex.compile('^(?P<start>\\w+)');
      
      const match1 = pattern.match('hello world');
      const match2 = pattern.match(' hello world');
      
      expect(match1?.groups.start).toBe('hello');
      expect(match2).toBeNull(); // ^ requires start of string
    });

    it('should handle overlapping group scenarios', async () => {
      const pattern = await regex.compile('(?P<full>(?P<part1>\\w+)\\s+(?P<part2>\\w+))');
      
      const match = pattern.match('hello world extra');
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups.full).toBe('hello world');
        expect(match.groups.part1).toBe('hello');
        expect(match.groups.part2).toBe('world');
      }
    });

    it('should handle quantifiers and optional groups', async () => {
      const pattern = await regex.compile('(?P<protocol>https?)(?P<port>:\\d+)?');
      
      const match1 = pattern.match('http://example.com');
      const match2 = pattern.match('https:8080/path');
      
      expect(match1?.groups.protocol).toBe('http');
      expect(match1?.groups.port).toBeUndefined(); // Optional group not matched
      
      expect(match2?.groups.protocol).toBe('https');
      expect(match2?.groups.port).toBe(':8080');
    });
  });

  describe('Pattern.search()', () => {
    it('should find pattern anywhere in string', async () => {
      const pattern = await regex.compile('(?P<number>\\d+)');
      
      const match1 = pattern.search('abc 123 def');
      const match2 = pattern.search('123 at start');
      const match3 = pattern.search('at end 456');
      const match4 = pattern.search('no numbers here');
      
      expect(match1?.groups.number).toBe('123');
      expect(match2?.groups.number).toBe('123');
      expect(match3?.groups.number).toBe('456');
      expect(match4).toBeNull();
    });

    it('should find first occurrence when multiple matches exist', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      
      const match = pattern.search('first second third');
      expect(match?.groups.word).toBe('first');
    });

    it('should work with anchored patterns', async () => {
      const startPattern = await regex.compile('^(?P<start>\\w+)');
      const endPattern = await regex.compile('(?P<end>\\w+)$');
      
      const match1 = startPattern.search('hello world');
      const match2 = startPattern.search('  hello world');
      const match3 = endPattern.search('hello world');
      const match4 = endPattern.search('hello world  ');
      
      expect(match1?.groups.start).toBe('hello');
      expect(match2).toBeNull(); // ^ requires start of string
      expect(match3?.groups.end).toBe('world');
      expect(match4).toBeNull(); // $ requires end of string
    });

    it('should handle complex search patterns', async () => {
      const pattern = await regex.compile('(?P<email>[\\w.-]+@[\\w.-]+\\.[a-z]{2,})');
      const text = 'Contact us at info@example.com or support@test.org for help';
      
      const match = pattern.search(text);
      expect(match?.groups.email).toBe('info@example.com'); // First match
    });

    it('should work with lookbehind and lookahead', async () => {
      // Note: These might not work with fullmatch due to anchoring
      const pattern = await regex.compile('(?P<word>\\w+)(?=\\s)'); // Word followed by space
      
      const match = pattern.search('hello world test');
      expect(match?.groups.word).toBe('hello');
    });
  });

  describe('Method consistency and edge cases', () => {
    it('should handle the same pattern consistently across methods', async () => {
      const pattern = await regex.compile('(?P<num>\\d+)');
      const text = '123';
      
      expect(pattern.test(text)).toBe(true);
      expect(pattern.fullmatch(text)).not.toBeNull();
      expect(pattern.match(text)).not.toBeNull();
      expect(pattern.search(text)).not.toBeNull();
      
      // All should give same result for exact match
      const fullMatch = pattern.fullmatch(text);
      const match = pattern.match(text);
      const search = pattern.search(text);
      
      expect(fullMatch?.groups.num).toBe('123');
      expect(match?.groups.num).toBe('123');
      expect(search?.groups.num).toBe('123');
    });

    it('should behave differently for partial strings', async () => {
      const pattern = await regex.compile('\\d+');
      const text = '123abc';
      
      expect(pattern.test(text)).toBe(false); // fullmatch semantics
      expect(pattern.fullmatch(text)).toBeNull(); // fullmatch semantics
      expect(pattern.match(text)).not.toBeNull(); // matches from start
      expect(pattern.search(text)).not.toBeNull(); // finds anywhere
    });

    it('should handle patterns with no groups', async () => {
      const pattern = await regex.compile('\\d+');
      
      const match = pattern.match('123abc');
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups).toEqual({});
        expect(match.group(0)).toBe('123');
        expect(match.group(1)).toBeUndefined();
        expect(match.group('nonexistent')).toBeUndefined();
      }
    });

    it('should handle very long strings', async () => {
      const pattern = await regex.compile('(?P<end>end)');
      const longString = 'a'.repeat(10000) + 'end';
      
      expect(pattern.test(longString)).toBe(false); // Doesn't match full string
      expect(pattern.search(longString)?.groups.end).toBe('end');
    });

    it('should handle patterns with multiple named groups with same name', async () => {
      // This might be invalid, but let's see how it's handled
      const pattern = await regex.compile('(?P<same>\\w+)\\s+(?P<same>\\w+)');
      
      // This should probably throw an error during compilation
      // If it doesn't, we need to document the behavior
      await expect(async () => {
        await pattern.match('hello world');
      }).rejects.toThrow();
    });

    it('should handle nested groups properly', async () => {
      const pattern = await regex.compile('(?P<outer>a(?P<inner>b+)c)');
      
      const match = pattern.match('abbbc');
      expect(match?.groups.outer).toBe('abbbc');
      expect(match?.groups.inner).toBe('bbb');
    });

    it('should handle case sensitivity', async () => {
      const pattern = await regex.compile('(?P<word>[a-z]+)');
      
      expect(pattern.test('hello')).toBe(true);
      expect(pattern.test('HELLO')).toBe(false);
      expect(pattern.test('Hello')).toBe(false);
    });
  });
});
