import { commands, window } from "vscode";
import { configuration } from "../configuration";

export const COMMAND = "taskstarter.setDevOpsInstanceURL";
export const setDevOpsInstanceURL = () => {
	const commandHandler = async () => {
		const instanceURL = await window.showQuickPick(["https://dev.azure.com"]);
		configuration.devopsProject = instanceURL;
	};
	return commands.registerCommand(COMMAND, commandHandler);
};