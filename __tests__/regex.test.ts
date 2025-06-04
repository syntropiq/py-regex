// Comprehensive unit tests for py-regex: Python-compatible regex in TypeScript
import { describe, it, expect } from 'vitest';
import { regex } from '../src/regex';

// Helper for async pattern compilation
describe('py-regex: Python compatibility', () => {
  it('should escape special characters like Python', () => {
    expect(regex.escape('Ala. Admin. Code')).toBe('Ala\.\ Admin\.\ Code');
    expect(regex.escape('a.b*c')).toBe('a\.b\*c');
    expect(regex.escape('test[abc]')).toBe('test\[abc\]');
    expect(regex.escape('$100')).toBe('\$100');
    expect(regex.escape('foo bar')).toBe('foo\ bar');
  });

  it('should match using named groups and fullmatch semantics', async () => {
    const pattern = await regex.compile('(?P<volume>\\d+) (?P<page>\\d+)');
    const m = pattern.fullmatch('123 456');
    expect(m).not.toBeNull();
    if (m) {
      expect(m.groups).toEqual({ volume: '123', page: '456' });
      expect(m.fullMatch).toBe('123 456');
      expect(m.group('volume')).toBe('123');
      expect(m.group('page')).toBe('456');
      expect(m.group(0)).toBe('123 456');
    }
    expect(pattern.test('123 456')).toBe(true);
    expect(pattern.test('no match')).toBe(false);
  });

  it('should not match partial strings with fullmatch', async () => {
    const pattern = await regex.compile('foo');
    expect(pattern.test('foobar')).toBe(false);
    expect(pattern.test('foo')).toBe(true);
  });

  it('should match partial strings with compileRegexPartial', async () => {
    // Use the lower-level API for partial match
    const { compileRegexPartial } = await import('../src/compile');
    const regexPartial = await compileRegexPartial('foo');
    expect(regexPartial.test('foobar')).toBe(true);
    expect(regexPartial.test('foo')).toBe(true);
    expect(regexPartial.test('bar')).toBe(false);
  });

  it('should support multiple named groups and access by name', async () => {
    const pattern = await regex.compile('(?P<first>\\w+) (?P<last>\\w+)');
    const m = pattern.match('John Smith');
    expect(m).not.toBeNull();
    if (m) {
      expect(m.groups.first).toBe('John');
      expect(m.groups.last).toBe('Smith');
      expect(m.group('first')).toBe('John');
      expect(m.group('last')).toBe('Smith');
    }
  });

  it('should handle no match gracefully', async () => {
    const pattern = await regex.compile('foo');
    const m = pattern.match('bar');
    expect(m).toBeNull();
  });

  it('should support complex Python-style patterns', async () => {
    const pattern = await regex.compile('(?P<date>\\d{4}-\\d{2}-\\d{2}) (?P<time>\\d{2}:\\d{2})');
    const m = pattern.match('2025-06-03 12:34');
    expect(m).not.toBeNull();
    if (m) {
      expect(m.groups.date).toBe('2025-06-03');
      expect(m.groups.time).toBe('12:34');
    }
  });
});
