import path from 'path'
import { strict as assert } from 'assert'
import {
  logError,
  logInfo,
  removeFileIfExists,
} from '../utils'
import {
  isErrorResult,
  isSolitaConfigAnchor,
  isSolitaConfigShank,
  SolitaHandlerResult,
} from './types'
import { handleAnchor, handleShank } from './handlers'

async function main() {
  const removeIdl = solitaConfig.removeExistingIdl ?? true
  if (removeIdl) {
    const { idlDir, programName } = solitaConfig
    const idlFile = path.join(idlDir, `${programName}.json`)
    const removed = await removeFileIfExists(idlFile)
    if (removed) {
      logInfo(
        `Removed existing IDL at ${idlFile}.\nDisable this by setting 'removeExistingIdl: false' inside the '.solitarc.js' config.`
      )
    }
  }

  let handlerResult: SolitaHandlerResult | undefined
  if (isSolitaConfigAnchor(solitaConfig)) {
    handlerResult = await handleAnchor(solitaConfig)
  }
  if (isSolitaConfigShank(solitaConfig)) {
    handlerResult = await handleShank(solitaConfig)
  }
  assert(
    handlerResult != null,
    `IDL generator ${solitaConfig.idlGenerator} is not supported`
  )

  if (isErrorResult(handlerResult)) {
    logError(handlerResult.errorMsg)
    assert(
      handlerResult.exitCode != 0,
      'Handler exit code should be non-zero if an error was encountered'
    )
    process.exit(handlerResult.exitCode)
  } else {
    logInfo('Success!')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err: any) => {
    logError(err)
    process.exit(1)
  })
