import type { Idl } from '@metaplex-foundation/kinobi';
import path from 'path';
import { RustbinConfig, ShankGeneratorOptions } from '../types';
import {
  checkAndInstallRustBinary,
  consumeIdl,
  executeBinary,
  resolveLocalBinary,
} from '../utils';

export default async function generate(
  config: ShankGeneratorOptions,
): Promise<Idl> {
  const {
    idlDir,
    idlName,
    binaryInstallDir,
    programDir,
    programName,
    programId,
    binaryExtraArgs,
  } = config;
  const binaryArgs = [
    'idl',
    '--out-dir',
    idlDir,
    '--crate-root',
    programDir,
    ...(programId ? ['--program-id', `${programId}`] : []),
    ...(idlName ? ['--out-filename', `${idlName}.json`] : []),
    ...(binaryExtraArgs ?? []),
  ];
  const binaryOptions = { cwd: programDir };
  const rustbinConfig: RustbinConfig = {
    rootDir: binaryInstallDir,
    binaryName: 'shank',
    binaryCrateName: 'shank-cli',
    libName: 'shank',
    cargoToml: path.join(programDir, 'Cargo.toml'),
    dryRun: false,
    ...config.rustbin,
  };

  // A binary given explicitly, or a local shank checkout used as a path
  // dependency, takes precedence over the crates.io version.
  const local = await resolveLocalBinary({
    binaryPath: config.binaryPath,
    envVar: 'SHANK_BINARY',
    binaryName: 'shank',
    localBuild: {
      programDir,
      libName: 'shank',
      cliDir: (libPath) => path.join(libPath, '..', 'shank-cli'),
    },
  });
  const { fullPathToBinary, binVersion, libVersion } =
    local ?? (await checkAndInstallRustBinary(rustbinConfig));
  const exitCode = await executeBinary(
    fullPathToBinary,
    binaryArgs,
    binaryOptions,
  );

  if (exitCode !== 0) {
    throw new Error(`${programName} idl generation failed`);
  }

  const idl = consumeIdl(path.join(idlDir, `${idlName ?? programName}.json`));
  idl.metadata = {
    ...idl.metadata,
    origin: config.generator,
    binaryVersion: binVersion,
    libVersion,
  };

  return idl;
}
