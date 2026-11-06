import { RustbinConfig } from '@metaplex-foundation/rustbin';
import type { Idl } from '@metaplex-foundation/kinobi';

export { RustbinConfig };

export type BaseGeneratorOptions = {
  programName: string;
  idlName?: string;
  idlDir: string;
  binaryInstallDir: string;
  binaryExtraArgs?: string[];
  /**
   * Path to a binary to use instead of installing one with rustbin, e.g. a
   * locally built shank. Can also be set via the `SHANK_BINARY` or
   * `ANCHOR_BINARY` environment variables.
   */
  binaryPath?: string;
  programDir: string;
  idlHook?: (idl: Idl) => Idl;
  rustbin?: RustbinConfig;
  removeExistingIdl?: boolean;
};

export type AnchorGeneratorOptions = BaseGeneratorOptions & {
  generator: 'anchor';
  programId: string;
};

export type ShankGeneratorOptions = BaseGeneratorOptions & {
  generator: 'shank';
  programId?: string;
};

export type GeneratorOptions = AnchorGeneratorOptions | ShankGeneratorOptions;
