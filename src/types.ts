import { RustbinConfig } from '@metaplex-foundation/rustbin';
import type { Idl } from '@metaplex-foundation/kinobi';

export { RustbinConfig };

export type BaseGeneratorOptions = {
  programName: string;
  idlName?: string;
  idlDir: string;
  binaryInstallDir: string;
  binaryExtraArgs?: string[];
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
};

export type GeneratorOptions = AnchorGeneratorOptions | ShankGeneratorOptions;
