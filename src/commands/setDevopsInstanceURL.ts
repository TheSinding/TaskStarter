import { commands, window } from "vscode";
import * as config from "../configuration";

export const COMMAND = "taskstarter.setDevOpsInstanceURL";
export const setDevOpsInstanceURL = () => {
	const commandHandler = async () => {
		const instanceURL = await window.showQuickPick(["https://dev.azure.com"]);
		config.updateProjectKey("devopsInstanceURL", instanceURL);
	};
	return commands.registerCommand(COMMAND, commandHandler);
};