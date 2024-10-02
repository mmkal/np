import os from 'node:os';
import isInstalledGlobally from 'is-installed-globally';
import {cosmiconfig} from 'cosmiconfig';

export default async function getConfig(rootDirectory) {
	const searchDirectory = isInstalledGlobally ? os.homedir() : rootDirectory;

	const searchPlaces = [
		'.pn-config.json',
		'.pn-config.js',
		'.pn-config.cjs',
		'.pn-config.mjs',
	];

	if (!isInstalledGlobally) {
		searchPlaces.push('package.json');
	}

	const explorer = cosmiconfig('pn', {
		searchPlaces,
		stopDir: searchDirectory,
	});

	const {config} = (await explorer.search(searchDirectory)) ?? {};

	return config;
}
