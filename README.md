# shank-js

Generate IDL files via Anchor or Shank.

## Install

```
npm install @metaplex-foundation/shank-js -D
```

## Usage

Configure your `shank.js` file.

```js
const path = require("path");
const { generateIdl } = require("@lorisleiva/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

// From a vanilla Solana program using Shank.
generateIdl({
  generator: "shank",
  programName: "mpl_token_metadata",
  programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  idlDir,
  binaryInstallDir,
  programDir: path.join(programDir, "token-metadata"),
});

// From an Anchor program.
generateIdl({  
  generator: "anchor",
  programName: "candy_machine_core",
  programId: "CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR",
  idlDir,
  binaryInstallDir,
  programDir: path.join(programDir, "candy-machine-core"),
});
```

Generate all IDL configured in the file.

```
node ./shank.js
```

## See also
- https://github.com/metaplex-foundation/shank
- https://github.com/metaplex-foundation/rustbin
