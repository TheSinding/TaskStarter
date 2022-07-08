// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { setDevOpsPATToken, SET_DEVOPS_PAT_TOKEN_COMMAND } from './commands/setDevOpsPATToken';
import { configuration } from './configuration';
import { setDevOpsOrganization } from './commands/setDevOpsOrganizaiton';
import { setDevOpsInstanceURL } from './commands/setDevopsInstanceURL';
import { setDevopsProject } from './commands/setDevopsProject';
import { setDevopsTeam } from './commands/setDevopsTeam';
import { startNewTask } from './commands/startNewTask';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "taskstarter" is now active!');

	initExt();
	const setPATToken = setDevOpsPATToken();
	const setOrganization = setDevOpsOrganization();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	context.subscriptions.push(
		setPATToken,
		setOrganization,
		setDevOpsInstanceURL(),
		setDevopsProject(),
		setDevopsTeam(),
		startNewTask()
	);
}

const initExt = () => {
	checkConfiguration();
};

const checkConfiguration = () => {
	const SET_TOKEN_ACTION = "Set token";

	if (!configuration.devopsPATToken) {
		vscode.window.showInformationMessage("Task starter - Could not initate, missing DevOps token",
			{ detail: "To use Task Starter you need to set your Azure DevOps token" }, SET_TOKEN_ACTION)
			.then((selection) => {
				if (selection === SET_TOKEN_ACTION) { vscode.commands.executeCommand(SET_DEVOPS_PAT_TOKEN_COMMAND); }
			});
	}
};

// this method is called when your extension is deactivated
export function deactivate() { }
