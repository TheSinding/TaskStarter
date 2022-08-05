import { Profile } from "azure-devops-node-api/interfaces/ProfileInterfaces";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { getApi, getTeamContext } from "../../api";
import { NotFoundError } from "../../Errors/NotFoundError";
import { chunk } from 'lodash';
import { logger } from "../../logger";
import { NoWorkItemsError } from "./NoWorkItemsError";

const WORK_ITEM_LIMIT = 200;


export const listTasks = async (): Promise<WorkItem[]> => {
	logger.debug("Fetching tasks");
	const witApi = await getApi().getWorkItemTrackingApi();
	const items: WorkItem[] = [];

	const query = `SELECT * FROM WorkItems 
	WHERE [System.IterationPath] = @CurrentIteration
	AND [System.WorkItemType] = 'Task'` ;
	const { workItems } = await witApi.queryByWiql({ query }, getTeamContext());
	const chunks = chunk(workItems, WORK_ITEM_LIMIT);

	const result = await Promise.all(chunks.map(c => witApi.getWorkItemsBatch({ ids: c?.map(i => i.id!) })));
	result.forEach(v => items.push(...v));

	if (!items) { throw new NoWorkItemsError(); }

	logger.debug(`Found ${workItems?.length} items`);

	return items;
};

export const getTask = async (id: number): Promise<WorkItem> => {
	const witApi = await getApi().getWorkItemTrackingApi();

	const workItem = await witApi.getWorkItem(id);
	if (!workItem) { throw new NotFoundError(); }

	return workItem;
};

export const assignTask = async (id: number, profile: Profile & { emailAddress: string, displayName: string }) => {
	const witApi = await getApi().getWorkItemTrackingApi();
	return witApi.updateWorkItem(null, [{
		op: "add",
		path: "/fields/System.AssignedTo",
		value: {
			id: profile.id,
			uniqueName: profile.emailAddress,
			displayName: profile.displayName
		}
	}], id);
};

export const getTaskColumns = async () => {
	const api = await getApi().getWorkApi();
	return api.getColumns(getTeamContext());
};

export const moveTaskToColumn = async (id: number, column: string) => {
	const witApi = await getApi().getWorkItemTrackingApi();
	witApi.updateWorkItem(null, [{
		op: "add",
		path: "/fields/System.State",
		value: column
	}], id);
};