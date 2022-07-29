import { commands, window } from "vscode";
import { listProjects } from "../api";
import * as config from "../configuration";
import { logger } from "../logger";

export const COMMAND = "taskstarter.setDevOpsProject";
export const setDevopsProject = () => {
	const commandHandler = async () => {
		logger.debug("Getting projects");
		const projects = await listProjects();
		logger.debug("Requesting project");
		const projectName = await window.showQuickPick(projects.map(p => p.name as string));
		await config.updateProjectKey("devopsProject", projectName);
	};
	return commands.registerCommand(COMMAND, commandHandler);
};