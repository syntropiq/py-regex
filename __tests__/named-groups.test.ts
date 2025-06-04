// Comprehensive tests for named groups functionality
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';

describe('Named Groups Functionality', () => {
  describe('Basic named group operations', () => {
    it('should extract single named group', async () => {
      const pattern = await regex.compile('(?P<name>\\w+)');
      const match = pattern.match('john');
      
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups).toEqual({ name: 'john' });
        expect(match.group('name')).toBe('john');
        expect(match.group(1)).toBe('john');
        expect(match.group(0)).toBe('john'); // Full match
      }
    });

    it('should extract multiple named groups', async () => {
      const pattern = await regex.compile('(?P<first>\\w+) (?P<last>\\w+)');
      const match = pattern.match('John Smith');
      
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups).toEqual({ first: 'John', last: 'Smith' });
        expect(match.group('first')).toBe('John');
        expect(match.group('last')).toBe('Smith');
        expect(match.group(1)).toBe('John');
        expect(match.group(2)).toBe('Smith');
        expect(match.group(0)).toBe('John Smith');
      }
    });

    it('should handle complex named group patterns', async () => {
      const pattern = await regex.compile('(?P<protocol>https?)://(?P<domain>[^:/]+)(?::(?P<port>\\d+))?(?P<path>/.*)?');
      
      const match1 = pattern.match('https://example.com:8080/path/to/resource');
      expect(match1?.groups).toEqual({
        protocol: 'https',
        domain: 'example.com',
        port: '8080',
        path: '/path/to/resource'
      });
      
      const match2 = pattern.match('http://example.com');
      expect(match2?.groups.protocol).toBe('http');
      expect(match2?.groups.domain).toBe('example.com');
      expect(match2?.groups.port).toBeUndefined(); // Optional group
      expect(match2?.groups.path).toBeUndefined(); // Optional group
    });
  });

  describe('Named group edge cases', () => {
    it('should handle empty named groups', async () => {
      const pattern = await regex.compile('(?P<optional>\\w*)(?P<required>\\d+)');
      
      const match = pattern.match('123');
      expect(match?.groups.optional).toBe(''); // Empty but matched
      expect(match?.groups.required).toBe('123');
    });

    it('should handle optional named groups', async () => {
      const pattern = await regex.compile('(?P<base>\\w+)(?P<suffix>\\d+)?');
      
      const match1 = pattern.match('test123');
      const match2 = pattern.match('test');
      
      expect(match1?.groups.base).toBe('test');
      expect(match1?.groups.suffix).toBe('123');
      
      expect(match2?.groups.base).toBe('test');
      expect(match2?.groups.suffix).toBeUndefined(); // Optional, not matched
    });

    it('should handle alternation in named groups', async () => {
      const pattern = await regex.compile('(?P<type>user|admin|guest)_(?P<id>\\d+)');
      
      const match1 = pattern.match('user_123');
      const match2 = pattern.match('admin_456');
      const match3 = pattern.match('guest_789');
      
      expect(match1?.groups).toEqual({ type: 'user', id: '123' });
      expect(match2?.groups).toEqual({ type: 'admin', id: '456' });
      expect(match3?.groups).toEqual({ type: 'guest', id: '789' });
    });

    it('should handle nested named groups', async () => {
      const pattern = await regex.compile('(?P<full>(?P<name>\\w+)\\s+(?P<age>\\d+))');
      
      const match = pattern.match('John 25');
      expect(match?.groups).toEqual({
        full: 'John 25',
        name: 'John',
        age: '25'
      });
    });

    it('should handle repeated named groups (if allowed)', async () => {
      // This tests how the library handles multiple occurrences of the same named group
      const pattern = await regex.compile('(?P<item>\\w+)(?:\\s+(?P<item>\\w+))*');
      
      // The behavior here depends on the PCRE implementation
      // Usually, the last match is kept
      const match = pattern.match('first second third');
      expect(match).not.toBeNull();
      // The exact behavior may vary - document what actually happens
    });
  });

  describe('Named group access methods', () => {
    it('should access groups by name and index consistently', async () => {
      const pattern = await regex.compile('(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})');
      const match = pattern.match('2025-06-03');
      
      expect(match).not.toBeNull();
      if (match) {
        // By name
        expect(match.group('year')).toBe('2025');
        expect(match.group('month')).toBe('06');
        expect(match.group('day')).toBe('03');
        
        // By index (1-based, 0 is full match)
        expect(match.group(0)).toBe('2025-06-03');
        expect(match.group(1)).toBe('2025');
        expect(match.group(2)).toBe('06');
        expect(match.group(3)).toBe('03');
        
        // Groups object
        expect(match.groups).toEqual({
          year: '2025',
          month: '06',
          day: '03'
        });
      }
    });

    it('should handle invalid group access gracefully', async () => {
      const pattern = await regex.compile('(?P<name>\\w+)');
      const match = pattern.match('john');
      
      expect(match).not.toBeNull();
      if (match) {
        expect(match.group('nonexistent')).toBeUndefined();
        expect(match.group(999)).toBeUndefined();
        expect(match.group(-1)).toBeUndefined();
        expect(match.group('')).toBeUndefined();
      }
    });

    it('should handle mixed named and unnamed groups', async () => {
      const pattern = await regex.compile('(?P<named>\\w+)\\s+(\\d+)\\s+(?P<another>\\w+)');
      const match = pattern.match('hello 123 world');
      
      expect(match).not.toBeNull();
      if (match) {
        expect(match.groups).toEqual({
          named: 'hello',
          another: 'world'
        });
        
        expect(match.group('named')).toBe('hello');
        expect(match.group('another')).toBe('world');
        expect(match.group(1)).toBe('hello'); // First group (named)
        expect(match.group(2)).toBe('123'); // Second group (unnamed)
        expect(match.group(3)).toBe('world'); // Third group (named)
      }
    });
  });

  describe('Complex named group scenarios', () => {
    it('should handle date/time parsing patterns', async () => {
      const pattern = await regex.compile(
        '(?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})\\s+' +
        '(?P<hour>\\d{2}):(?P<minute>\\d{2}):(?P<second>\\d{2})' +
        '(?:\\.(?P<microsecond>\\d{6}))?'
      );
      
      const match1 = pattern.match('2025-06-03 12:34:56.123456');
      const match2 = pattern.match('2025-06-03 12:34:56');
      
      expect(match1?.groups).toEqual({
        year: '2025',
        month: '06',
        day: '03',
        hour: '12',
        minute: '34',
        second: '56',
        microsecond: '123456'
      });
      
      expect(match2?.groups.microsecond).toBeUndefined();
      expect(match2?.groups.year).toBe('2025');
    });

    it('should handle email parsing patterns', async () => {
      const pattern = await regex.compile(
        '(?P<local>[\\w.+-]+)@(?P<domain>(?P<subdomain>[\\w.-]+\\.)?(?P<tld>[a-z]{2,}))'
      );
      
      const match1 = pattern.match('user.name+tag@mail.example.com');
      const match2 = pattern.match('simple@example.org');
      
      expect(match1?.groups.local).toBe('user.name+tag');
      expect(match1?.groups.domain).toBe('mail.example.com');
      expect(match1?.groups.subdomain).toBe('mail.example.');
      expect(match1?.groups.tld).toBe('com');
      
      expect(match2?.groups.local).toBe('simple');
      expect(match2?.groups.domain).toBe('example.org');
      expect(match2?.groups.subdomain).toBeUndefined();
      expect(match2?.groups.tld).toBe('org');
    });

    it('should handle log parsing patterns', async () => {
      const pattern = await regex.compile(
        '\\[(?P<timestamp>[^\\]]+)\\]\\s+' +
        '(?P<level>DEBUG|INFO|WARN|ERROR)\\s+' +
        '(?P<logger>[\\w.]+)\\s+-\\s+' +
        '(?P<message>.*)'
      );
      
      const logLine = '[2025-06-03 12:34:56] INFO com.example.Service - User login successful';
      const match = pattern.match(logLine);
      
      expect(match?.groups).toEqual({
        timestamp: '2025-06-03 12:34:56',
        level: 'INFO',
        logger: 'com.example.Service',
        message: 'User login successful'
      });
    });

    it('should handle version string parsing', async () => {
      const pattern = await regex.compile(
        '(?P<major>\\d+)\\.(?P<minor>\\d+)\\.(?P<patch>\\d+)' +
        '(?:-(?P<prerelease>[\\w.-]+))?' +
        '(?:\\+(?P<build>[\\w.-]+))?'
      );
      
      const match1 = pattern.match('1.2.3');
      const match2 = pattern.match('2.0.0-beta.1');
      const match3 = pattern.match('1.0.0-alpha+build.123');
      
      expect(match1?.groups).toEqual({
        major: '1',
        minor: '2',
        patch: '3'
      });
      
      expect(match2?.groups).toEqual({
        major: '2',
        minor: '0',
        patch: '0',
        prerelease: 'beta.1'
      });
      
      expect(match3?.groups).toEqual({
        major: '1',
        minor: '0',
        patch: '0',
        prerelease: 'alpha',
        build: 'build.123'
      });
    });

    it('should handle phone number parsing', async () => {
      const pattern = await regex.compile(
        '(?:\\+(?P<country>\\d{1,3})\\s?)?' +
        '(?:\\((?P<area>\\d{3})\\)|(?P<area2>\\d{3}))' +
        '[\\s.-]?' +
        '(?P<exchange>\\d{3})' +
        '[\\s.-]?' +
        '(?P<number>\\d{4})'
      );
      
      const match1 = pattern.match('+1 (555) 123-4567');
      const match2 = pattern.match('555.123.4567');
      const match3 = pattern.match('(555) 123 4567');
      
      expect(match1?.groups.country).toBe('1');
      expect(match1?.groups.area).toBe('555');
      expect(match1?.groups.exchange).toBe('123');
      expect(match1?.groups.number).toBe('4567');
      
      expect(match2?.groups.country).toBeUndefined();
      expect(match2?.groups.area2).toBe('555'); // Different capturing group
      expect(match2?.groups.exchange).toBe('123');
      expect(match2?.groups.number).toBe('4567');
    });
  });

  describe('Named groups with different matching methods', () => {
    it('should work consistently with fullmatch', async () => {
      const pattern = await regex.compile('(?P<word>\\w+)');
      
      const match = pattern.fullmatch('hello');
      expect(match?.groups.word).toBe('hello');
      
      const noMatch = pattern.fullmatch('hello world');
      expect(noMatch).toBeNull();
    });

    it('should work consistently with search', async () => {
      const pattern = await regex.compile('(?P<number>\\d+)');
      
      const match = pattern.search('abc 123 def');
      expect(match?.groups.number).toBe('123');
    });

    it('should handle groups in alternation patterns', async () => {
      const pattern = await regex.compile('(?P<type>email):(?P<email>[^\\s]+)|(?P<type>phone):(?P<phone>[^\\s]+)');
      
      const match1 = pattern.match('email:user@example.com');
      const match2 = pattern.match('phone:555-1234');
      
      expect(match1?.groups.type).toBe('email');
      expect(match1?.groups.email).toBe('user@example.com');
      expect(match1?.groups.phone).toBeUndefined();
      
      expect(match2?.groups.type).toBe('phone');
      expect(match2?.groups.phone).toBe('555-1234');
      expect(match2?.groups.email).toBeUndefined();
    });
  });
});
