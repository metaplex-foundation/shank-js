import type { Idl } from '@metaplex-foundation/kinobi';
import path from 'path';
import { checkAndInstallRustBinary, executeBinary, readIdl } from '../utils';
import { RustbinConfig, ShankGeneratorOptions } from '../types';

export default async function generate(
  config: ShankGeneratorOptions,
): Promise<Idl> {
  const { idlDir, binaryInstallDir, programDir, binaryExtraArgs } = config;
  const binaryArgs = [
    'idl',
    '--out-dir',
    idlDir,
    '--crate-root',
    programDir,
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

  const { fullPathToBinary, binVersion, libVersion } =
    await checkAndInstallRustBinary(rustbinConfig);
  const exitCode = await executeBinary(
    fullPathToBinary,
    binaryArgs,
    binaryOptions,
  );

  if (exitCode !== 0) {
    throw new Error(`${config.programName} idl generation failed`);
  }

  const idl = readIdl(config);
  idl.metadata = {
    ...idl.metadata,
    origin: config.generator,
    binaryVersion: binVersion,
    libVersion,
  };

  return idl;
}
