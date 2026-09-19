import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

import { type PackageJsonType } from './util';

interface NpmErrorResponse {
  error: {
    code: string;
    summary: string;
    detail: string;
  };
}

type QueryNpmResult = { success: true, version: string } | { success: false } & NpmErrorResponse;


/**
 * Path to package.json.
 */
const PackageJsonPath = 'package.json';


/* Read package.json */
const packageJsonRaw = await fs.readFile(PackageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonRaw) as PackageJsonType;

if (packageJson.name === undefined || packageJson.version === undefined) {
  throw new Error(`Package manifest '${PackageJsonPath}' must define both a name and version.`);
}

// Validate package exists (any version)
let result = queryNpm(packageJson.name);
if (result.success === true) {
  console.log(`Package '${packageJson.name}' exists on npm (version='${result.version}')`);
} else {
  throw new Error(`Package '${packageJson.name}' does not exist on npm`);
}

// Validate specified version does not exist
const versionedSlug = `${packageJson.name}@${packageJson.version}`;
result = queryNpm(versionedSlug);
if (result.success) {
  throw new Error(`Package version '${versionedSlug}' already exists on npm`);
} else if (result.error.code !== 'E404') {
  throw new Error(`Unexpected error resolving package '${versionedSlug}' on npm: ${JSON.stringify(result.error)}`);
}

console.log(`Package version '${versionedSlug}' does not exist on npm`);

/**
 * Query npm for a specified package slug.
 */
function queryNpm(slug: string): QueryNpmResult {
  const result = spawnSync('npm', [
    'info',
    '--json',
    slug,
    'version',
  ], { encoding: 'utf-8' });

  try {
    const response = JSON.parse(result.stdout) as unknown;
    if (typeof response === 'string') {
      return {
        success: true,
        version: response,
      };
    } else if (response !== null && typeof response === 'object' && 'error' in response) {
      return {
        ...response as NpmErrorResponse,
        success: false,
      };
    } else {
      throw new Error(`Received unexpected JSON response from npm: ${JSON.stringify(response, null, 2)}`);
    }
  } catch (e) {
    throw new Error(`Failed to parse JSON response from npm: ${JSON.stringify(e, null, 2)}`);
  }
}
