export class OrganizationNotProvidedError extends Error {
	constructor() {
		super("Organization not provided");
	}
}