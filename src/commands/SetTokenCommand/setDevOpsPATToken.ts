import { commands, ExtensionContext, window } from "vscode";
import * as config from "../../configuration";
import { logger } from "../../logger";
import { TokenNotProvidedError } from "./TokenNotProvidedError";

export const COMMAND = "taskstarter.setDevOpsPATToken";
export const setDevOpsPATToken = () => {
	const setTokenCommandHandler = async () => {
		logger.debug("Requesting personal access token");
		const prevToken = config.get<string>("devopsPATToken", "");
		const token = await window.showInputBox({ title: "Input your azure personal access token", password: true, value: prevToken });
		if (!token) { throw new TokenNotProvidedError(); };
		await config.update("devopsPATToken", token, false);
	};
	return commands.registerCommand(COMMAND, setTokenCommandHandler);
};