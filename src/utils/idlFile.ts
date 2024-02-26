import type { Idl } from '@metaplex-foundation/kinobi';
import { readFileSync, rmSync } from 'fs';
import path from 'path';
import { GeneratorOptions } from '../types';

export function getIdlPath(config: GeneratorOptions): string {
  const { idlDir, programName, idlName } = config;
  return path.join(idlDir, `${idlName ?? programName}.json`);
}

export function consumeIdl(idlPath: string): Idl {
  const idl = JSON.parse(readFileSync(idlPath, 'utf-8')) as Idl;
  rmSync(idlPath);
  return idl;
}
