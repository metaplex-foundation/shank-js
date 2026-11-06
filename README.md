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
const { generateIdl } = require("@metaplex-foundation/shank-js");

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

## Testing a local shank

To try out local changes to [shank](https://github.com/metaplex-foundation/shank) on a program, point the program at your checkout instead of crates.io, either directly or with a patch:

```toml
[dependencies]
shank = { path = "../shank/shank" }

# or, keeping the regular dependency
[patch.crates-io]
shank = { path = "../shank/shank" }
```

When `shank` is a path dependency (directly, via `[workspace.dependencies]` or via `[patch]`), shank-js builds the `shank-cli` crate next to it with `cargo build` and uses that binary, so changes to both the macros and the CLI are picked up on every run. Nothing is installed to `binaryInstallDir`.

You can also use any prebuilt binary, without touching the program's `Cargo.toml`, via the `SHANK_BINARY` (or `ANCHOR_BINARY`) environment variable or the `binaryPath` option:

```
SHANK_BINARY=../shank/target/debug/shank node ./shank.js
```

## See also
- https://github.com/metaplex-foundation/shank
- https://github.com/metaplex-foundation/rustbin
