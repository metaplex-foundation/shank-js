import type { Idl } from '@lorisleiva/kinobi';
import { existsSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import generateUsingAnchor from './generators/anchor';
import generateUsingShank from './generators/shank';
import { logError, logInfo } from './utils';
import { GeneratorOptions } from './types';

export function generateIdl(config: GeneratorOptions): void {
  removeCurrentIdl(config);
  const idl = handleGenerator(config);
  const enhancedIdl = enhanceIdl(config, idl);
  writeIdl(config, enhancedIdl);
}

function removeCurrentIdl(config: GeneratorOptions): void {
  if (config.removeExistingIdl === false) return;
  const idlPath = getIdlPath(config);
  if (!existsSync(idlPath)) return;

  try {
    rmSync(idlPath);
    logInfo(`Removed existing IDL at ${idlPath}.`);
  } catch (error) {
    logError(`Failed to remove existing IDL at ${idlPath}.`);
  }
}

function handleGenerator(config: GeneratorOptions): Idl {
  if (config.generator === 'anchor') {
    return generateUsingAnchor(config);
  }

  if (config.generator === 'shank') {
    return generateUsingShank(config);
  }

  // @ts-ignore
  throw new Error(`Unrecognized IDL generator: ${config.generator}`);
}

function enhanceIdl(config: GeneratorOptions, idl: Idl): Idl {
  return config.idlHook ? config.idlHook(idl) : idl;
}

function writeIdl(config: GeneratorOptions, idl: Idl): void {
  const idlPath = getIdlPath(config);
  writeFileSync(idlPath, JSON.stringify(idl, null, 2));
}

function getIdlPath(config: GeneratorOptions): string {
  const { idlDir, programName } = config;
  return path.join(idlDir, `${programName}.json`);
}
