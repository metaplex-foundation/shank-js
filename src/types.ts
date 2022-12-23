import { RustbinConfig } from '@metaplex-foundation/rustbin'
import type { Idl } from '@lorisleiva/kinobi'

export { RustbinConfig }

export type BaseGeneratorOptions = {
  programName: string
  idlDir: string
  sdkDir: string
  binaryInstallDir: string
  programDir: string
  idlHook?: (idl: Idl) => Idl
  rustbin?: RustbinConfig
  removeExistingIdl?: boolean
}

export type AnchorGeneratorOptions = BaseGeneratorOptions & {
  generator: 'anchor';
  programId: string;
};

export type ShankGeneratorOptions = BaseGeneratorOptions & {
  generator: 'shank';
};

export type GeneratorOptions = AnchorGeneratorOptions | ShankGeneratorOptions;

export function isSolitaConfigAnchor(
  config: GeneratorOptions,
): config is AnchorGeneratorOptions {
  return config.generator === 'anchor';
}

export function isSolitaConfigShank(
  config: GeneratorOptions,
): config is ShankGeneratorOptions {
  return config.generator === 'shank';
}
