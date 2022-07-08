import { commands, ExtensionContext, window } from "vscode";
import { configuration } from "../configuration";

export const SET_DEVOPS_PAT_TOKEN_COMMAND = "taskstarter.setDevOpsPATToken";
export const setDevOpsPATToken = () => {
	const setTokenCommandHandler = async () => {
		const token = await window.showInputBox({ title: "Input your azure token", password: true });
		configuration.devopsPATToken = token;
	};
	return commands.registerCommand(SET_DEVOPS_PAT_TOKEN_COMMAND, setTokenCommandHandler);
};