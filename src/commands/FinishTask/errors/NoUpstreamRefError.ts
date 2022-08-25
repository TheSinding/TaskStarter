export class NoUpstreamRefError extends Error {
	constructor() {
		super('No upstream exists, please publish your branch')
	}
}
