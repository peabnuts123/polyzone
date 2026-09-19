import { rimraf } from 'rimraf';
import { replaceTscAliasPaths } from 'tsc-alias';
import { pathExists, spawnAsync } from './util';

/* Config */
/**
 * Path to tsconfig.json used to build the project.
 */
const TsConfigPath = 'tsconfig.build.json';
/**
 * Path to package.json.
 */
const PackageJsonPath = 'package.json';
/**
 * Path to directory into which project builds.
 */
const DistDir = 'dist';


// Validation
/* Validate script is being run from project root */
const isInRoot = await pathExists(PackageJsonPath);
if (!isInRoot) {
  console.error(`Could not find '${PackageJsonPath}'. Is this script being run from the project root?`);
  process.exit(1);
}

// Main
/* Clean */
console.log(`Cleaning build...`);
await spawnAsync(`tsc --build ${TsConfigPath} --clean`);
await rimraf(DistDir);

/* Compile */
console.log(`Compiling project...`);
await spawnAsync(`tsc --build ${TsConfigPath}`);

/* Rewrite import aliases */
console.log(`Rewriting import aliases...`);
await replaceTscAliasPaths({
  configFile: TsConfigPath,
});

console.log(`Finished processing successfully.`);
