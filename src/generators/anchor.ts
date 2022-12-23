import type { Idl } from '@lorisleiva/kinobi';
import type { SpawnOptionsWithoutStdio } from 'child_process';
import path from 'path';
import { AnchorGeneratorOptions, RustbinConfig } from '../types';

export default async function generate(config: AnchorGeneratorOptions): Idl {
  const { idlDir, binaryInstallDir, programDir } = config;
  const spawnArgs = ['build', '--idl', idlDir];
  const spawnOpts: SpawnOptionsWithoutStdio = {
    cwd: programDir,
  };
  const rustbinConfig: RustbinConfig = {
    rootDir: binaryInstallDir,
    binaryName: 'anchor',
    binaryCrateName: 'anchor-cli',
    libName: 'anchor-lang',
    cargoToml: path.join(programDir, 'Cargo.toml'),
    dryRun: false,
    ...config.rustbin,
  };

  return handle(config, rustbinConfig, spawnArgs, spawnOpts);
}
