/* eslint-disable @typescript-eslint/naming-convention */
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { commands, QuickPickItem, ThemeIcon, window } from "vscode";
import { logger } from "../../logger";
import { TaskFields, UserInfo } from "./types";
import { listParents } from "./api";
import { WorkItemType, ThemeIconName } from "../../@types/VscodeTypes";
import { getWorkItemIcon } from "./utils";
import { COMMAND as startTaskCommand } from './startTask';
import { NoWorkItemsError } from "./NoWorkItemsError";

export const COMMAND = "taskstarter.startTaskFromParent";


const getParentOptions = (): Promise<QuickPickItem[]> =>
	new Promise(async (resolve, reject) => {
		const parents = await listParents();

		const tasks = parents.filter(itemFilter).map(itemMapper).reverse();
		if (!tasks.length) {
			return reject(new NoWorkItemsError());
		}
		resolve(tasks);
	});

const commandHandler = async () => {
	try {
		const title = "Start task from parent";

		logger.debug("Getting PBIs");
		window.showInformationMessage("Getting PBIs in current iteration");
		const pick = await window.showQuickPick<QuickPickItem>(getParentOptions(), {
			title,
			placeHolder: "Search by assignee, name or task id",
			matchOnDescription: true,
			matchOnDetail: true
		});
		if (!pick) {
			return;
		}
		const { description: id } = pick;
		commands.executeCommand(startTaskCommand, id);
	} catch (error: any) {
		logger.error(error);
		window.showErrorMessage(error.message);
	}
};

const itemMapper = (workItem: WorkItem): QuickPickItem => {
	const assignedTo: UserInfo = workItem.fields?.[TaskFields.ASSIGNED_TO];
	const itemType: WorkItemType = workItem.fields?.[TaskFields.TYPE];
	const taskState = workItem?.fields?.[TaskFields.STATE];

	const assignedToText = `Assigned to: ${assignedTo && assignedTo.displayName ? assignedTo.displayName : "None"}`;
	const taskTypeText = `Type: ${itemType ? itemType : "Unknown"}`;
	const taskStateText = `State: ${taskState ? taskState : "Unknown"}`;


	return {
		label: `$(${getWorkItemIcon(itemType)}) ${workItem.fields![TaskFields.TITLE]}`,
		description: `${workItem.id}`,
		detail: [taskTypeText, assignedToText, taskStateText].join(" | "),
		buttons: [{ iconPath: new ThemeIcon("open-editors-view-icon"), tooltip: "View on DevOps" }]
	};
};

const itemFilter = (task: WorkItem): Boolean => {
	const filter = ["Done"];
	const state = task?.fields?.[TaskFields.STATE];
	const type = task?.fields?.[TaskFields.TYPE];
	return !filter.includes(state) && !filter.includes(type);
};

export const startTaskFromParent = () => {
	return commands.registerCommand(COMMAND, commandHandler);
};