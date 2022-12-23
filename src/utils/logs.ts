/* eslint-disable no-console */
import debug from 'debug';

export const logErrorDebug = debug('shank:error');
export const logWarnDebug = debug('shank:warn');
export const logInfoDebug = debug('shank:info');
export const logDebug = debug('shank:debug');
export const logTrace = debug('shank:trace');

export const logError = logErrorDebug.enabled
  ? logErrorDebug
  : console.error.bind(console);

export const logWarn = logErrorDebug.enabled
  ? logWarnDebug
  : console.warn.bind(console);

export const logInfo = logInfoDebug.enabled
  ? logInfoDebug
  : console.log.bind(console);
