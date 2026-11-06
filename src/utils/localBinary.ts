import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { parse as parseToml } from 'smol-toml';
import { rustbinVersion } from '@metaplex-foundation/rustbin';
import { logInfo, logWarn } from './logs';

type CargoToml = Record<string, any>;

function readCargoToml(file: string): CargoToml | null {
  if (!existsSync(file)) return null;
  try {
    return parseToml(readFileSync(file, 'utf8'));
  } catch (err: any) {
    logWarn(`Failed to parse ${file}: ${err.message}`);
    return null;
  }
}

/**
 * Walks up from `dir` and returns the Cargo.toml defining the `[workspace]`
 * that contains it, if any.
 */
function findWorkspaceToml(dir: string): string | null {
  let current = path.resolve(dir);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(current, 'Cargo.toml');
    if (readCargoToml(candidate)?.workspace) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function pathOf(dep: unknown, tomlFile: string): string | null {
  if (dep && typeof dep === 'object' && typeof (dep as any).path === 'string') {
    return path.resolve(path.dirname(tomlFile), (dep as any).path);
  }
  return null;
}

function patchedPath(
  parsed: CargoToml | null,
  libName: string,
  tomlFile: string,
): string | null {
  const patches = parsed?.patch ?? {};
  for (const source of Object.keys(patches)) {
    const found = pathOf(patches[source]?.[libName], tomlFile);
    if (found) return found;
  }
  return null;
}

/**
 * Returns the local directory of `libName` if the program at `programDir`
 * depends on it via a `path` dependency, either directly, through
 * `[workspace.dependencies]`, or through a `[patch]` section.
 */
export function findLocalLibPath(
  programDir: string,
  libName: string,
): string | null {
  const programToml = path.resolve(programDir, 'Cargo.toml');
  const program = readCargoToml(programToml);
  const workspaceToml = findWorkspaceToml(programDir);
  const workspace = workspaceToml ? readCargoToml(workspaceToml) : null;

  // [patch] is only honored by cargo at the workspace root, but a program
  // that is its own root has it in its own Cargo.toml.
  const patched =
    (workspaceToml && patchedPath(workspace, libName, workspaceToml)) ||
    patchedPath(program, libName, programToml);
  if (patched) return patched;

  const dep =
    program?.dependencies?.[libName] ??
    program?.['build-dependencies']?.[libName];
  const direct = pathOf(dep, programToml);
  if (direct) return direct;

  if (dep?.workspace === true && workspaceToml) {
    return pathOf(workspace?.workspace?.dependencies?.[libName], workspaceToml);
  }

  return null;
}

/**
 * Builds the `binName` binary of the cargo package at `cliDir` and returns the
 * path of the resulting executable. Builds run inside `cliDir` so that its own
 * toolchain and target directory are used and rebuilds are incremental.
 */
export function cargoBuildBinary(
  cliDir: string,
  binName: string,
): Promise<string> {
  const manifestPath = path.join(cliDir, 'Cargo.toml');
  const args = [
    'build',
    '--manifest-path',
    manifestPath,
    '--bin',
    binName,
    '--message-format=json-render-diagnostics',
  ];
  logInfo(`Building local ${binName}: cargo ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    let executable: string | null = null;
    let buffer = '';
    const child = spawn('cargo', args, {
      cwd: cliDir,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      lines.forEach((line) => {
        try {
          const msg = JSON.parse(line);
          if (
            msg.reason === 'compiler-artifact' &&
            msg.executable &&
            msg.target?.name === binName
          ) {
            executable = msg.executable;
          }
        } catch {
          // Not a JSON message.
        }
      });
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Failed to build local ${binName} in ${cliDir}`));
      } else if (!executable) {
        reject(new Error(`cargo did not report a ${binName} executable`));
      } else {
        resolve(executable);
      }
    });
  });
}

export type LocalBinaryOptions = {
  /** Explicit path to the binary, takes precedence over everything else. */
  binaryPath?: string;
  /** Environment variable that may hold the path to the binary. */
  envVar: string;
  /** Name of the binary, used for messages. */
  binaryName: string;
  /**
   * When provided and the program depends on `libName` via a local path, the
   * CLI found at `cliDir(libPath)` is built and used.
   */
  localBuild?: {
    programDir: string;
    libName: string;
    cliDir: (libPath: string) => string;
  };
};

export type LocalBinaryResult = {
  fullPathToBinary: string;
  binVersion?: string;
  libVersion?: string;
};

/**
 * Resolves a binary that should be used instead of one installed by rustbin,
 * e.g. when testing a local checkout of shank against a program.
 *
 * @returns `null` when no local binary applies and rustbin should be used.
 */
export async function resolveLocalBinary(
  options: LocalBinaryOptions,
): Promise<LocalBinaryResult | null> {
  const { binaryName, envVar, localBuild } = options;
  const explicit = options.binaryPath || process.env[envVar];

  if (explicit) {
    const fullPathToBinary = path.resolve(explicit);
    if (!existsSync(fullPathToBinary)) {
      throw new Error(`${binaryName} binary not found at ${fullPathToBinary}`);
    }
    const binVersion = await rustbinVersion(fullPathToBinary);
    logInfo(`Using ${binaryName} ${binVersion ?? ''} at ${fullPathToBinary}`);
    return { fullPathToBinary, binVersion };
  }

  if (!localBuild) return null;
  const libPath = findLocalLibPath(localBuild.programDir, localBuild.libName);
  if (!libPath) return null;

  const cliDir = localBuild.cliDir(libPath);
  if (!existsSync(path.join(cliDir, 'Cargo.toml'))) {
    logWarn(
      `${localBuild.libName} is a path dependency (${libPath}) but no CLI was ` +
        `found at ${cliDir}. Falling back to installing ${binaryName}. ` +
        `Set ${envVar} to use a specific binary.`,
    );
    return null;
  }

  const fullPathToBinary = await cargoBuildBinary(cliDir, binaryName);
  const binVersion = await rustbinVersion(fullPathToBinary);
  const libVersion = readCargoToml(path.join(libPath, 'Cargo.toml'))?.package
    ?.version;
  logInfo(`Using local ${binaryName} ${binVersion ?? ''} built from ${cliDir}`);
  return { fullPathToBinary, binVersion, libVersion };
}
