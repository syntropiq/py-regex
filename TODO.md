# TODO: Migration Plan for py-regex

## Goal
Extract all Python/PCRE regex compatibility logic from `xtrax` into this new `py-regex` package, with a Pythonic API and adapted tests. The result should be instantly familiar to users of Python's `regex` module and maintain 100% fidelity to Python's behavior.

---

## 1. What to Move from xtrax
- All files in `xtrax/pcre-utils/`
- Any PCRE/Python regex helpers/types in `xtrax/index.ts`
- PCRE-related tests from `xtrax/__tests__/` or similar test folders

---

## 2. New Package Structure (py-regex)

```
py-regex/
├── src/
│   ├── index.ts           // Exports the "regex" object (Python's "re" API)
│   ├── compile.ts         // regex.compile(), flag handling, anchoring
│   ├── escape.ts          // regex.escape()
│   ├── match.ts           // regex.match(), regex.fullmatch(), regex.search()
│   ├── groups.ts          // Named group conversion
│   ├── types.ts           // TypeScript types
│   └── util.ts            // Internal helpers
├── __tests__/
│   ├── regex.test.ts      // Adapted from xtrax tests, Python-style
├── README.md              // Usage: Python-style API
├── package.json
└── ...
```

---

## 3. File-by-File Migration

### a. Move and Refactor Source Files
- Move all of `xtrax/pcre-utils/` to `py-regex/src/` and split as above.
- Move any PCRE-related code from `xtrax/index.ts` to `py-regex/src/`.
- Rename and refactor all exports to match Python’s `re` module:
  - `escapeRegex` → `regex.escape`
  - `convertNamedGroups` → internal, used by `regex.compile`
  - `compileRegex` → `regex.compile`
  - `compileRegexPartial` → `regex.compile` with partial flag
  - Types: adapt to match Python’s `re.Pattern`, `re.Match`, etc.

### b. Adapt and Move Tests
- Move all regex/PCRE-related tests from `xtrax/__tests__/` to `py-regex/__tests__/regex.test.ts`.
- Adapt tests to use the new `regex` object and Pythonic API:
  - `regex.compile(pattern, flags)`
  - `pattern.fullmatch(string)`
  - `pattern.match(string)`
  - `pattern.search(string)`
  - `regex.escape(string)`
  - Test named groups, escaping, edition normalization, etc.

### c. Update Documentation
- Write `py-regex/README.md` with usage examples that mirror Python’s `re` docs.
- Document any differences from Python’s `re` (should be minimal).

### d. Update xtrax
- Remove all PCRE/regex-specific code from `xtrax/pcre-utils/` and `xtrax/index.ts`.
- Remove PCRE/regex-specific tests from `xtrax/__tests__/`.
- Update `xtrax/README.md`:
  - Remove or replace all references to `PCREUtils`, `escapeRegex`, etc.
  - Add a note: “For Python-compatible regex, use the new `py-regex` package.”

---

## 4. Example: New API Usage

```typescript
import { regex } from 'py-regex';

const pattern = regex.compile('(?P<volume>\\d+) (?P<page>\\d+)', 'i');
const m = pattern.fullmatch('123 456');
console.log(m?.group('volume')); // '123'
console.log(m?.groups); // { volume: '123', page: '456' }

const escaped = regex.escape('Ala. Admin. Code');
console.log(escaped); // 'Ala\\. Admin\\. Code'
```

---

## 5. Migration Checklist
- [ ] Move and refactor all PCRE/regex code to `py-regex/src/`
- [ ] Adapt and move all regex-related tests to `py-regex/__tests__/`
- [ ] Remove PCRE/regex code and tests from `xtrax`
- [ ] Update `xtrax/README.md` and docs
- [ ] Write `py-regex/README.md` with Pythonic usage
- [ ] Test for 100% Python fidelity
