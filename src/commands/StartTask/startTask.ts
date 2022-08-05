/* eslint-disable @typescript-eslint/naming-convention */
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { commands, Extension, extensions, QuickPickItem, window } from "vscode";
import { GitExtension, API as BuiltInGitApi } from "../../@types/git";
import { assignTask, getParentType, getTaskColumns, getTaskType, listTasks, moveTaskToColumn } from "./api";
import { getProfile } from '../../api';
import { logger } from "../../logger";
import { sanitize } from "../../utils/sanitizeBranch";
import * as config from '../../configuration';
import { TaskFields, UserInfo } from "./types";
import { NoWorkItemsError } from "./NoWorkItemsError";
import { COMMAND as startFromParentCommand } from './startTaskFromParent';
import { nameBranch, stripIcons } from "./utils";
import { WorkItemType } from "../../@types/VscodeTypes";

// TODO: Simplify this file, please

export const COMMAND = "taskstarter.startTask";

const getBuiltInGitApi = async (): Promise<BuiltInGitApi | undefined> => {
	try {
		const extension = extensions.getExtension('vscode.git') as Extension<GitExtension>;
		if (extension !== undefined) {
			const gitExtension = extension.isActive ? extension.exports : await extension.activate();

			return gitExtension.getAPI(1);
		}
	} catch { }
};

const GO_BACK_ITEM: QuickPickItem = {
	label: "$(arrow-left) Go back",
	alwaysShow: true,
};



const getTaskOptions = (parentId?: number): Promise<QuickPickItem[]> =>
	new Promise(async (resolve, reject) => {
		const _tasks = await listTasks(parentId);
		const tasks = _tasks.filter(taskFilter).map(taskMapper).reverse();

		if (!tasks.length) {
			return reject(new NoWorkItemsError());
		}
		resolve(parentId ? [GO_BACK_ITEM, ...tasks] : tasks);
	});

const commandHandler = async (parentId?: number) => {
	try {
		const title = "Pick a task";
		logger.debug("Getting tasks");
		const gitApi = await getBuiltInGitApi();
		if (!gitApi) { throw new Error("Could not find git API"); };

		const mainRepo = gitApi.repositories[0];

		window.showInformationMessage("Getting tasks in current iteration");

		const taskPick = await window.showQuickPick<QuickPickItem>(getTaskOptions(parentId),
			{
				title,
				placeHolder: "Search by assignee, name or task id",
				matchOnDescription: true,
				matchOnDetail: true
			});

		if (taskPick) {
			if (stripIcons(taskPick.label).toLowerCase().includes("go back") && taskPick.alwaysShow) {
				return commands.executeCommand(startFromParentCommand);
			}
			let parentType: WorkItemType;
			if (parentId) {
				parentType = await getTaskType(parentId);
			} else {
				parentType = await getParentType(Number(taskPick.description));
			}

			const branchName = nameBranch(taskPick, parentType);

			const confirmedBranchName = await window.showInputBox({ placeHolder: branchName, title: "New branch name", value: branchName });
			if (!confirmedBranchName) { throw new Error("Canceled changing task"); };
			logger.debug(`Starting task: "${taskPick.label}"`);

			await mainRepo.createBranch(confirmedBranchName, true);

			if (config.getProjectKey("autoAssignTask", true)) {
				getProfile().then(me => {
					return assignTask(Number(taskPick.description), me);
				}).catch(e => {
					logger.error(e);
					window.showErrorMessage("Failed to assign task to you.");
				});
			}

			if (config.getProjectKey("autoMoveTaskToInProgress", true)) {
				moveTask(Number(taskPick.description));
			}
			window.showInformationMessage(`Started task - ${taskPick.label}`);
		}

	} catch (error: any) {
		logger.error(error);
		if (error instanceof NoWorkItemsError && parentId) {
			window.showErrorMessage("No new work items in parent");
			commands.executeCommand(startFromParentCommand);
		} else {
			window.showErrorMessage(error.message);
		}
	}
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


export const startTask = () => {
	return commands.registerCommand(COMMAND, commandHandler);
};