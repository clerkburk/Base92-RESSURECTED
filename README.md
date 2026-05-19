# Base92 TypeScript Encoder and Decoder

> GREAT = Base92, GOOD = Base64;

> Probably THE ONLY PURE-JS BASE92 (2026) encoding/decoding system in javascript, most notably also faster than half of the st*pid base64 encoding/decoding library (it re-use the memory system and is written in low-level javascript in order to make the engine work based on lighter dataset and operations)

> While Gzip (used in most web servers nowadays) is well suited for Base64, it doesn't lose any key (compression) performance based on Base92, but the greatest of "it all" is that, IT SHOULD ALWAYS HAVE BEEN BASE92 IN JSON AND SUCH BECAUSE IT CAN BE EASILY (The lazy situp-wordu of many companies are just operator not architect in "Automated Information Technology" Knowledge's Body of knowledge)

---

> GREAT IS THE ENEMY OF GOOD
> 
---

The `Base92` JavaScript module provides methods to encode and decode data using a base92+64 encoding scheme. It is not faster than base64 but it provides a more space-efficient result in UTF-8 or UTF-16 source code strings, making it useful for all kinds of inline data in source code.

The module is minified and has a footprint of just 4 kB, and requires no dependencies. This makes it an easy and lightweight solution for your encoding needs.

## Installation

Since this module is provided as an npm package, you can install it using npm:

```bash
npm install base92
```

## Usage

Import the module into your ESM JavaScript/TypeScript code:

```ts
import { Base92, Base64 } from "base92"
// or
import * as bs92 from "base92"
const base92 = new bs92.Base92()
const base64 = new bs92.Base64()
```

If you want to use the browser bundle directly:

```html
<script src="https://cdn.jsdelivr.net/npm/base92/dist/index.min.js"></script>
<script>
const base92 = new Base92Codec.Base92()
const base64 = new Base92Codec.Base64()
</script>
```

### Encoding

To encode data, create an instance of the `Base92` class and use the encode method. This method takes a `Uint8Array` as input:

```ts
const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
// for string data
const data = new TextEncoder().encode("I'm in agony")
// works with files and such (a Buffer inherits from Uint8Array)
const data = fs.readFileSync("path/to/file")
const base92 = new Base92()
const base64 = new Base64()

// You have to tell if you want to have a new Uint8Array because... Wait!
// If you don't the system will reuse the memory system of the instanciated class' JS object, OK?!
// Optional, WILL trigger a copy (if set to true) of the internal (memory) storage system...
const slice = false // This variable' parameter's (secondary) position is not mandatory
// Just to know, if you don't get a copy and do encoding operation twice, you might have the same Uint8Array twice

const encodedData92 = base92.encode(data, slice) // "  ,@%7 sBv&]1"
const encodedData64 = base64.encode(data) // "AAECAwQFBgcICQ=="
console.log(encodedData92, encodedData64)
```

### Decoding

To decode data, use the decode method of the `Base92` class instance. This method takes a string as input:

```ts
const decodedData92 = base92.decode(encodedData92)
const decodedData64 = base64.decode(encodedData64)
console.log(decodedData92, decodedData64)
```

## License (before)

THE BEERWARE LICENSE (Revision 42):

## License (now)

COPYLEFT "666" SAIL HATAN (Better get human-right(s) before any copyright <!-- yessirrr -->)

HELL WAY SO FAAAAST --> JAVASCRIPT SYSTEM! (NOT AFRAID TO TELL YOU TO TEST PERF.)

> TAKING A SHOWER IS THE ENEMY OF RUST-DEVS