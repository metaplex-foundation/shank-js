import type { Idl } from '@metaplex-foundation/kinobi';
import path from 'path';
import { AnchorGeneratorOptions, RustbinConfig } from '../types';
import {
  checkAndInstallRustBinary,
  consumeIdl,
  executeBinary,
  resolveLocalBinary,
} from '../utils';

export default async function generate(
  config: AnchorGeneratorOptions,
): Promise<Idl> {
  const { idlDir, binaryInstallDir, programDir, programName, binaryExtraArgs } =
    config;
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

  const local = await resolveLocalBinary({
    binaryPath: config.binaryPath,
    envVar: 'ANCHOR_BINARY',
    binaryName: 'anchor',
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

  const idl = consumeIdl(path.join(idlDir, `${programName}.json`));
  idl.metadata = {
    ...idl.metadata,
    address: config.programId,
    origin: config.generator,
    binaryVersion: binVersion,
    libVersion,
  };

  return idl;
}
