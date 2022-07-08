import { commands, window } from "vscode";
import { configuration } from "../configuration";

export const SET_DEVOPS_ORGANIZATION_COMMAND = "taskstarter.setDevOpsOrganization";
export const setDevOpsOrganization = () => {
	const commandHandler = async () => {
		const organization = await window.showInputBox({ title: "Input your DevOps organization" });
		configuration.devopsOrganization = organization;

	};
	return commands.registerCommand(SET_DEVOPS_ORGANIZATION_COMMAND, commandHandler);
};