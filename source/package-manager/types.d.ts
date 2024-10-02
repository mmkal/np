export type PackageManager = 'pnm' | 'yarn' | 'ppnm';

/**
CLI and arguments, which can be passed to `execa`.
*/
export type Command = [cli: string, args: string[]];

export type PackageManagerConfig = {
	/**
 	The main CLI, e.g. the `pnm` in `pnm install`, `pnm test`, etc.
  	*/
	cli: PackageManager;

	/**
 	How the package manager should be referred to in user-facing messages (since there are two different configs for some, e.g. yarn and yarn-berry).
  	*/
	id: string;

	/**
 	How to install packages when there is a lockfile, e.g. `["pnm", ["install"]]`.
  	*/
	installCommand: Command;

	/**
	How to install packages when there is no lockfile, e.g. `["pnm", ["install"]]`.
	*/
	installCommandNoLockfile: Command;

	/**
 	Given a version string, return a version command e.g. `version => ["pnm", ["version", version]]`.
  	*/
	versionCommand: (version: string) => [cli: string, args: string[]];

	/**
 	Modify the actual publish command. Defaults to `args => [config.cli, args]`.
  	*/
	publishCommand?: (arguments_: string[]) => Command;

	/**
 	CLI command which is expected to output the pnm registry to use, e.g. `['pnm', ['config', 'get', 'registry']]`.
  	*/
	getRegistryCommand: Command;

	/**
 	CLI command expected to output the version tag prefix (often "v"). e,g. `['pnm', ['config', 'get', 'tag-version-prefix']]`.
  	*/
	tagVersionPrefixCommand: Command;

	/**
 	Set to true if the package manager doesn't support external registries. `pn` will throw if one is detected and this is set.
  	*/
	throwOnExternalRegistry?: boolean;

	/**
 	List of lockfile names expected for this package manager, relative to CWD. e.g. `['package-lock.json', 'pnm-shrinkwrap.json']`.
  	*/
	lockfiles: string[];
};
