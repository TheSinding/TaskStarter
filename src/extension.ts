// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { setDevOpsPATToken, COMMAND } from './commands/SetTokenCommand/setDevOpsPATToken';
import * as config from './configuration';
import { setDevOpsOrganization } from './commands/SetOrganizationCommand/setDevOpsOrganization';
import { setDevOpsInstanceURL } from './commands/setDevopsInstanceURL';
import { setDevopsProject } from './commands/setDevopsProject';
import { setDevopsTeam } from './commands/SetTeam/setDevopsTeam';
import { startNewTask } from './commands/startNewTask/startNewTask';
import { runInit, COMMAND as RUN_INIT_COMMAND } from './commands/runInit';

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
		runInit(),
		startNewTask()
	);


	vscode.workspace.onDidChangeConfiguration((event) => {
		if (!event.affectsConfiguration(config.SECTION)) { return; }
		setInitialized();
	});
}


const initExt = () => {
	const RUN_INIT = "Run init";
	const DONT_SHOW_AGAIN = "Don't show again";
	setInitialized();

	if (!isInitialized() && !config.get("hideInitPrompt", false)) {
		vscode.window.showInformationMessage("Task starter - Not initialized for this project", RUN_INIT, DONT_SHOW_AGAIN)
			.then((selection) => {
				if (selection === RUN_INIT) { vscode.commands.executeCommand(RUN_INIT_COMMAND); }
				if (selection === DONT_SHOW_AGAIN) {
					config.update("hideInitPrompt", true, true);
				}
			});
	}
};

const setInitialized = () => {
	vscode.commands.executeCommand('setContext', 'taskstarter.isInitialized',
		isInitialized()
	);
};

const isInitialized = (): boolean =>
	!!config.get("devopsPATToken") &&
	!!config.get("devopsProject") &&
	!!config.get("devopsTeam") &&
	!!config.get("devopsOrganization");


// this method is called when your extension is deactivated
export function deactivate() { }
