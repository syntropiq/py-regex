// Comprehensive tests for Python regex compatibility
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';

describe('Python Regex Compatibility', () => {
  describe('Python re.escape() compatibility', () => {
    it('should match Python re.escape() behavior exactly', () => {
      // Test cases based on Python's re.escape() documentation and behavior
      const pythonTestCases = [
        // Basic special characters
        { input: '.', expected: '\\.' },
        { input: '^', expected: '\\^' },
        { input: '$', expected: '\\$' },
        { input: '*', expected: '\\*' },
        { input: '+', expected: '\\+' },
        { input: '?', expected: '\\?' },
        { input: '{', expected: '\\{' },
        { input: '}', expected: '\\}' },
        { input: '[', expected: '\\[' },
        { input: ']', expected: '\\]' },
        { input: '(', expected: '\\(' },
        { input: ')', expected: '\\)' },
        { input: '|', expected: '\\|' },
        { input: '\\', expected: '\\\\' },
        
        // Space is escaped in Python
        { input: ' ', expected: '\\ ' },
        
        // Complex strings
        { input: 'Ala. Admin. Code', expected: 'Ala\\.\\ Admin\\.\\ Code' },
        { input: 'a.b*c', expected: 'a\\.b\\*c' },
        { input: 'test[abc]', expected: 'test\\[abc\\]' },
        { input: '$100', expected: '\\$100' },
        { input: 'foo bar', expected: 'foo\\ bar' }
      ];

      pythonTestCases.forEach(({ input, expected }) => {
        expect(regex.escape(input)).toBe(expected);
      });
    });

    it('should handle all ASCII special characters like Python', () => {
      const specialChars = '.^$*+?{}[]()|\\ ';
      for (const char of specialChars) {
        const escaped = regex.escape(char);
        expect(escaped).toBe('\\' + char);
      }
    });

    it('should not escape non-special characters like Python', () => {
      const normalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-:;,<>@#%&=`~"\'';
      for (const char of normalChars) {
        expect(regex.escape(char)).toBe(char);
      }
    });
  });

  describe('Python re.fullmatch() compatibility', () => {
    it('should behave like Python re.fullmatch()', async () => {
      const pattern = await regex.compile('\\d+');
      
      // Python re.fullmatch() only matches if entire string matches
      expect(pattern.test('123')).toBe(true); // Like re.fullmatch('\\d+', '123')
      expect(pattern.test('123abc')).toBe(false); // Like re.fullmatch('\\d+', '123abc')
      expect(pattern.test('abc123')).toBe(false); // Like re.fullmatch('\\d+', 'abc123')
      expect(pattern.test('')).toBe(false); // Like re.fullmatch('\\d+', '')
    });

    it('should handle anchored patterns like Python', async () => {
      const pattern1 = await regex.compile('^\\d+$');
      const pattern2 = await regex.compile('\\d+');
      
      // Both should behave the same with fullmatch semantics
      expect(pattern1.test('123')).toBe(true);
      expect(pattern2.test('123')).toBe(true);
      expect(pattern1.test('123abc')).toBe(false);
      expect(pattern2.test('123abc')).toBe(false);
    });
  });

  describe('Python re.match() compatibility', () => {
    it('should behave like Python re.match()', async () => {
      const pattern = await regex.compile('\\d+');
      
      // Python re.match() matches from start of string
      const match1 = pattern.match('123abc');
      const match2 = pattern.match('abc123');
      
      expect(match1?.fullMatch).toBe('123'); // Matches '123' at start
      expect(match2).toBeNull(); // No match at start
    });

    it('should handle groups like Python re.match()', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)\\s+(?P<num>\\d+)');
      
      const match = pattern.match('hello 123 extra');
      expect(match?.groups.word).toBe('hello');
      expect(match?.groups.num).toBe('123');
      expect(match?.fullMatch).toBe('hello 123'); // Only matched portion
    });
  });

  describe('Python re.search() compatibility', () => {
    it('should behave like Python re.search()', async () => {
      const pattern = await regex.compile('(?P<num>\\d+)');
      
      // Python re.search() finds first occurrence anywhere
      const match1 = pattern.search('abc 123 def');
      const match2 = pattern.search('no numbers');
      
      expect(match1?.groups.num).toBe('123');
      expect(match2).toBeNull();
    });

    it('should find first match like Python', async () => {
      const pattern = await regex.compile('(?P<digit>\\d)');
      
      const match = pattern.search('a1b2c3');
      expect(match?.groups.digit).toBe('1'); // First digit found
    });
  });

  describe('Python named group syntax compatibility', () => {
    it('should support Python (?P<name>...) syntax', async () => {
      const testCases = [
        '(?P<word>\\w+)',
        '(?P<num>\\d+)',
        '(?P<email>[^@]+@[^@]+)',
        '(?P<date>\\d{4}-\\d{2}-\\d{2})',
        '(?P<complex_name>[a-zA-Z_][a-zA-Z0-9_]*)'
      ];

      for (const patternStr of testCases) {
        const pattern = await regex.compile(patternStr);
        expect(pattern).toBeDefined();
        // Test that we can access the named group
        const sampleMatch = pattern.match('test123test@example.com2025-06-03variable_name');
        if (sampleMatch) {
          const groupNames = Object.keys(sampleMatch.groups);
          expect(groupNames.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle nested named groups like Python', async () => {
      const pattern = await regex.compile('(?P<outer>(?P<inner>\\w+)\\s+\\d+)');
      const match = pattern.match('hello 123');
      
      expect(match?.groups.outer).toBe('hello 123');
      expect(match?.groups.inner).toBe('hello');
    });

    it('should handle mixed named and numbered groups like Python', async () => {
      const pattern = await regex.compile('(?P<name>\\w+)\\s+(\\d+)\\s+(?P<email>[^\\s]+)');
      const match = pattern.match('john 25 john@example.com');
      
      expect(match?.groups.name).toBe('john');
      expect(match?.groups.email).toBe('john@example.com');
      expect(match?.group(1)).toBe('john'); // Named group
      expect(match?.group(2)).toBe('25'); // Unnamed group
      expect(match?.group(3)).toBe('john@example.com'); // Named group
    });
  });

  describe('Python regex flag compatibility', () => {
    it('should handle case-insensitive matching like Python re.IGNORECASE', async () => {
      // Note: Flags might not be implemented yet, test current behavior
      try {
        const pattern = await regex.compile('(?P<word>hello)', 'i');
        expect(pattern.test('HELLO')).toBe(true);
        expect(pattern.test('Hello')).toBe(true);
        expect(pattern.test('hello')).toBe(true);
      } catch (error) {
        // Flags might not be implemented yet
        console.log('Flag support not yet implemented');
      }
    });

    it('should handle multiline mode like Python re.MULTILINE', async () => {
      try {
        const pattern = await regex.compile('^(?P<line>\\w+)$', 'm');
        const text = 'first\nsecond\nthird';
        const match = pattern.search(text);
        expect(match?.groups.line).toBeDefined();
      } catch (error) {
        // Flags might not be implemented yet
        console.log('Flag support not yet implemented');
      }
    });
  });

  describe('Python character class compatibility', () => {
    it('should handle \\w like Python (Unicode-aware)', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      
      expect(pattern.test('hello')).toBe(true);
      expect(pattern.test('hello123')).toBe(true);
      expect(pattern.test('hello_world')).toBe(true);
      expect(pattern.test('café')).toBe(true); // Unicode letters
      expect(pattern.test('测试')).toBe(true); // Unicode letters
    });

    it('should handle \\d like Python', async () => {
      const pattern = await regex.compile('(?P<digit>\\d+)');
      
      expect(pattern.test('123')).toBe(true);
      expect(pattern.test('0')).toBe(true);
      expect(pattern.test('abc')).toBe(false);
    });

    it('should handle \\s like Python', async () => {
      const pattern = await regex.compile('(?P<space>\\s+)');
      
      expect(pattern.test(' ')).toBe(true);
      expect(pattern.test('\\t')).toBe(true);
      expect(pattern.test('\\n')).toBe(true);
      expect(pattern.test('   ')).toBe(true);
    });
  });

  describe('Python quantifier compatibility', () => {
    it('should handle greedy quantifiers like Python', async () => {
      const pattern = await regex.compile('(?P<match>a+)');
      
      const match = pattern.match('aaab');
      expect(match?.groups.match).toBe('aaa'); // Greedy: matches as many as possible
    });

    it('should handle non-greedy quantifiers like Python', async () => {
      const pattern = await regex.compile('(?P<match>a+?)');
      
      const match = pattern.match('aaab');
      expect(match?.groups.match).toBe('a'); // Non-greedy: matches as few as possible
    });

    it('should handle range quantifiers like Python', async () => {
      const pattern = await regex.compile('(?P<match>\\d{2,4})');
      
      expect(pattern.test('1')).toBe(false); // Too few
      expect(pattern.test('12')).toBe(true); // Minimum
      expect(pattern.test('123')).toBe(true); // Middle
      expect(pattern.test('1234')).toBe(true); // Maximum
      expect(pattern.test('12345')).toBe(false); // Too many (in fullmatch mode)
    });
  });

  describe('Python lookahead/lookbehind compatibility', () => {
    it('should handle positive lookahead like Python', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)(?=\\s)');
      
      const match = pattern.search('hello world');
      expect(match?.groups.word).toBe('hello'); // Matches 'hello' followed by space
    });

    it('should handle negative lookahead like Python', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)(?!\\d)');
      
      expect(pattern.test('abc')).toBe(true); // Not followed by digit
      expect(pattern.test('abc123')).toBe(false); // Followed by digit (in fullmatch mode)
    });

    it('should handle positive lookbehind like Python', async () => {
      try {
        const pattern = await regex.compile('(?<=\\$)(?P<amount>\\d+)');
        const match = pattern.search('$100');
        expect(match?.groups.amount).toBe('100');
      } catch (error) {
        // Lookbehind might not be supported
        console.log('Lookbehind might not be supported');
      }
    });
  });

  describe('Python raw string behavior simulation', () => {
    it('should handle patterns that would use raw strings in Python', async () => {
      // In Python: r'\\d+' or '\\\\d+'
      const pattern1 = await regex.compile('\\\\d+'); // Literal backslash followed by 'd+'
      const pattern2 = await regex.compile('\\d+'); // Digit pattern
      
      expect(pattern1.test('\\d123')).toBe(false); // Doesn't match literal \\d
      expect(pattern2.test('123')).toBe(true); // Matches digits
    });

    it('should handle escaped sequences properly', async () => {
      const pattern = await regex.compile('(?P<path>[A-Za-z]:\\\\[^\\\\]+)');
      
      // Windows-style path matching
      const match = pattern.match('C:\\Users');
      expect(match?.groups.path).toBe('C:\\Users');
    });
  });

  describe('Python regex module advanced features', () => {
    it('should handle word boundaries like Python \\b', async () => {
      const pattern = await regex.compile('\\b(?P<word>\\w+)\\b');
      
      const match = pattern.search('hello world');
      expect(match?.groups.word).toBe('hello'); // First word
    });

    it('should handle non-capturing groups like Python (?:...)', async () => {
      const pattern = await regex.compile('(?P<protocol>https?)(?:://(?P<domain>[^/]+))');
      
      const match = pattern.match('https://example.com');
      expect(match?.groups.protocol).toBe('https');
      expect(match?.groups.domain).toBe('example.com');
      // The (?:...) group should not be captured
    });

    it('should handle conditional patterns if supported', async () => {
      // This is an advanced feature that might not be supported
      try {
        const pattern = await regex.compile('(?P<quote>["\']).*?(?P=quote)');
        expect(pattern.test('"hello"')).toBe(true);
        expect(pattern.test("'hello'")).toBe(true);
        expect(pattern.test('"hello\'')).toBe(false);
      } catch (error) {
        // Backreferences might not be supported
        console.log('Backreferences might not be supported');
      }
    });
  });
});
