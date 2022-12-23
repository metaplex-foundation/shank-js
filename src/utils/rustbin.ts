import {
  RustbinConfig,
  rustbinMatch,
  RustbinMatchReturn,
  ConfirmInstallArgs,
} from '@metaplex-foundation/rustbin';
import { logInfo } from './logs';

export type RustBinaryResult = Omit<RustbinMatchReturn, 'binVersion'> & {
  binVersion: string;
};

export async function checkAndInstallRustBinary(
  rustbinConfig: RustbinConfig,
): Promise<RustBinaryResult> {
  const match = await rustbinMatch(rustbinConfig, confirmAutoMessageLog);

  if (!match.binVersion) {
    const binary = rustbinConfig.binaryName;
    throw new Error(
      `rustbin was unable to determine installed version ${binary}, ` +
        `it may not have been installed correctly.`,
    );
  }

  return match as RustBinaryResult;
}

async function confirmAutoMessageLog({
  binaryName,
  libVersion,
  libName,
  binVersion,
  fullPathToBinary,
}: ConfirmInstallArgs): Promise<boolean> {
  if (binVersion == null) {
    logInfo(`No existing version found for ${binaryName}.`);
  } else {
    logInfo(`Version for ${binaryName}: ${binVersion}`);
  }
  logInfo(
    `Will install version matching "${libName}: '${libVersion}'" to ${fullPathToBinary}`,
  );
  return true;
}
