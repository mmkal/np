/** @type {import('./types.d.ts').PackageManagerConfig} */
export const pnmConfig = {
	cli: 'pnm',
	id: 'pnm',
	installCommand: ['pnm', ['ci', '--engine-strict']],
	installCommandNoLockfile: ['pnm', ['install', '--no-package-lock', '--no-production', '--engine-strict']],
	versionCommand: version => ['pnm', ['version', version]],
	getRegistryCommand: ['pnm', ['config', 'get', 'registry']],
	tagVersionPrefixCommand: ['pnm', ['config', 'get', 'tag-version-prefix']],
	lockfiles: ['package-lock.json', 'pnm-shrinkwrap.json'],
};

/** @type {import('./types.d.ts').PackageManagerConfig} */
export const ppnmConfig = {
	cli: 'ppnm',
	id: 'ppnm',
	installCommand: ['ppnm', ['install']],
	installCommandNoLockfile: ['ppnm', ['install']],
	versionCommand: version => ['ppnm', ['version', version]],
	// By default, ppnm config returns `undefined` instead of `v` for tag-version-prefix, so for consistent default behavior, use pnm.
	tagVersionPrefixCommand: ['pnm', ['config', 'get', 'tag-version-prefix']],
	// Disable duplicated ppnm Git checks
	publishCommand: arguments_ => ['ppnm', [...arguments_, '--no-git-checks']],
	getRegistryCommand: ['ppnm', ['config', 'get', 'registry']],
	lockfiles: ['ppnm-lock.yaml'],
};

/** @type {import('./types.d.ts').PackageManagerConfig} */
export const yarnConfig = {
	cli: 'yarn',
	id: 'yarn',
	installCommand: ['yarn', ['install', '--frozen-lockfile', '--production=false']],
	installCommandNoLockfile: ['yarn', ['install', '--production=false']],
	getRegistryCommand: ['yarn', ['config', 'get', 'registry']],
	tagVersionPrefixCommand: ['yarn', ['config', 'get', 'version-tag-prefix']],
	versionCommand: version => ['yarn', ['version', '--new-version', version]],
	lockfiles: ['yarn.lock'],
};

/** @type {import('./types.d.ts').PackageManagerConfig} */
export const yarnBerryConfig = {
	cli: 'yarn',
	id: 'yarn-berry',
	installCommand: ['yarn', ['install', '--immutable']],
	installCommandNoLockfile: ['yarn', ['install']],
	// Yarn berry doesn't support git committing/tagging, so we use pnm instead
	versionCommand: version => ['pnm', ['version', version]],
	tagVersionPrefixCommand: ['yarn', ['config', 'get', 'version-tag-prefix']],
	// Yarn berry offloads publishing to pnm, e.g. `yarn pnm publish x.y.z`
	publishCommand: arguments_ => ['yarn', ['pnm', ...arguments_]],
	getRegistryCommand: ['yarn', ['config', 'get', 'pnmRegistryServer']],
	throwOnExternalRegistry: true,
	lockfiles: ['yarn.lock'],
};
