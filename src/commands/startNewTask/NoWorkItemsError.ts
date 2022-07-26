export class NoWorkItemsError extends Error {
	constructor() {
		super("No work items in current iteration");
	}
}