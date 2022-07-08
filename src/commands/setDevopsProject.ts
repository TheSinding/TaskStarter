import { commands, window } from "vscode";
import { listProjects } from "../api";
import { configuration } from "../configuration";

export const COMMAND = "taskstarter.setDevOpsProject";
export const setDevopsProject = () => {
	const commandHandler = async () => {
		try {
			const projects = await listProjects();
			const projectName = await window.showQuickPick(projects.map(p => p.name as string));
			configuration.devopsProject = projectName;
		} catch (error) {
			console.error(error);
			window.showErrorMessage("Error setting project");
		}
	};
	return commands.registerCommand(COMMAND, commandHandler);
};