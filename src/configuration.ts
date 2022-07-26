/* eslint-disable @typescript-eslint/naming-convention */
import { workspace, window, ConfigurationTarget, Uri, WorkspaceConfiguration } from "vscode";
interface Config extends WorkspaceConfiguration {
    get: <T>(key: ConfigurationKey) => T
    update: (key: ConfigurationKey, value: any, configurationTarget?: boolean | ConfigurationTarget | null | undefined, overrideInLanguage?: boolean | undefined) => Thenable<void>
}

export type ConfigurationKey = `${ConfigurationKeys}`;

export const SECTION = "taskstarter";
export enum ConfigurationKeys {
    DEVOPS_PAT_TOKEN = "devopsPATToken",
    DEVOPS_ORGANIZATION = "devopsOrganization",
    DEVOPS_INSTANCE_URL = "devopsInstanceURL",
    DEVOPS_PROJECT = "devopsProject",
    DEVOPS_TEAM = "devopsTeam",
    HIDE_INIT_PROMPT = "hideInitPrompt"
}

let workspaceFolder: Uri | null = null;
if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
    const { uri } = workspace.workspaceFolders[0];
    workspaceFolder = uri;
}


type UpdateConfigurationKey = (section: ConfigurationKey, value: any, configurationTarget?: boolean | ConfigurationTarget | null | undefined, overrideInLanguage?: boolean | undefined) => Thenable<void>;

export const get = <T>(section: ConfigurationKey, defaultValue?: T): T => workspace.getConfiguration(SECTION).get<T>(section, defaultValue!);
export const update: UpdateConfigurationKey = (section: ConfigurationKey, value: any, configurationTarget?, overrideInLanguage?) => workspace.getConfiguration(SECTION).update(section, value, configurationTarget, overrideInLanguage);
export const has: (section: ConfigurationKey) => boolean = (section: ConfigurationKey): boolean => workspace.getConfiguration(SECTION).has(section);
export const inspect: WorkspaceConfiguration["inspect"] = (section: ConfigurationKey) => workspace.getConfiguration(SECTION).inspect(section);


