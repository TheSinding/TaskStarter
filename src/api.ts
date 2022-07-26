/* eslint-disable @typescript-eslint/naming-convention */
import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api';
import { TeamContext, TeamProjectReference, WebApiTeam } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import * as config from './configuration';
import { IterationWorkItems } from 'azure-devops-node-api/interfaces/WorkInterfaces';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { logger } from './logger';
import { NoWorkItemsError } from './commands/startNewTask/NoWorkItemsError';

const getTeamContext = (): TeamContext => ({ team: config.get<string>("devopsTeam"), project: config.get<string>("devopsProject") });

const getApi = (): WebApi => {
	if (!config.get("devopsPATToken")) { throw new Error("DevOps PAT Token not set"); };
	const token = config.get<string>("devopsPATToken");
	const instance = config.get<string>("devopsInstanceURL");
	const organization = config.get<string>("devopsOrganization");
	const authHandler = getPersonalAccessTokenHandler(token);
	logger.debug({ token, instance, organization });
	return new WebApi(`${instance}/${organization}`, authHandler);
};

export const listProjects = async (): Promise<TeamProjectReference[]> => {
	try {
		logger.debug("Fetching projects");
		const coreApi = await getApi().getCoreApi();
		const projects = await coreApi.getProjects();
		return projects;
	} catch (error) {
		logger.error(error, "Error fetching projects");
		throw error;
	}
};

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

export const listTeams = async (): Promise<WebApiTeam[]> => {
	try {
		logger.debug("Fetching teams");
		const coreApi = await getApi().getCoreApi();
		const teams = await coreApi.getAllTeams();
		return teams;
	} catch (error) {
		logger.error(error, "Error listing teams");
		throw error;
	}
};
