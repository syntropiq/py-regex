// Comprehensive tests for regex escaping functionality
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';
import { escapeRegex } from '../src/escape';

describe('Escape Functionality', () => {
  describe('regex.escape()', () => {
    it('should escape basic special characters', () => {
      expect(regex.escape('.')).toBe('\\.');
      expect(regex.escape('*')).toBe('\\*');
      expect(regex.escape('+')).toBe('\\+');
      expect(regex.escape('?')).toBe('\\?');
      expect(regex.escape('^')).toBe('\\^');
      expect(regex.escape('$')).toBe('\\$');
      expect(regex.escape('{')).toBe('\\{');
      expect(regex.escape('}')).toBe('\\}');
      expect(regex.escape('(')).toBe('\\(');
      expect(regex.escape(')')).toBe('\\)');
      expect(regex.escape('|')).toBe('\\|');
      expect(regex.escape('[')).toBe('\\[');
      expect(regex.escape(']')).toBe('\\]');
      expect(regex.escape('\\')).toBe('\\\\');
    });

    it('should escape spaces (Python-compatible behavior)', () => {
      expect(regex.escape(' ')).toBe('\\ ');
      expect(regex.escape('foo bar')).toBe('foo\\ bar');
      expect(regex.escape('  ')).toBe('\\ \\ ');
      expect(regex.escape('a b c')).toBe('a\\ b\\ c');
    });

    it('should handle complex strings with multiple special characters', () => {
      expect(regex.escape('Ala. Admin. Code')).toBe('Ala\\.\\ Admin\\.\\ Code');
      expect(regex.escape('a.b*c')).toBe('a\\.b\\*c');
      expect(regex.escape('test[abc]')).toBe('test\\[abc\\]');
      expect(regex.escape('$100')).toBe('\\$100');
      expect(regex.escape('(test)*')).toBe('\\(test\\)\\*');
      expect(regex.escape('a^b$c')).toBe('a\\^b\\$c');
      expect(regex.escape('a{1,2}')).toBe('a\\{1,2\\}');
      expect(regex.escape('a|b')).toBe('a\\|b');
      expect(regex.escape('a\\b')).toBe('a\\\\b');
    });

    it('should handle empty strings and non-special characters', () => {
      expect(regex.escape('')).toBe('');
      expect(regex.escape('abc')).toBe('abc');
      expect(regex.escape('123')).toBe('123');
      expect(regex.escape('_')).toBe('_');
      expect(regex.escape('-')).toBe('-');
      expect(regex.escape(':')).toBe(':');
      expect(regex.escape(';')).toBe(';');
      expect(regex.escape('"')).toBe('"');
      expect(regex.escape("'")).toBe("'");
    });

    it('should handle Unicode characters', () => {
      expect(regex.escape('café')).toBe('café');
      expect(regex.escape('测试')).toBe('测试');
      expect(regex.escape('🎉')).toBe('🎉');
      expect(regex.escape('café.test')).toBe('café\\.test');
      expect(regex.escape('测试 space')).toBe('测试\\ space');
    });

    it('should handle mixed content', () => {
      expect(regex.escape('Version 1.2.3 (build-123)')).toBe('Version\\ 1\\.2\\.3\\ \\(build-123\\)');
      expect(regex.escape('regex: /^test$/')).toBe('regex:\\ /\\^test\\$/');
      expect(regex.escape('price: $29.99')).toBe('price:\\ \\$29\\.99');
      expect(regex.escape('query?param=value&other=123')).toBe('query\\?param=value&other=123');
    });

    it('should handle strings with newlines and tabs', () => {
      expect(regex.escape('line1\nline2')).toBe('line1\nline2');
      expect(regex.escape('col1\tcol2')).toBe('col1\tcol2');
      expect(regex.escape('line1\rline2')).toBe('line1\rline2');
      expect(regex.escape('a.\nb*\tc')).toBe('a\\.\nb\\*\tc');
    });
  });

  describe('escapeRegex() direct import', () => {
    it('should work the same as regex.escape()', () => {
      const testStrings = [
        'simple',
        'a.b*c',
        'foo bar',
        'Ala. Admin. Code',
        '$100 (USD)',
        'regex: /^test$/',
        '',
        'café.test'
      ];

      testStrings.forEach(str => {
        expect(escapeRegex(str)).toBe(regex.escape(str));
      });
    });
  });

  describe('Escaped strings should work in actual regex patterns', async () => {
    it('should allow literal matching of special characters', async () => {
      const text = 'Price: $29.99 (USD)';
      const escaped = regex.escape(text);
      const pattern = await regex.compile(escaped);
      
      expect(pattern.test(text)).toBe(true);
      expect(pattern.test('Price: 29.99 (USD)')).toBe(false); // $ missing
      expect(pattern.test('Price: $29.99')).toBe(false); // (USD) missing
    });

    it('should work with partial matches in larger patterns', async () => {
      const literal = 'test[abc]';
      const escaped = regex.escape(literal);
      const pattern = await regex.compile(`Start ${escaped} End`);
      
      expect(pattern.test('Start test[abc] End')).toBe(true);
      expect(pattern.test('Start testx End')).toBe(false); // [abc] is literal, not a character class
      expect(pattern.test('Start testa End')).toBe(false);
    });

    it('should preserve spaces correctly in patterns', async () => {
      const text = 'foo bar baz';
      const escaped = regex.escape(text);
      const pattern = await regex.compile(escaped);
      
      expect(pattern.test('foo bar baz')).toBe(true);
      expect(pattern.test('foo  bar baz')).toBe(false); // extra space
      expect(pattern.test('foobarbaz')).toBe(false); // no spaces
    });
  });
});
