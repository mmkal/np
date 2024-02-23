import process from 'node:process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {readPackageUp} from 'read-package-up';
import {parsePackage} from 'read-pkg';
import issueRegex from 'issue-regex';
import terminalLink from 'terminal-link';
import {execa} from 'execa';
import pMemoize from 'p-memoize';
import ow from 'ow';
import chalk from 'chalk';
import Version from './version.js';
import * as git from './git-util.js';
import * as npm from './npm/util.js';

export const readPkg = async (packagePath = process.cwd()) => {
	const packageResult = await readPackageUp({cwd: packagePath});

	if (!packageResult) {
		throw new Error('No `package.json` found. Make sure the current directory is a valid package.');
	}

	return {pkg: packageResult.packageJson, rootDir: path.dirname(packageResult.path)};
};

const _npRootDir = fileURLToPath(new URL('..', import.meta.url));

// Re-define `npRootDir` for trailing slash consistency
export const {pkg: npPkg, rootDir: npRootDir} = await readPkg(_npRootDir);

export const linkifyIssues = (url, message) => {
	if (!(url && terminalLink.isSupported)) {
		return message;
	}

	return message.replace(issueRegex(), issue => {
		const issuePart = issue.replace('#', '/issues/');

		if (issue.startsWith('#')) {
			return terminalLink(issue, `${url}${issuePart}`);
		}

		return terminalLink(issue, `https://github.com/${issuePart}`);
	});
};

export const linkifyCommit = (url, commit) => {
	if (!(url && terminalLink.isSupported)) {
		return commit;
	}

	return terminalLink(commit, `${url}/commit/${commit}`);
};

export const linkifyCommitRange = (url, commitRange) => {
	if (!(url && terminalLink.isSupported)) {
		return commitRange;
	}

	return terminalLink(commitRange, `${url}/compare/${commitRange}`);
};

/** @type {(config: import('./package-manager/types.js').PackageManagerConfig) => Promise<string>} */
export const getTagVersionPrefix = pMemoize(async config => {
	ow(config, ow.object.hasKeys('tagVersionPrefixCommand'));

	try {
		const {stdout} = await execa(...config.tagVersionPrefixCommand);

		return stdout;
	} catch {
		return 'v';
	}
});

export const joinList = list => chalk.reset(list.map(item => `- ${item}`).join('\n'));

export const groupFilesInFolders = (files, groupingMinimumDepth = 1, groupingThresholdCount = 5) => {
	const groups = {};
	for (const file of files) {
		const groupKey = path.join(...file.split(path.sep).slice(0, groupingMinimumDepth));
		groups[groupKey] = [...groups[groupKey] ?? [], file];
	}

	const lines = [];
	for (const [folder, filesInFolder] of Object.entries(groups)) {
		if (filesInFolder.length > groupingThresholdCount) {
			lines.push(`- ${folder}/* ${chalk.bold.white(`(${filesInFolder.length} files)`)}`);
			continue;
		}

		for (const file of filesInFolder) {
			lines.push(`- ${file}`);
		}
	}

	return chalk.reset(lines.join('\n'));
};

export const getNewFiles = async rootDir => {
	const listNewFiles = await git.newFilesSinceLastRelease(rootDir);
	const listPkgFiles = await npm.getFilesToBePacked(rootDir);

	return {
		unpublished: listNewFiles.filter(file => !listPkgFiles.includes(file) && !file.startsWith('.git')),
		firstTime: listNewFiles.filter(file => listPkgFiles.includes(file)),
	};
};

export const getNewDependencies = async (newPkg, rootDir) => {
	let oldPkgFile;

	try {
		oldPkgFile = await git.readFileFromLastRelease(path.resolve(rootDir, 'package.json'));
	} catch {
		// Handle first time publish
		return Object.keys(newPkg.dependencies ?? {});
	}

	const oldPkg = parsePackage(oldPkgFile);

	const newDependencies = [];

	for (const dependency of Object.keys(newPkg.dependencies ?? {})) {
		if (!oldPkg.dependencies?.[dependency]) {
			newDependencies.push(dependency);
		}
	}

	return newDependencies;
};

/** @type {(config: import('./package-manager/types.js').PackageManagerConfig) => Promise<string>} */
export const getPreReleasePrefix = pMemoize(async config => {
	ow(config, ow.object.hasKeys('cli'));

	try {
		const {stdout} = await execa(config.cli, ['config', 'get', 'preid']);

		return stdout === 'undefined' ? '' : stdout;
	} catch {
		return '';
	}
});

export const validateEngineVersionSatisfies = (engine, version) => {
	const engineRange = npPkg.engines[engine];
	if (!new Version(version).satisfies(engineRange)) {
		throw new Error(`\`np\` requires ${engine} ${engineRange}`);
	}
};

export async function getNpmPackageAccess(name) {
	const {stdout} = await execa('npm', ['access', 'get', 'status', name, '--json']);
	return JSON.parse(stdout)[name]; // Note: returns "private" for non-existent packages
}
