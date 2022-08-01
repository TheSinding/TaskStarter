import { Profile } from "azure-devops-node-api/interfaces/ProfileInterfaces";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { getApi, getTeamContext } from "../../api";
import { NotFoundError } from "../../Errors/NotFoundError";
import { logger } from "../../logger";
import { NoWorkItemsError } from "./NoWorkItemsError";

export const listTasks = async (): Promise<WorkItem[]> => {
	logger.debug("Fetching tasks");
	const workApi = await getApi().getWorkApi();
	const witApi = await getApi().getWorkItemTrackingApi();

	const currentIteration = await workApi.getTeamIterations(getTeamContext(), "current");

	if (!currentIteration.length || !currentIteration[0].id) { throw new Error("Found no current iteration"); }

	const iterationItems = await workApi.getIterationWorkItems(getTeamContext(), currentIteration[0].id);
	if (!iterationItems.workItemRelations) { throw new NoWorkItemsError(); }

	const items = iterationItems.workItemRelations.filter(rel => rel.target?.id);

	logger.debug(`Found ${items.length} items`);

	return witApi.getWorkItems(items.map(rel => rel.target!.id as number));
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