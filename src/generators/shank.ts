import type { Idl } from '@metaplex-foundation/kinobi';
import path from 'path';
import { RustbinConfig, ShankGeneratorOptions } from '../types';
import { checkAndInstallRustBinary, consumeIdl, executeBinary } from '../utils';

export default async function generate(
  config: ShankGeneratorOptions,
): Promise<Idl> {
  const {
    idlDir,
    idlName,
    binaryInstallDir,
    programDir,
    programName,
    binaryExtraArgs,
  } = config;
  const binaryArgs = [
    'idl',
    '--out-dir',
    idlDir,
    '--crate-root',
    programDir,
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

  const { fullPathToBinary, binVersion, libVersion } =
    await checkAndInstallRustBinary(rustbinConfig);
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
