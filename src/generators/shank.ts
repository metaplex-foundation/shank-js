import type { Idl } from '@lorisleiva/kinobi';
import type { SpawnOptionsWithoutStdio } from 'child_process';
import path from 'path';
import { RustbinConfig, ShankGeneratorOptions } from '../types';

export default function generate(config: ShankGeneratorOptions): Idl {
  const { idlDir, binaryInstallDir, programDir } = config;
  const spawnArgs = ['idl', '--out-dir', idlDir, '--crate-root', programDir];
  const spawnOpts: SpawnOptionsWithoutStdio = {
    cwd: programDir,
  };
  const rustbinConfig: RustbinConfig = {
    rootDir: binaryInstallDir,
    binaryName: 'shank',
    binaryCrateName: 'shank-cli',
    libName: 'shank',
    cargoToml: path.join(programDir, 'Cargo.toml'),
    dryRun: false,
    ...config.rustbin,
  };

  return handle(config, rustbinConfig, spawnArgs, spawnOpts);
}
