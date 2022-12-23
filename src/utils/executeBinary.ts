import { red } from 'ansi-colors';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import path from 'path';
import { logError } from './logs';

export function executeBinary(
  binary: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) {
  return new Promise<number>((resolve, reject) => {
    const tool = path.basename(binary);
    const childProcess = spawn(binary, args, options)
      .on('error', (err) => {
        logError(`Failed to execute: ${tool} ${args}`);
        reject(err);
      })
      .on('exit', async (code) => {
        const exitCode = code ?? 0;
        if (exitCode !== 0) logError(`Failed to execute: ${tool} ${args}`);
        resolve(exitCode);
      });

    childProcess.stdout.on('data', (buf) => process.stdout.write(buf));
    childProcess.stderr.on('data', (buf) => {
      const dataStr = buf.toString();
      if (/^Error:/.test(dataStr)) {
        logError(red(dataStr));
      } else {
        process.stderr.write(buf);
      }
    });
  });
}
