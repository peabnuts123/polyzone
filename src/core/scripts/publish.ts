import fs from 'node:fs/promises';
import path from 'node:path';

import { pathExists, spawnAsync, type PackageJsonType } from './util';

// Config
/**
 * Whether to actually publish to npm (false) or just do a "dry run" (true).
 */
const DryRun: boolean = true;
/**
 * Path to package.json.
 */
const PackageJsonPath: string = 'package.json';
/**
 * Directory path into which project builds.
 */
const DistDir: string = 'dist';
/**
 * Fields to remove from package.json before publishing.
 */
const FieldsToRemoveFromPackageJson: Array<keyof PackageJsonType> = ['scripts', 'devDependencies'];
/**
 * Additional files to copy into the publish directory.
 */
const AdditionalFiles: string[] = ['README.md'/* , 'LICENSE' */];


// Validation
/* Validate script is being run from project root */
const isInRoot = await pathExists(PackageJsonPath);
if (!isInRoot) {
  console.error(`Could not find '${PackageJsonPath}'. Is this script being run from the project root?`);
  process.exit(1);
}

// Main
/* Build project */
console.log(`Building project...`);
await spawnAsync('npm run build');

/* Ensure compiled project exists in dist directory */
const distDirExists = await pathExists(DistDir);
if (!distDirExists) {
  console.error(`Could not find dist folder '${DistDir}'. Did the project compile properly?`);
  process.exit(2);
}

/* Copy additional files to publish */
for (const fileToPublish of AdditionalFiles) {
  console.log(`Copying file '${fileToPublish}'...`);
  await fs.copyFile(fileToPublish, path.join(DistDir, fileToPublish));
}

/* Read package.json */
const packageJsonRaw = await fs.readFile(PackageJsonPath, 'utf8');
const PackageJson = JSON.parse(packageJsonRaw) as PackageJsonType;

/* Remove development-only fields */
console.log(`Removing fields from package.json: `, FieldsToRemoveFromPackageJson);
for (const fieldName of FieldsToRemoveFromPackageJson) {
  delete PackageJson[fieldName];
}

/* Write modified package.json into dist directory */
const publishedPackageJsonPath = path.join(DistDir, PackageJsonPath);
await fs.writeFile(publishedPackageJsonPath, JSON.stringify(PackageJson, null, 2));

/* Publish package */
if (DryRun) {
  console.log(`Dry run. Skipping publish to npm.`);
} else {
  process.chdir(DistDir);

  /* Publish to npm (with tag `latest`) */
  console.log(`Publishing package '${PackageJson.name}@${PackageJson.version}'...`);
  await spawnAsync('npm publish --access public');
  console.log(`Successfully published package '${PackageJson.name}@${PackageJson.version}'.`);
}

console.log(`Finished processing successfully.`);
