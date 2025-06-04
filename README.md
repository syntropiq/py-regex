# py-regex

Python-compatible regular expressions for TypeScript/JavaScript, powered by [@syntropiq/libpcre-ts](https://www.npmjs.com/package/@syntropiq/libpcre-ts).  
Provides a Pythonic API mirroring Python's `re` and `regex` modules, including named groups, escaping, and familiar match methods.

## Installation

```sh
npm install @syntropiq/py-regex
```

## Usage

```typescript
import { regex } from '@syntropiq/py-regex';

const pattern = regex.compile('(?P<volume>\\d+) (?P<page>\\d+)', 'i');
const m = pattern.fullmatch('123 456');
console.log(m?.group('volume')); // '123'
console.log(m?.groups); // { volume: '123', page: '456' }

const escaped = regex.escape('Ala. Admin. Code');
console.log(escaped); // 'Ala\\. Admin\\. Code'
```

## API

- `regex.compile(pattern: string, flags?: string): Pattern`
- `regex.escape(text: string): string`
- `Pattern.fullmatch(text: string): Match | null`
- `Pattern.match(text: string): Match | null`
- `Pattern.search(text: string): Match | null`
- `Match.group(nameOrIndex: string | number): string | undefined`
- `Match.groups: Record<string, string>`

## Features

- Python-style named groups: `(?P<name>...)`
- Full support for Python/PCRE regex syntax
- Familiar API for Python developers
- 100% test coverage for Python compatibility


## Migrating from xtrax

All PCRE/Python regex logic has moved from `xtrax` to this package.  
For Python-compatible regex, use `@syntropiq/py-regex`.

## License

MIT