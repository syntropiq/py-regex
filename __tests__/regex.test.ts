// Integration tests for py-regex: Real-world usage scenarios
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';

describe('py-regex: Integration Tests', () => {
  describe('Real-world pattern examples', () => {
    it('should parse legal citations', async () => {
      const pattern = await regex.compile('(?P<volume>\\d+) (?P<reporter>[A-Za-z.]+) (?P<page>\\d+)');
      const citation = '123 F.2d 456';
      const match = pattern.fullmatch(citation);
      
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups.volume).toBe('123');
        expect(match.groups.reporter).toBe('F.2d');
        expect(match.groups.page).toBe('456');
      }
    });

    it('should validate and parse email addresses', async () => {
      const pattern = await regex.compile('(?P<local>[\\w.+-]+)@(?P<domain>[\\w.-]+\\.[a-z]{2,})');
      
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org'
      ];
      
      const invalidEmails = [
        'invalid.email',
        '@domain.com',
        'user@',
        'user@.com'
      ];
      
      validEmails.forEach(email => {
        const match = pattern.fullmatch(email);
        expect(match).not.toBeNull();
        expect(match?.groups.local).toBeDefined();
        expect(match?.groups.domain).toBeDefined();
      });
      
      invalidEmails.forEach(email => {
        expect(pattern.fullmatch(email)).toBeNull();
      });
    });

    it('should parse ISO 8601 datetime strings', async () => {
      const pattern = await regex.compile(
        '(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})T' +
        '(?P<hour>\\d{2}):(?P<minute>\\d{2}):(?P<second>\\d{2})' +
        '(?:\\.(?P<fraction>\\d+))?(?P<timezone>Z|[+-]\\d{2}:\\d{2})?'
      );
      
      const datetime1 = '2025-06-03T12:34:56Z';
      const datetime2 = '2025-06-03T12:34:56.123456+05:30';
      const datetime3 = '2025-06-03T12:34:56';
      
      const match1 = pattern.fullmatch(datetime1);
      expect(match1?.groups.year).toBe('2025');
      expect(match1?.groups.timezone).toBe('Z');
      
      const match2 = pattern.fullmatch(datetime2);
      expect(match2?.groups.fraction).toBe('123456');
      expect(match2?.groups.timezone).toBe('+05:30');
      
      const match3 = pattern.fullmatch(datetime3);
      expect(match3?.groups.timezone).toBeUndefined();
    });

    it('should extract structured data from log lines', async () => {
      const pattern = await regex.compile(
        '\\[(?P<timestamp>[^\\]]+)\\]\\s+' +
        '(?P<level>\\w+)\\s+' +
        '(?P<logger>[\\w.]+)\\s+-\\s+' +
        '(?P<message>.*)'
      );
      
      const logLines = [
        '[2025-06-03 12:34:56] INFO com.example.Service - User login successful',
        '[2025-06-03 12:35:01] ERROR auth.LoginService - Authentication failed for user john',
        '[2025-06-03 12:35:02] DEBUG db.ConnectionPool - Connection acquired'
      ];
      
      logLines.forEach(line => {
        const match = pattern.fullmatch(line);
        expect(match).not.toBeNull();
        expect(match?.groups.timestamp).toBeDefined();
        expect(match?.groups.level).toMatch(/^(INFO|ERROR|DEBUG|WARN)$/);
        expect(match?.groups.logger).toBeDefined();
        expect(match?.groups.message).toBeDefined();
      });
    });

    it('should parse semantic version strings', async () => {
      const pattern = await regex.compile(
        '(?P<major>\\d+)\\.(?P<minor>\\d+)\\.(?P<patch>\\d+)' +
        '(?:-(?P<prerelease>[\\w.-]+))?' +
        '(?:\\+(?P<build>[\\w.-]+))?'
      );
      
      const versions = [
        { version: '1.0.0', major: '1', minor: '0', patch: '0' },
        { version: '2.1.3-beta.1', major: '2', minor: '1', patch: '3', prerelease: 'beta.1' },
        { version: '1.0.0-alpha+build.123', major: '1', minor: '0', patch: '0', prerelease: 'alpha', build: 'build.123' }
      ];
      
      versions.forEach(({ version, major, minor, patch, prerelease, build }) => {
        const match = pattern.fullmatch(version);
        expect(match).not.toBeNull();
        expect(match?.groups.major).toBe(major);
        expect(match?.groups.minor).toBe(minor);
        expect(match?.groups.patch).toBe(patch);
        if (prerelease) expect(match?.groups.prerelease).toBe(prerelease);
        if (build) expect(match?.groups.build).toBe(build);
      });
    });
  });

  describe('End-to-end workflow tests', () => {
    it('should handle escaped literal strings in patterns', async () => {
      const literalText = 'Price: $29.99 (USD)';
      const escaped = regex.escape(literalText);
      const pattern = await regex.compile(`Start ${escaped} End`);
      
      expect(pattern.fullmatch('Start Price: $29.99 (USD) End')).not.toBeNull();
      expect(pattern.fullmatch('Start Price: 29.99 (USD) End')).toBeNull();
    });

    it('should work with mixed literal and pattern components', async () => {
      const prefix = regex.escape('ERROR [');
      const suffix = regex.escape(']');
      const pattern = await regex.compile(`${prefix}(?P<timestamp>[^\\]]+)${suffix}: (?P<message>.*)`);
      
      const logLine = 'ERROR [2025-06-03 12:34:56]: Database connection failed';
      const match = pattern.fullmatch(logLine);
      
      expect(match?.groups.timestamp).toBe('2025-06-03 12:34:56');
      expect(match?.groups.message).toBe('Database connection failed');
    });

    it('should demonstrate fullmatch vs match vs search differences', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      const text = 'hello world';
      
      // fullmatch: entire string must match
      expect(pattern.fullmatch(text)).toBeNull(); // Fails due to space
      expect(pattern.fullmatch('hello')).not.toBeNull(); // Succeeds
      
      // match: must match from start
      const matchResult = pattern.match(text);
      expect(matchResult?.groups.word).toBe('hello'); // Gets first word
      
      // search: finds first occurrence anywhere
      const searchResult = pattern.search(' hello world');
      expect(searchResult?.groups.word).toBe('hello'); // Finds 'hello' even with leading space
    });

    it('should handle complex nested patterns with escaping', async () => {
      // Parse a complex configuration string
      const keyPattern = '(?P<key>[a-zA-Z_][\\w.]*)';
      const valuePattern = '(?P<value>"[^"]*"|\\S+)';
      const escaped_equals = regex.escape('=');
      const pattern = await regex.compile(`${keyPattern}${escaped_equals}${valuePattern}`);
      
      const configs = [
        'database.host=localhost',
        'app.name="My Application"',
        'debug.enabled=true'
      ];
      
      configs.forEach(config => {
        const match = pattern.fullmatch(config);
        expect(match).not.toBeNull();
        expect(match?.groups.key).toBeDefined();
        expect(match?.groups.value).toBeDefined();
      });
    });
  });

  describe('Performance and scalability tests', () => {
    it('should handle large text efficiently', async () => {
      const pattern = await regex.compile('(?P<end>END)');
      const largeText = 'START' + 'x'.repeat(10000) + 'END';
      
      const start = Date.now();
      const match = pattern.search(largeText);
      const duration = Date.now() - start;
      
      expect(match?.groups.end).toBe('END');
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should compile patterns efficiently', async () => {
      const patterns = [];
      const start = Date.now();
      
      for (let i = 0; i < 10; i++) {
        patterns.push(await regex.compile(`(?P<test${i}>test${i})`));
      }
      
      const duration = Date.now() - start;
      expect(patterns.length).toBe(10);
      expect(duration).toBeLessThan(1000); // Should compile quickly
    });
  });

  describe('Error recovery and robustness', () => {
    it('should handle malformed input gracefully', async () => {
      const pattern = await regex.compile('(?P<email>[^@]+@[^@]+)');
      
      const malformedInputs = ['', 'notanemail', '@', 'user@', '@domain'];
      
      malformedInputs.forEach(input => {
        expect(() => pattern.test(input)).not.toThrow();
        expect(() => pattern.match(input)).not.toThrow();
        expect(() => pattern.search(input)).not.toThrow();
      });
    });

    it('should provide consistent results across multiple calls', async () => {
      const pattern = await regex.compile('(?P<num>\\d+)');
      const text = 'abc123def';
      
      // Multiple calls should give same result
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(pattern.search(text)?.groups.num);
      }
      
      expect(results.every(r => r === '123')).toBe(true);
    });
  });
});
