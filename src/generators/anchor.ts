import type { Idl } from '@metaplex-foundation/kinobi';
import path from 'path';
import { checkAndInstallRustBinary, executeBinary, readIdl } from '../utils';
import { AnchorGeneratorOptions, RustbinConfig } from '../types';

export default async function generate(
  config: AnchorGeneratorOptions,
): Promise<Idl> {
  const { idlDir, binaryInstallDir, programDir, binaryExtraArgs } = config;
  const binaryArgs = ['build', '--idl', idlDir, ...(binaryExtraArgs ?? [])];
  const binaryOptions = { cwd: programDir };
  const rustbinConfig: RustbinConfig = {
    rootDir: binaryInstallDir,
    binaryName: 'anchor',
    binaryCrateName: 'anchor-cli',
    libName: 'anchor-lang',
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
    address: config.programId,
    origin: config.generator,
    binaryVersion: binVersion,
    libVersion,
  };

  return idl;
}
