#!/usr/bin/env node
import {debuglog} from 'node:util';
import importLocal from 'import-local';
import isInstalledGlobally from 'is-installed-globally';

const log = debuglog('pn');

// Prefer the local installation
if (!importLocal(import.meta.url)) {
	if (isInstalledGlobally) {
		log('Using global install of pn.');
	}

	await import('./cli-implementation.js');
}
