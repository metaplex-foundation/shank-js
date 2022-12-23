import {
  rustbinMatch,
  RustbinConfig,
  RustbinMatchReturn,
  ConfirmInstallArgs,
} from '@metaplex-foundation/rustbin';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import path from 'path';
import { red } from 'ansi-colors';
import {
  SolitaConfig,
  SolitaConfigAnchor,
  SolitaConfigShank,
  SolitaHandlerResult,
} from '../types';
import { enhanceIdl } from './enhance-idl';
import { logDebug, logError, logInfo } from '../utils';

const handlerErrorRx = /^Error\:/;

export function handleAnchor(config: SolitaConfigAnchor) {
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

export function handleShank(config: SolitaConfigShank) {
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

async function handle(
  config: SolitaConfig,
  rustbinConfig: RustbinConfig,
  spawnArgs: string[],
  spawnOpts: SpawnOptionsWithoutStdio,
) {
  const { programName, idlDir } = config;

  const { fullPathToBinary, binVersion, libVersion }: RustbinMatchReturn =
    await rustbinMatch(rustbinConfig, confirmAutoMessageLog);

  if (binVersion == null) {
    throw new Error(
      `rustbin was unable to determine installed version ${rustbinConfig.binaryName}, it may ` +
        `not have been installed correctly.`,
    );
  }

  return new Promise<SolitaHandlerResult>((resolve, reject) => {
    const tool = path.basename(fullPathToBinary);
    const idlGenerator = spawn(fullPathToBinary, spawnArgs, spawnOpts)
      .on('error', (err) => {
        logError(`${programName} idl generation failed`);
        reject(err);
      })
      .on('exit', async (exitCode) => {
        logDebug(`${tool} completed with code ${exitCode}`);
        if (exitCode === 0 || exitCode === null) {
          logInfo(
            'IDL written to: %s',
            path.join(idlDir, `${programName}.json`),
          );
          const idl = await enhanceIdl(config, binVersion, libVersion);
          resolve({ exitCode });
        } else {
          const errorMsg = red(
            `${tool} returned with non-zero exit code. Please review the output above to diagnose the issue.`,
          );
          resolve({ exitCode, errorMsg });
        }
      });

    idlGenerator.stdout.on('data', (buf) => process.stdout.write(buf));
    idlGenerator.stderr.on('data', (buf) => {
      const dataStr = buf.toString();
      if (handlerErrorRx.test(dataStr)) {
        logError(red(dataStr));
      } else {
        process.stderr.write(buf);
      }
    });
  });
}
