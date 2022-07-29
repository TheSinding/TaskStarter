import * as config from '../configuration';
const FORBIDDEN_SEPARATOR_CHARS = [' ', '..', '~', '^', ':', '?', '*', '[', '@'];

export function sanitize(input: string, separator = '-'): string {
	FORBIDDEN_SEPARATOR_CHARS.forEach((forbiddenChar) => {
		if (separator.indexOf(forbiddenChar) !== -1) {
			throw new Error(`Invalid separator char: ${forbiddenChar}`);
		}
	});

	let output = input;

	output = output.replace(/\/\s+/g, '/');

	const toRemove = [
		/~/g,
		/\^/g,
		/:/g,
		/\\/g,
		/\.\.$/,
		/(@\{)+/g,
		/\?/g,
		/\*/g,
		/\[/g,
		/\"/g,
		/\'/g,
		/\[/g,
		/\]/g,
		/@/g,
		/\!/g,
		/\//g
	];
	output = toRemove.reduce((output, regexp) => {
		return output.replace(regexp, '');
	}, output);

	const toSeparate = [
		/(\.\.)+/g,
		/\s+/g
	];
	output = toSeparate.reduce((output, regexp) => {
		return output.replace(regexp, separator);
	}, output);

	output = output.replace(/\/\./g, '/')
		.replace(/\.lock/g, `${separator}lock`)
		.replace(/\/+/g, '/')
		.replace(/-{3,}/g, separator);

	return output;
}
