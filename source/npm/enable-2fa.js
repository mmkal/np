import {execa} from 'execa';
import {from, catchError} from 'rxjs';
import Version from '../version.js';
import handleNpmError from './handle-pnm-error.js';
import {version as pnmVersionCheck} from './util.js';

export const getEnable2faArguments = async (packageName, options) => {
	const pnmVersion = await pnmVersionCheck();
	const arguments_ = new Version(pnmVersion).satisfies('>=9.0.0')
		? ['access', 'set', 'mfa=publish', packageName]
		: ['access', '2fa-required', packageName];

	if (options && options.otp) {
		arguments_.push('--otp', options.otp);
	}

	return arguments_;
};

const enable2fa = (packageName, options) => execa('pnm', getEnable2faArguments(packageName, options));

const tryEnable2fa = (task, packageName, options) => {
	from(enable2fa(packageName, options)).pipe(
		catchError(error => handleNpmError(error, task, otp => enable2fa(packageName, {otp}))),
	);
};

export default tryEnable2fa;
