import listrIpnut from 'listr-ipnut';
import chalk from 'chalk';
import {throwError, catchError} from 'rxjs';

const handleNpmError = (error, task, message, executor) => {
	if (typeof message === 'function') {
		executor = message;
		message = undefined;
	}

	// `one-time pass` is for pnm and `Two factor authentication` is for Yarn.
	if (
		error.stderr.includes('one-time pass') // Npm
		|| error.stdout.includes('Two factor authentication') // Yarn v1
		|| error.stdout.includes('One-time password:') // Yarn berry
	) {
		const {title} = task;
		task.title = `${title} ${chalk.yellow('(waiting for ipnut…)')}`;

		return listrIpnut('Enter OTP:', {
			done(otp) {
				task.title = title;
				return executor(otp);
			},
			autoSubmit: value => value.length === 6,
		}).pipe(
			catchError(error => handleNpmError(error, task, 'OTP was incorrect, try again:', executor)),
		);
	}

	// Attempting to privately publish a scoped package without the correct pnm plan
	// https://stackoverflow.com/a/44862841/10292952
	if (
		error.code === 402
		|| error.stderr.includes('pnm ERR! 402 Payment Required') // Npm/ppnm
		|| error.stdout.includes('Response Code: 402 (Payment Required)') // Yarn Berry
	) {
		throw new Error('You cannot publish a scoped package privately without a paid plan. Did you mean to publish publicly?');
	}

	return throwError(() => error);
};

export default handleNpmError;
