import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

/** @typedef {import('../package.json') PackageJson } */

// CONFIG
/** Whether to actually publish to npm (false) or just do a "dry run" (true). */
const DryRun = false;
/** Path to package.json. */
const PackageJsonPath = 'package.json';
/** Path to directory into which project builds. */
const DistDir = 'dist/';
/**
 * Fields to remove from package.json before publishing.
 * @type {(keyof PackageJson)[]}
 */
const FieldsToRemoveFromPackageJson = ['scripts', 'devDependencies'];
/**
 * Additional files to copy into the publish directory
 */
const FilesToPublish = [
  'README.md',
];

// VALIDATION
// Validate script is being run from project root
const isInRoot = await pathExists(PackageJsonPath);
if (!isInRoot) {
  console.error(`Could not find '${PackageJsonPath}'. Is this script being run from the project root?`);
  process.exit(1);
}

// MAIN
// Build project
console.log(`Building project...`);
await spawnAsync('npm run build');


// Ensure compiled project exists in dist directory
const distDirExists = await pathExists(DistDir);
if (!distDirExists) {
  console.error(`Could not find dist folder '${DistDir}'. Did the project compile properly?`);
  process.exit(2);
}

// Copy additional files to publish
for (const fileToPublish of FilesToPublish) {
  console.log(`Copying file '${fileToPublish}'...`);
  await fs.copyFile(fileToPublish, path.join(DistDir, fileToPublish));
}

// Read package.json
const packageJsonRaw = await fs.readFile(PackageJsonPath, 'utf-8');
/** @type {PackageJson} */
const PackageJson = JSON.parse(packageJsonRaw);

// Extract version
const packageVersionParseResult = /\d+\.\d+\.\d+/.exec(PackageJson['version']);
/** @type {string} */
let packageVersion;
if (packageVersionParseResult === null) {
  console.error(`Could not parse package.json version: '${PackageJson['version']}'`);
  process.exit(3);
} else {
  packageVersion = packageVersionParseResult[0];
}

// Remove development-only fields
console.log(`Removing fields from package.json: `, FieldsToRemoveFromPackageJson);
FieldsToRemoveFromPackageJson.forEach((fieldName) => {
  delete PackageJson[fieldName];
});

// Write modified package.json into dist directory
const publishedPackageJsonPath = path.join(DistDir, PackageJsonPath);
await fs.writeFile(publishedPackageJsonPath, JSON.stringify(PackageJson, null, 2));

// Publish package
if (DryRun) {
  console.log(`Dry run. Skipping publish to npm.`);
} else {
  process.chdir(DistDir);

  // Publish to npm (with tag `latest`)
  console.log(`Publishing package '${PackageJson.name}@${PackageJson.version}'`);
  await spawnAsync('npm publish --access public');
  console.log(`Successfully published package '${PackageJson.name}@${PackageJson.version}'`);

  // Add tag `polyzone-vx.y.z`
  const versionTag = `polyzone-v${packageVersion}`;
  console.log(`Tagging version with '${versionTag}'`);
  await spawnAsync(`npm dist-tag add ${PackageJson.name}@${PackageJson.version} ${versionTag}`);
}

console.log(`Finished processing successfully.`);

// FUNCTIONS
/**
 * @param {string} command
 * @returns {Promise<void>}
 */
async function spawnAsync(command) {
  const [cmd, ...args] = command.split(/\s+/g);
  const npmProcess = spawn(cmd, args, { stdio: 'inherit' });
  await new Promise((resolve, reject) => {
    npmProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`command exited with code ${code}`));
      }
    });
  });
}

/**
 *
 * @param {string} path
 * @returns {Promise<boolean>}
 */
function pathExists(path) {
  return fs.access(path, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);
}
