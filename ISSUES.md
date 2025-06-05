# py-regex Wrapper Issues

This file documents issues with our Python-compatible regex wrapper that need to be addressed.

## 1. Negative Lookahead with Fullmatch Anchoring

**Issue**: Negative lookahead assertions don't work correctly when patterns are anchored for fullmatch semantics.

**Test Case**: 
```javascript
const regex = await compileRegex('\\w+(?!\\d)'); // Compiled as ^\\w+(?!\\d)$
expect(regex.test('word123', 0)).toBe(false); // Expected: false, Actual: true
```

**Problem**: 
- Pattern becomes `^\\w+(?!\\d)$` 
- With text `word123`, `\\w+` matches `word` 
- The negative lookahead `(?!\\d)` checks if next char after `word` is NOT a digit
- But the `$` anchor forces the entire pattern to fail unless it matches the whole string
- This creates conflicting behavior between the lookahead and the anchoring

**Root Cause**: Our fullmatch implementation automatically adds `^` and `$` anchors, which interferes with lookahead/lookbehind assertions that depend on what comes after/before the match.

**Potential Solutions**:
1. Detect patterns with lookahead/lookbehind and handle them specially
2. Use different anchoring strategy for patterns with assertions
3. Post-process matches to validate lookahead/lookbehind manually

**Priority**: Medium - affects advanced regex patterns with assertions

## 2. Named Group Extraction Edge Cases

**Issue**: Some named group extraction scenarios return unexpected values.

**Test Cases**: 
```javascript
// Empty named groups - expected '', got '12'
const pattern = regex.compile('(?P<optional>\\d*)(?P<required>\\d+)');
const match = pattern.match('123');
expect(match?.groups.optional).toBe(''); // Expected: '', Actual: '12'
```

**Root Cause**: The `makeMatch()` function in `src/regex.ts` may not be handling edge cases correctly when multiple groups capture overlapping or empty content.

**Priority**: Medium - affects complex named group patterns

## 3. Performance Test Assumptions

**Issue**: Some performance tests make assumptions about group extraction that may not hold.

**Test Cases**:
```javascript
// Performance tests expecting specific group values that aren't being extracted
expect(matches.every(m => m?.groups.num === '123')).toBe(true); // Failing
```

**Root Cause**: Group extraction logic may not be consistent across all matching methods or under load.

**Priority**: Low - primarily affects performance validation, not core functionality