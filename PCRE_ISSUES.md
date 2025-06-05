# libpcre-ts Library Issues

This file documents issues that appear to be limitations or bugs in the libpcre-ts library itself.

## 1. Unicode Escape Sequence Support

**Issue**: libpcre-ts doesn't support `\u{xxxx}` Unicode escape sequences that are used in some tests.

**Test Cases**:
```javascript
// Fails with: "PCRE does not support \L, \l, \N{name}, \U, or \u at offset 12"
const pattern = '(?P<emoji>[\\u{1F600}-\\u{1F64F}])';
const pattern2 = '(?P<unicode>[\\u0000-\\uFFFF]+)';
```

**Error Message**: 
```
PCRE compilation failed: PCRE does not support \L, \l, \N{name}, \U, or \u at offset 12
```

**Root Cause**: The underlying PCRE library used by libpcre-ts doesn't support Unicode escape sequences in the `\u{xxxx}` format.

**Impact**: High - affects any patterns that need to match specific Unicode ranges or characters.

**Recommendation**: 
- Check if libpcre-ts can be configured with different Unicode support options
- Consider using alternative Unicode syntax supported by PCRE
- Document this limitation for users

## 2. Duplicate Named Groups Restriction

**Issue**: libpcre-ts/PCRE doesn't allow multiple named groups with the same name, which Python regex does support.

**Test Cases**:
```javascript
// Fails with: "two named subpatterns have the same name at offset 26"
const pattern1 = '(?P<item>\\w+)(?:\\s+(?P<item>\\w+))*';
const pattern2 = '(?P<type>email):(?P<email>[^\\s]+)|(?P<type>phone):(?P<phone>[^\\s]+)';
const pattern3 = '(?P<same>\\w+)\\s+(?P<same>\\w+)';
```

**Error Message**: 
```
PCRE compilation failed: two named subpatterns have the same name at offset 26
```

**Root Cause**: This is a fundamental difference between Python's regex engine and PCRE. Python allows duplicate named groups (the last match wins), while PCRE requires unique names.

**Impact**: Medium - affects patterns that rely on Python's duplicate named group behavior.

**Recommendation**: 
- Document this as a known limitation
- Suggest workarounds using numbered groups or unique names
- Consider implementing a pre-processing step to rename duplicate groups

## 3. Character Class Unicode Behavior

**Issue**: PCRE's `\w` and `\s` character classes may not be Unicode-aware by default, causing differences with Python's behavior.

**Test Cases**:
```javascript
// Python expects \w to match Unicode letters, but PCRE may not
const pattern = '\\w+';
expect(pattern.test('café')).toBe(true); // Expected: true, Actual: false
expect(pattern.test('测试')).toBe(true); // Expected: true, Actual: false

// Python expects \s to match tab characters differently  
const pattern2 = '\\s+';
expect(pattern2.test('\\t')).toBe(true); // Expected: true, Actual: false
```

**Root Cause**: PCRE's character classes may not be configured for full Unicode support, or may interpret character classes differently than Python.

**Impact**: Medium - affects internationalization and Unicode text processing.

**Recommendation**: 
- Check if libpcre-ts supports PCRE_UTF8 or PCRE_UCP options for Unicode character properties
- Consider if additional PCRE compilation flags are needed
- Document character class differences between Python and PCRE

## 4. Empty Named Group Handling

**Issue**: Some named group edge cases involving empty groups may not behave the same as Python.

**Test Cases**:
```javascript
// Expected empty string for optional group, but got different result
const pattern = '(?P<optional>\\d*)(?P<required>\\d+)';
const match = pattern.match('123');
expect(match?.groups.optional).toBe(''); // Expected: '', Actual: '12'
```

**Root Cause**: This could be either a libpcre-ts issue with group extraction or a difference in how PCRE handles optional groups compared to Python.

**Impact**: Low to Medium - affects specific edge cases with optional named groups.

**Recommendation**: 
- Test with simpler patterns to isolate if this is a PCRE behavior difference
- Check libpcre-ts documentation for group extraction behavior
- May require wrapper-level handling if this is a fundamental PCRE difference