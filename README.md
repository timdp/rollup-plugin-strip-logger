# rollup-plugin-strip-logger

[![npm](https://img.shields.io/npm/v/rollup-plugin-strip-logger.svg)](https://www.npmjs.com/package/rollup-plugin-strip-logger) [![Dependencies](https://img.shields.io/david/timdp/rollup-plugin-strip-logger.svg)](https://david-dm.org/timdp/rollup-plugin-strip-logger) [![Build Status](https://img.shields.io/travis/timdp/rollup-plugin-strip-logger/master.svg)](https://travis-ci.org/timdp/rollup-plugin-strip-logger) [![Coverage Status](https://img.shields.io/coveralls/timdp/rollup-plugin-strip-logger/master.svg)](https://coveralls.io/r/timdp/rollup-plugin-strip-logger) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

Strips out references to a logger package.

**Warning:** This is very much a work in progress. It's likely to be refactored
into something more generic.

## Installation

```bash
npm install --save-dev rollup-plugin-strip-logger
```

## Usage

```js
import stripLogger from 'rollup-plugin-strip-logger'

export default {
  entry: 'src/index.js',
  dest: 'dist/my-lib.js',
  plugins: [
    stripLogger({
      variableName: 'logger',
      propertyName: '_logger',
      packageName: 'my-logger'
    })
  ]
}
```

## Options

### `variableName`

Remove all references to variables by this name.

### `propertyName`

Remove all references to `obj[propertyName]`.

### `packageName`

Remove all imports of packages/modules by this name.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
