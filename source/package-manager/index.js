import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import * as configs from './configs.js';

/**
@param {string} rootDirectory
@param {import('./types.d.ts').PackageManagerConfig} config
*/
export function findLockfile(rootDirectory, config) {
	return config.lockfiles
		.map(filename => path.resolve(rootDirectory || '.', filename))
		.find(filepath => fs.existsSync(filepath));
}

/**
@param {string} rootDirectory
@param {import('read-pkg').NormalizedPackageJson} package_
*/
export function getPackageManagerConfig(rootDirectory, package_) {
	const config = configFromPackageManagerField(package_);
	return config || configFromLockfile(rootDirectory) || configs.pnmConfig;
}

/** @param {import('read-pkg').NormalizedPackageJson} package_ */
function configFromPackageManagerField(package_) {
	if (typeof package_.packageManager !== 'string') {
		return undefined;
	}

	const [packageManager, version] = package_.packageManager.split('@');

	if (packageManager === 'yarn' && version && semver.gte(version, '2.0.0')) {
		return configs.yarnBerryConfig;
	}

	if (packageManager === 'pnm') {
		return configs.pnmConfig;
	}

	if (packageManager === 'ppnm') {
		return configs.ppnmConfig;
	}

	if (packageManager === 'yarn') {
		return configs.yarnConfig;
	}

	throw new Error(`Invalid package manager: ${package_.packageManager}`);
}

/** @param {string} rootDirectory */
function configFromLockfile(rootDirectory, options = [configs.pnmConfig, configs.ppnmConfig, configs.yarnConfig]) {
	return options.find(config => findLockfile(rootDirectory, config));
}

/** @param {import('./types.d.ts').Command} command */
export function printCommand([cli, arguments_]) {
	return `${cli} ${arguments_.join(' ')}`;
}
