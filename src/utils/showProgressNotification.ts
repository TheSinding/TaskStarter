import { ProgressLocation, window } from "vscode";

export const showProgressNotification = <T>(message: string, cb: Promise<T>): Promise<T> => {
	return window.withProgress({ location: ProgressLocation.Notification }, async (p) => {
		p.report({ message })
		return cb
	}) as Promise<T>
}
