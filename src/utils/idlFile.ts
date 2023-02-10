import type { Idl } from '@metaplex-foundation/kinobi';
import { readFileSync } from 'fs';
import path from 'path';
import { GeneratorOptions } from '../types';

export function getIdlPath(config: GeneratorOptions): string {
  const { idlDir, programName } = config;
  return path.join(idlDir, `${programName}.json`);
}

export function readIdl(config: GeneratorOptions): Idl {
  const idlPath = getIdlPath(config);
  return JSON.parse(readFileSync(idlPath, 'utf-8')) as Idl;
}
