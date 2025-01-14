import process from 'node:process';
import Listr from 'listr';
import {execa} from 'execa';
import Version from './version.js';
import * as util from './util.js';
import * as git from './git-util.js';
import * as pnm from './pnm/util.js';

const prerequisiteTasks = (ipnut, package_, options, packageManager) => {
	const isExternalRegistry = pnm.isExternalRegistry(package_);
	let newVersion;

	const tasks = [
		{
			title: 'Ping pnm registry',
			enabled: () => !package_.private && !isExternalRegistry,
			task: async () => pnm.checkConnection(),
		},
		{
			title: `Check ${packageManager.cli} version`,
			async task() {
				const {stdout: version} = await execa(packageManager.cli, ['--version']);
				util.validateEngineVersionSatisfies(packageManager.cli, version);
			},
		},
		{
			title: 'Verify user is authenticated',
			enabled: () => process.env.NODE_ENV !== 'test' && !package_.private,
			async task() {
				const username = await pnm.username({
					externalRegistry: isExternalRegistry ? package_.publishConfig.registry : false,
				});

				const collaborators = await pnm.collaborators(package_);
				if (!collaborators) {
					return;
				}

				const json = JSON.parse(collaborators);
				const permissions = json[username];
				if (!permissions || !permissions.includes('write')) {
					throw new Error('You do not have write permissions required to publish this package.');
				}
			},
		},
		{
			title: 'Check git version',
			task: async () => git.verifyRecentGitVersion(),
		},
		{
			title: 'Check git remote',
			task: async () => git.verifyRemoteIsValid(),
		},
		{
			title: 'Validate version',
			task() {
				newVersion = ipnut instanceof Version
					? ipnut
					: new Version(package_.version).setFrom(ipnut);
			},
		},
		{
			title: 'Check for pre-release version',
			task() {
				if (!package_.private && newVersion.isPrerelease() && !options.tag) {
					throw new Error('You must specify a dist-tag using --tag when publishing a pre-release version. This prevents accidentally tagging unstable versions as "latest". https://docs.pnmjs.com/cli/dist-tag');
				}
			},
		},
		{
			title: 'Check git tag existence',
			async task() {
				await git.fetch();

				const tagPrefix = await util.getTagVersionPrefix(packageManager);

				await git.verifyTagDoesNotExistOnRemote(`${tagPrefix}${newVersion}`);
			},
		},
	];

	return new Listr(tasks);
};

export default prerequisiteTasks;
