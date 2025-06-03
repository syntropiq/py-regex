// Adapted tests for py-regex utilities only

import { describe, it, expect } from 'vitest';
import * as util from '../src/util';
import * as escape from '../src/escape';

// Test PCRE Utils (Worker-compatible functions only)
describe('py-regex utils', () => {
  it('escapeRegex should escape special characters', () => {
    expect(escape.escapeRegex('a.b*c')).toBe('a\\.b\\*c');
    expect(escape.escapeRegex('test[abc]')).toBe('test\\[abc\\]');
    expect(escape.escapeRegex('$100')).toBe('\\$100');
  });

  it('escapeRegex should escape spaces for Python compatibility', () => {
    expect(escape.escapeRegex('Ala. Admin. Code')).toBe('Ala\\.\\ Admin\\.\\ Code');
    expect(escape.escapeRegex('F. 2d')).toBe('F\\.\\ 2d');
    expect(escape.escapeRegex('test space')).toBe('test\\ space');
  });

  it('substituteEdition should replace $edition placeholder', () => {
    expect(util.substituteEdition('foo $edition bar', 'baz')).toBe('foo baz bar');
    expect(util.substituteEdition('foo ${edition} bar', 'test')).toBe('foo test bar');
  });

  it('substituteEditions should create alternation group', () => {
    const result = util.substituteEditions('foo $edition bar', 'A', { 'A Var': 'A' });
    expect(result[0]).toContain('(?:A|A\\ Var)');
    expect(result).toHaveLength(1);
  });

  it('getPCREPatternFromData should extract patterns from data', () => {
    const data1 = { foo: 'simple pattern' };
    expect(util.getPCREPatternFromData(data1, 'foo')).toBe('simple pattern');
    const data2 = { foo: { '': 'nested pattern' } };
    expect(util.getPCREPatternFromData(data2, 'foo')).toBe('nested pattern');
  });

  it('getPCREPatternFromData should throw for missing paths', () => {
    expect(() => util.getPCREPatternFromData({}, 'nonexistent')).toThrow();
    expect(() => util.getPCREPatternFromData({ foo: {} }, 'foo')).toThrow();
  });
});
