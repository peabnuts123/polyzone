import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

export interface PackageJsonType {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  keywords?: string[],
  homepage?: string;
  bugs?: {
    email?: string;
    url?: string;
  },
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  },
  type?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  license?: string;
};

export async function spawnAsync(command: string): Promise<void> {
  const [cmd, ...args] = command.split(/\s+/g);
  const npmProcess = spawn(cmd, args, { stdio: 'inherit' });
  await new Promise<void>((resolve, reject) => {
    npmProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`command exited with code ${code}`));
      }
    });
  });
}

export function pathExists(path: string): Promise<boolean> {
  return fs.access(path, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);
}

export async function findFiles(regex: RegExp, directory = '.'): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const matchedPaths: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      matchedPaths.push(...await findFiles(regex, entryPath));
    } else if (entry.isFile() && regex.test(entryPath)) {
      matchedPaths.push(entryPath);
    }
  }

  return matchedPaths;
}
