/* eslint-disable @typescript-eslint/naming-convention */
import { UserIdentityRef } from "azure-devops-node-api/interfaces/GalleryInterfaces";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { commands, Extension, extensions, QuickPickItem, window } from "vscode";
import { GitExtension, API as BuiltInGitApi } from "../../@types/git";
import { assignTask, getTask, getTaskColumns, listTasks, moveTaskToColumn } from "./api";
import { getProfile } from '../../api';
import { logger } from "../../logger";
import { sanitize } from "../../utils/sanitizeBranch";
import * as config from '../../configuration';


const getBuiltInGitApi = async (): Promise<BuiltInGitApi | undefined> => {
	try {
		const extension = extensions.getExtension('vscode.git') as Extension<GitExtension>;
		if (extension !== undefined) {
			const gitExtension = extension.isActive ? extension.exports : await extension.activate();

			return gitExtension.getAPI(1);
		}
	} catch { }
};

interface UserInfo extends UserIdentityRef {
	_links?: {
		avatar?: { href?: string }
	}
	uniqueName?: string
	imageUrl?: string
	descriptor?: string
}

enum TaskFields {
	TITLE = "System.Title",
	ID = "System.Id",
	ASSIGNED_TO = "System.AssignedTo",
	STATE = "System.State",
	TYPE = "System.WorkItemType",
	REMAINING_WORK = "Microsoft.VSTS.Scheduling.RemainingWork"
}

export const COMMAND = "taskstarter.startNewTask";
export const startNewTask = () => {
	const getTaskOptions = (): Promise<QuickPickItem[]> => {
		return new Promise(async (resolve) => {
			const tasks = await listTasks();
			if (!tasks) { resolve([]); }
			resolve(tasks.filter(taskFilter).map(taskMapper));
		});
	};

	const commandHandler = async () => {
		try {
			logger.debug("Getting tasks");
			const gitApi = await getBuiltInGitApi();
			if (!gitApi) { throw new Error("Could not find git API"); };

			const mainRepo = gitApi.repositories[0];

			window.showInformationMessage("Getting tasks in current iteration");

			const task = await window.showQuickPick<QuickPickItem>(getTaskOptions());

			if (task) {
				let label = task.label;
				const customBranchRegex = config.getProjectKey("customBranchRegex");
				if (customBranchRegex) {
					const regex = new RegExp(customBranchRegex, "g");
					label = label.replaceAll(regex, "");
				}
				label = sanitize(label);

				const branchName = `feature/${task.description}-${label}`;
				const confirmedBranchName = await window.showInputBox({ placeHolder: branchName, title: "New branch name", value: branchName });
				if (!confirmedBranchName) { throw new Error("Canceled changing task"); };
				logger.debug(`Starting task: "${label}"`);

				// TODO: Don't get it from the api twice
				const fullTask = await getTask(Number(task.description));

				await mainRepo.createBranch(confirmedBranchName, true);

				if (config.getProjectKey("autoAssignTask", true)) {
					const me = await getProfile();
					await assignTask(Number(task.description), me);
				}

				if (config.getProjectKey("autoMoveTaskToInProgress", true)) {
					moveTask(Number(task.description));
				}
				window.showInformationMessage(`Started task - ${task.label}`);
			}

		} catch (error: any) {
			logger.error(error);
			window.showErrorMessage(error.message);
		}
	};
	return commands.registerCommand(COMMAND, commandHandler);
};

const moveTask = async (taskId: number) => {
	try {
		let inProgressColumnName = config.getProjectKey("inProgressColumnName");
		if (!inProgressColumnName) {
			const { columns } = await getTaskColumns();
			if (!columns) { throw new Error("No Columns"); }
			const columnsPicks = columns.map(c => ({ label: c.name as string }));
			const newName = await window.showQuickPick(columnsPicks, { title: "Set in-progress column, to automatically move it" });
			if (newName) {
				inProgressColumnName = newName.label;
				await config.updateProjectKey("inProgressColumnName", newName.label);
			}
		}
		if (inProgressColumnName) {
			await moveTaskToColumn(taskId, inProgressColumnName);
		}
	} catch (error) {
		window.showWarningMessage("Didn't move task");
	}
};


const taskMapper = (task: WorkItem): QuickPickItem => {
	const assignedTo: UserInfo = task?.fields?.[TaskFields.ASSIGNED_TO];
	const remainingWork = task?.fields?.[TaskFields.REMAINING_WORK];
	const taskState = task?.fields?.[TaskFields.STATE];

	const assignedToText = `Assigned to: ${assignedTo && assignedTo.displayName ? assignedTo.displayName : "None"}`;
	const taskWeightText = `Task weight: ${remainingWork ? remainingWork : "None"}`;
	const taskStateText = `State: ${taskState ? taskState : "Unknown"}`;

	return {
		label: task.fields![TaskFields.TITLE],
		description: `${task.id}`,
		detail: [assignedToText, taskWeightText, taskStateText].join(" | ")
	};
};

const taskFilter = (task: WorkItem): Boolean => {
	const filter = ["Product Backlog Item", "Bug", "Done"];
	const state = task?.fields?.[TaskFields.STATE];
	const type = task?.fields?.[TaskFields.TYPE];
	return !filter.includes(state) && !filter.includes(type);
};

