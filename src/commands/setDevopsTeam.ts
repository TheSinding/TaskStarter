import { commands, window } from "vscode";
import { listTeams } from "../api";
import { configuration } from "../configuration";

export const COMMAND = "taskstarter.setDevOpsTeam";
export const setDevopsTeam = () => {
	const commandHandler = async () => {
		try {
			const teams = await listTeams();
			const teamName = await window.showQuickPick(teams.map(t => t.name as string), { title: "Select your DevOps team:" });
			const team = teams.find(t => t.name === teamName);

			configuration.devopsProject = team?.projectName;
			configuration.devopsTeam = team?.name;
		} catch (error) {
			console.error(error);
			window.showErrorMessage("Error setting team");
		}
	};
	return commands.registerCommand(COMMAND, commandHandler);
};