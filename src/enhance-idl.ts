import path from 'path'
import { strict as assert } from 'assert'
import { promises as fs } from 'fs'
import {
  isSolitaConfigAnchor,
  isSolitaConfigShank,
  SolitaConfig,
} from './types'

export async function enhanceIdl(
  config: SolitaConfig,
  binaryVersion: string,
  libVersion: string
) {
  const { idlDir, programName } = config
  const idlPath = path.join(idlDir, `${programName}.json`)

  const idl = require(idlPath)

  if (isSolitaConfigAnchor(config)) {
    idl.metadata = {
      ...idl.metadata,
      address: config.programId,
      origin: config.idlGenerator,
      binaryVersion,
      libVersion,
    }
  } else if (isSolitaConfigShank(config)) {
    idl.metadata = {
      ...idl.metadata,
      binaryVersion,
      libVersion,
    }
  } else {
    // @ts-ignore
    throw new Error(`Unknown IDL generator ${config.idlGenerator}`);
  }

  // Apply Idl hook if provided
  let finalIdl = idl
  if (config.idlHook != null) {
    assert.equal(
      typeof config.idlHook,
      'function',
      `idlHook needs to be a function of the type: (idl: Idl) => idl, but is of type ${typeof config.idlHook}`
    )
    finalIdl = config.idlHook(idl)
  }

  await fs.writeFile(idlPath, JSON.stringify(finalIdl, null, 2))
  return finalIdl
}
