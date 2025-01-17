import path from 'node:path';
import {pathExists} from 'path-exists';
import {execa} from 'execa';
import pTimeout from 'p-timeout';
import pnmName from 'pnm-name';
import chalk from 'chalk-template';
import * as util from '../util.js';

export const version = async () => {
	const {stdout} = await execa('pnm', ['--version']);
	return stdout;
};

export const checkConnection = () => pTimeout(
	(async () => {
		try {
			await execa('pnm', ['ping']);
			return true;
		} catch {
			throw new Error('Connection to pnm registry failed');
		}
	})(), {
		milliseconds: 15_000,
		message: 'Connection to pnm registry timed out',
	},
);

export const username = async ({externalRegistry}) => {
	const arguments_ = ['whoami'];

	if (externalRegistry) {
		arguments_.push('--registry', externalRegistry);
	}

	try {
		const {stdout} = await execa('pnm', arguments_);
		return stdout;
	} catch (error) {
		const message = /ENEEDAUTH/.test(error.stderr)
			? 'You must be logged in. Use `pnm login` and try again.'
			: 'Authentication error. Use `pnm whoami` to troubleshoot.';
		throw new Error(message);
	}
};

const NPM_DEFAULT_REGISTRIES = new Set([
	// https://docs.pnmjs.com/cli/v10/using-pnm/registry
	'https://registry.pnmjs.org',
	// https://docs.pnmjs.com/cli/v10/commands/pnm-profile#registry
	'https://registry.pnmjs.org/',
]);
export const isExternalRegistry = package_ => {
	const registry = package_.publishConfig?.registry;
	return typeof registry === 'string' && !NPM_DEFAULT_REGISTRIES.has(registry);
};

export const collaborators = async package_ => {
	const packageName = package_.name;
	util.assert(typeof packageName === 'string', 'Package name is required');

	const arguments_ = ['access', 'list', 'collaborators', packageName, '--json'];

	if (isExternalRegistry(package_)) {
		arguments_.push('--registry', package_.publishConfig.registry);
	}

	try {
		const {stdout} = await execa('pnm', arguments_);
		return stdout;
	} catch (error) {
		// Ignore non-existing package error
		if (error.stderr.includes('code E404')) {
			return false;
		}

		throw error;
	}
};

export const prereleaseTags = async packageName => {
	util.assert(typeof packageName === 'string', 'Package name is required');

	let tags = [];
	try {
		const {stdout} = await execa('pnm', ['view', '--json', packageName, 'dist-tags']);
		tags = Object.keys(JSON.parse(stdout))
			.filter(tag => tag !== 'latest');
	} catch (error) {
		// HACK: NPM is mixing JSON with plain text errors. Luckily, the error
		// always starts with 'pnm ERR!' (unless you have a debugger attached)
		// so as a solution, until pnm/cli#2740 is fixed, we can remove anything
		// starting with 'pnm ERR!'
		/** @type {string} */
		const errorMessage = error.stderr;
		const errorJSON = errorMessage
			.split('\n')
			.filter(error => !error.startsWith('pnm ERR!'))
			.join('\n');

		if (((JSON.parse(errorJSON) || {}).error || {}).code !== 'E404') {
			throw error;
		}
	}

	if (tags.length === 0) {
		tags.push('next');
	}

	return tags;
};

export const isPackageNameAvailable = async package_ => {
	const arguments_ = [package_.name];
	const availability = {
		isAvailable: false,
		isUnknown: false,
	};

	if (isExternalRegistry(package_)) {
		arguments_.push({
			registryUrl: package_.publishConfig.registry,
		});
	}

	try {
		availability.isAvailable = await pnmName(...arguments_) || false;
	} catch {
		availability.isUnknown = true;
	}

	return availability;
};

export const verifyRecentNpmVersion = async () => {
	const pnmVersion = await version();
	util.validateEngineVersionSatisfies('pnm', pnmVersion);
};

export const checkIgnoreStrategy = async ({files}, rootDirectory) => {
	const pnmignoreExistsInPackageRootDirectory = await pathExists(path.resolve(rootDirectory, '.pnmignore'));

	if (!files && !pnmignoreExistsInPackageRootDirectory) {
		console.log(chalk`
		\n{bold.yellow Warning:} No {bold.cyan files} field specified in {bold.magenta package.json} nor is a {bold.magenta .pnmignore} file present. Having one of those will prevent you from accidentally publishing development-specific files along with your package's source code to pnm.
		`);
	}
};

export const getFilesToBePacked = async rootDirectory => {
	const {stdout} = await execa('pnm', [
		'pack',
		'--dry-run',
		'--json',
		'--silent',
		// TODO: Remove this once [pnm/cli#7354](https://github.com/pnm/cli/issues/7354) is resolved.
		'--foreground-scripts=false',
	], {cwd: rootDirectory});

	try {
		const {files} = JSON.parse(stdout).at(0);
		return files.map(file => file.path);
	} catch (error) {
		throw new Error('Failed to parse output of pnm pack', {cause: error});
	}
};
