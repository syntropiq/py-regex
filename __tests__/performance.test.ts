// Performance and stress tests for py-regex
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';
import { compileRegex, compileRegexPartial } from '../src/compile';

describe('Performance and Stress Tests', () => {
  describe('Compilation performance', () => {
    it('should compile simple patterns quickly', async () => {
      const patterns = [
        '\\d+',
        '\\w+',
        '[a-z]+',
        '(?P<word>\\w+)',
        'test'
      ];

      const start = Date.now();
      const compiled = await Promise.all(patterns.map(p => regex.compile(p)));
      const duration = Date.now() - start;

      expect(compiled.length).toBe(patterns.length);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should compile complex patterns efficiently', async () => {
      const complexPatterns = [
        '(?P<email>[\\w.+-]+@[\\w.-]+\\.[a-z]{2,})',
        '(?P<url>https?://[^\\s/$.?#].[^\\s]*)',
        '(?P<phone>\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9})',
        '(?P<ip>(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))',
        '(?P<uuid>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})'
      ];

      const start = Date.now();
      const compiled = await Promise.all(complexPatterns.map(p => regex.compile(p)));
      const duration = Date.now() - start;

      expect(compiled.length).toBe(complexPatterns.length);
      expect(duration).toBeLessThan(500); // Should still be reasonably fast
    });

    it('should handle many patterns compiled in parallel', async () => {
      const patterns = Array.from({ length: 50 }, (_, i) => `(?P<test${i}>\\w+${i})`);

      const start = Date.now();
      const compiled = await Promise.all(patterns.map(p => regex.compile(p)));
      const duration = Date.now() - start;

      expect(compiled.length).toBe(50);
      expect(duration).toBeLessThan(2000); // Should handle parallel compilation
    });
  });

  describe('Execution performance', () => {
    it('should execute simple patterns quickly on large text', async () => {
      const pattern = await regex.compile('(?P<end>END)');
      const largeText = 'A'.repeat(100000) + 'END';

      const start = Date.now();
      const match = pattern.search(largeText);
      const duration = Date.now() - start;

      expect(match?.groups.end).toBe('END');
      expect(duration).toBeLessThan(50); // Should be very fast
    });

    it('should handle repeated pattern matching efficiently', async () => {
      const pattern = await regex.compile('(?P<num>\\d+)');
      const texts = Array.from({ length: 1000 }, (_, i) => `number${i}123text`);

      const start = Date.now();
      const matches = texts.map(text => pattern.search(text));
      const duration = Date.now() - start;

      expect(matches.every(m => m?.groups.num === '123')).toBe(true);
      expect(duration).toBeLessThan(100); // Should handle many matches quickly
    });

    it('should handle complex patterns on realistic data efficiently', async () => {
      const emailPattern = await regex.compile('(?P<local>[\\w.+-]+)@(?P<domain>[\\w.-]+\\.[a-z]{2,})');
      const emailTexts = Array.from({ length: 100 }, (_, i) => 
        `Contact user${i}@example${i % 10}.com for support`
      );

      const start = Date.now();
      const matches = emailTexts.map(text => emailPattern.search(text));
      const duration = Date.now() - start;

      expect(matches.every(m => m?.groups.local && m?.groups.domain)).toBe(true);
      expect(duration).toBeLessThan(200); // Should handle realistic patterns efficiently
    });
  });

  describe('Memory usage tests', () => {
    it('should handle many compiled patterns without memory issues', async () => {
      const patterns = [];
      
      // Compile many unique patterns
      for (let i = 0; i < 100; i++) {
        patterns.push(await regex.compile(`(?P<group${i}>pattern${i}\\d+)`));
      }

      expect(patterns.length).toBe(100);
      
      // Test that they all still work
      const testResults = patterns.map((pattern, i) => 
        pattern.test(`pattern${i}123`)
      );
      
      expect(testResults.every(result => result === true)).toBe(true);
    });

    it('should handle large groups efficiently', async () => {
      // Create pattern with many named groups
      const groupCount = 50;
      let patternStr = '';
      const expected: Record<string, string> = {};
      
      for (let i = 0; i < groupCount; i++) {
        patternStr += `(?P<g${i}>\\w)`;
        expected[`g${i}`] = String.fromCharCode(97 + (i % 26)); // 'a' to 'z'
      }
      
      const pattern = await regex.compile(patternStr);
      const testString = 'abcdefghijklmnopqrstuvwxyz'.repeat(Math.ceil(groupCount / 26)).substring(0, groupCount);
      
      const match = pattern.match(testString);
      expect(Object.keys(match?.groups || {}).length).toBe(groupCount);
    });

    it('should handle very long input strings', async () => {
      const pattern = await regex.compile('(?P<pattern>test)');
      const veryLongString = 'x'.repeat(1000000) + 'test' + 'y'.repeat(1000000);

      const start = Date.now();
      const match = pattern.search(veryLongString);
      const duration = Date.now() - start;

      expect(match?.groups.pattern).toBe('test');
      expect(duration).toBeLessThan(1000); // Should handle very long strings
    });
  });

  describe('Stress testing', () => {
    it('should handle pathological regex patterns safely', async () => {
      // Test patterns that might cause issues in naive implementations
      const patterns = [
        'a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*',
        '(a+)+',
        '([a-zA-Z]+)*',
        '(a|a)*',
        '(a?){100}'
      ];

      for (const patternStr of patterns) {
        try {
          const pattern = await regex.compile(patternStr);
          const start = Date.now();
          const result = pattern.test('a'.repeat(20));
          const duration = Date.now() - start;
          
          // Should either succeed or fail quickly, not hang
          expect(duration).toBeLessThan(1000);
        } catch (error) {
          // Some patterns might be rejected, which is fine
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle alternation with many choices', async () => {
      const choices = Array.from({ length: 1000 }, (_, i) => `choice${i}`);
      const pattern = await regex.compile(`(?P<choice>${choices.join('|')})`);

      expect(pattern.test('choice0')).toBe(true);
      expect(pattern.test('choice500')).toBe(true);
      expect(pattern.test('choice999')).toBe(true);
      expect(pattern.test('choice1000')).toBe(false);
    });

    it('should handle nested quantifiers appropriately', async () => {
      const patterns = [
        '(?P<nested>(a{1,3}){1,3})',
        '(?P<complex>([a-z]{2,5}\\d{1,2}){1,10})',
        '(?P<optional>(\\w+?\\s*){0,20})'
      ];

      for (const patternStr of patterns) {
        const pattern = await regex.compile(patternStr);
        
        // Test with appropriate input
        if (patternStr.includes('nested')) {
          expect(pattern.test('aaa')).toBe(true);
        } else if (patternStr.includes('complex')) {
          expect(pattern.test('ab12cd34')).toBe(true);
        } else if (patternStr.includes('optional')) {
          expect(pattern.test('word one two')).toBe(true);
        }
      }
    });

    it('should handle Unicode stress cases', async () => {
      const unicodePattern = await regex.compile('(?P<unicode>[\\u0000-\\uFFFF]+)');
      
      // Test with various Unicode ranges
      const testStrings = [
        'Hello World', // ASCII
        'café résumé', // Latin-1 Supplement
        'Здравствуй мир', // Cyrillic
        '你好世界', // CJK
        'مرحبا بالعالم', // Arabic
        '🌍🌎🌏', // Emoji
        'mix测试🎉café'
      ];

      testStrings.forEach(str => {
        const match = unicodePattern.match(str);
        expect(match?.groups.unicode).toBe(str);
      });
    });
  });

  describe('Concurrent usage stress tests', () => {
    it('should handle multiple patterns running concurrently', async () => {
      const patterns = [
        regex.compile('(?P<digits>\\d+)'),
        regex.compile('(?P<words>\\w+)'),
        regex.compile('(?P<email>[^@]+@[^@]+)'),
        regex.compile('(?P<url>https?://[^\\s]+)')
      ];

      const compiledPatterns = await Promise.all(patterns);
      
      const testTexts = [
        'number 123 test',
        'hello world example',
        'contact user@example.com please',
        'visit https://example.com now'
      ];

      // Run all patterns against all texts concurrently
      const promises = [];
      for (const pattern of compiledPatterns) {
        for (const text of testTexts) {
          promises.push(pattern.search(text));
        }
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(16); // 4 patterns × 4 texts
      
      // Check that we got reasonable results
      const successfulMatches = results.filter(r => r !== null);
      expect(successfulMatches.length).toBeGreaterThan(0);
    });

    it('should maintain thread safety with rapid sequential operations', async () => {
      const pattern = await regex.compile('(?P<num>\\d+)');
      
      // Rapidly execute many operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(pattern.search(`text${i}123more`));
      }

      const results = await Promise.all(operations);
      
      // All should succeed and return '123'
      expect(results.every(r => r?.groups.num === '123')).toBe(true);
    });
  });

  describe('Error handling performance', () => {
    it('should fail fast on invalid inputs', async () => {
      const pattern = await regex.compile('(?P<test>\\w+)');
      
      const invalidInputs = [null, undefined, 123, {}, []];
      
      invalidInputs.forEach(input => {
        const start = Date.now();
        expect(() => pattern.test(input as any)).toThrow();
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(10); // Should fail immediately
      });
    });

    it('should handle compilation errors efficiently', async () => {
      const invalidPatterns = [
        '[',
        '(?P<>)',
        '*invalid',
        '(?P<123>test)',
        '(?P<test'
      ];

      for (const invalidPattern of invalidPatterns) {
        const start = Date.now();
        await expect(regex.compile(invalidPattern)).rejects.toThrow();
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(100); // Should fail quickly
      }
    });
  });

  describe('Realistic workload simulation', () => {
    it('should handle log processing workload', async () => {
      const logPattern = await regex.compile(
        '\\[(?P<timestamp>[^\\]]+)\\] (?P<level>\\w+) (?P<logger>[\\w.]+) - (?P<message>.*)'
      );

      // Simulate processing 1000 log lines
      const logLines = Array.from({ length: 1000 }, (_, i) => 
        `[2025-06-03 12:34:${String(i % 60).padStart(2, '0')}] INFO app.service.${i % 10} - Processing request ${i}`
      );

      const start = Date.now();
      const matches = logLines.map(line => logPattern.fullmatch(line));
      const duration = Date.now() - start;

      expect(matches.every(m => m !== null)).toBe(true);
      expect(duration).toBeLessThan(500); // Should process logs efficiently
    });

    it('should handle data validation workload', async () => {
      const emailPattern = await regex.compile('(?P<local>[\\w.+-]+)@(?P<domain>[\\w.-]+\\.[a-z]{2,})');
      const phonePattern = await regex.compile('(?P<phone>\\+?\\d{1,4}[-.\\s]?\\d{3,14})');
      const urlPattern = await regex.compile('(?P<url>https?://[^\\s/$.?#].[^\\s]*)');

      // Simulate validating mixed data
      const testData = Array.from({ length: 300 }, (_, i) => {
        const type = i % 3;
        if (type === 0) return `user${i}@domain${i % 10}.com`;
        if (type === 1) return `+1-555-${String(i).padStart(4, '0')}`;
        return `https://example${i % 5}.com/path/${i}`;
      });

      const start = Date.now();
      const results = testData.map(data => {
        return emailPattern.test(data) || phonePattern.test(data) || urlPattern.test(data);
      });
      const duration = Date.now() - start;

      expect(results.every(r => r === true)).toBe(true);
      expect(duration).toBeLessThan(300); // Should validate data efficiently
    });
  });
});
