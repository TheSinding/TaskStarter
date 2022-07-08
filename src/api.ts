/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios';
import * as vscode from 'vscode';
import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api';
import { TeamContext, TeamProjectReference, WebApiTeam } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { configuration, ConfigurationKeys } from './configuration';
import { IterationWorkItems } from 'azure-devops-node-api/interfaces/WorkInterfaces';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';





const api = {
	_instance: null as null | WebApi,
	get instance(): WebApi {
		if (!this._instance) {
			this.refresh();
		}
		return this._instance as WebApi;
	},
	get teamContext(): TeamContext {
		return { team: configuration.devopsTeam, project: configuration.devopsProject };
	},
	refresh() {
		console.log("refreshing");
		if (!configuration.devopsPATToken) { throw new Error("DevOps PAT Token not set"); };
		const authHandler = getPersonalAccessTokenHandler(configuration.devopsPATToken);
		this._instance = new WebApi(`${configuration.devopsInstanceURL}/${configuration.devopsOrganization}`, authHandler);
	}
};
vscode.workspace.onDidChangeConfiguration(event => {
	const keys = [
		ConfigurationKeys.DEVOPS_INSTANCE_URL,
		ConfigurationKeys.DEVOPS_ORGANIZATION,
		ConfigurationKeys.DEVOPS_PAT_TOKEN
	].map(key => `${ConfigurationKeys.CONFIGURATION_SECTION}.${key}`);

	if (keys.some(key => event.affectsConfiguration(key))) {
		api.refresh();
	}
});

export const listProjects = async (): Promise<TeamProjectReference[]> => {
	const projects = await (await api.instance.getCoreApi()).getProjects();
	return projects;
};


export const listTasks = async (): Promise<WorkItem[]> => {
	const workApi = await api.instance.getWorkApi();
	const witApi = await api.instance.getWorkItemTrackingApi();
	const iterations = await workApi.getTeamIterations(api.teamContext);
	const currentIteration = iterations[iterations.length - 1];
	if (!currentIteration || !currentIteration.id) { throw new Error("Found no current iteration"); }
	const iterationItems = await workApi.getIterationWorkItems(api.teamContext, currentIteration.id);
	if (!iterationItems.workItemRelations) { throw new Error("woops"); }
	const items = iterationItems.workItemRelations.filter(rel => rel.target?.id);

	return witApi.getWorkItems(items.map(rel => rel.target!.id as number));
};

export const listTeams = async (): Promise<WebApiTeam[]> => {
	const teams = await (await api.instance.getCoreApi()).getAllTeams();
	return teams;
};
export const getMe = async (): Promise<string> => {
	const _api = await api.instance.getCoreApi();
	return "";
};
