export class MissingConfigurationKeysError extends Error {
	constructor(keys: string | string[]) {
		super(`Missing configuration key(s) "${Array.isArray(keys) ? keys.join('", "') : keys}"`)
	}
}
