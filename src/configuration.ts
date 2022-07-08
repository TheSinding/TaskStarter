/* eslint-disable @typescript-eslint/naming-convention */
import { workspace, window, ConfigurationTarget } from "vscode";

export enum ConfigurationKeys {
    CONFIGURATION_SECTION = "taskstarter",
    DEVOPS_PAT_TOKEN = "devopsPATToken",
    DEVOPS_ORGANIZATION = "devopsOrganization",
    DEVOPS_INSTANCE_URL = "devopsInstanceURL",
    DEVOPS_PROJECT = "devopsProject",
    DEVOPS_TEAM = "devopsTeam"
}

export type ConfigurationKey = `${ConfigurationKeys}`;

export const configuration = {
    get configuration() {
        if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
            const { uri } = workspace.workspaceFolders[0];
            console.log("HERE", "Found workspace");

            return workspace.getConfiguration(ConfigurationKeys.CONFIGURATION_SECTION, uri);
        } else {
            return workspace.getConfiguration(ConfigurationKeys.CONFIGURATION_SECTION);
        }
    },
    get devopsOrganization(): string | undefined {
        return this.configuration.get<string | undefined>(ConfigurationKeys.DEVOPS_ORGANIZATION);
    },
    set devopsOrganization(value: string | undefined) {
        this.configuration.update(ConfigurationKeys.DEVOPS_ORGANIZATION, value, ConfigurationTarget.Workspace);
    },
    get devopsPATToken(): string | undefined {
        return this.configuration.get<string | undefined>(ConfigurationKeys.DEVOPS_PAT_TOKEN);
    },
    set devopsPATToken(value: string | undefined) {
        this.configuration.update(ConfigurationKeys.DEVOPS_PAT_TOKEN, value, ConfigurationTarget.Workspace);
    },
    get devopsInstanceURL(): string | undefined {
        return this.configuration.get<string | undefined>(ConfigurationKeys.DEVOPS_INSTANCE_URL);
    },
    set devopsInstanceURL(value: string | undefined) {
        this.configuration.update(ConfigurationKeys.DEVOPS_INSTANCE_URL, value, ConfigurationTarget.Workspace);
    },

    get devopsProject(): string | undefined {
        return this.configuration.get<string | undefined>(ConfigurationKeys.DEVOPS_PROJECT);
    },
    set devopsProject(value: string | undefined) {
        this.configuration.update(ConfigurationKeys.DEVOPS_PROJECT, value, ConfigurationTarget.Workspace);
    },
    get devopsTeam(): string | undefined {
        return this.configuration.get<string | undefined>(ConfigurationKeys.DEVOPS_TEAM);
    },
    set devopsTeam(value: string | undefined) {
        this.configuration.update(ConfigurationKeys.DEVOPS_TEAM, value, ConfigurationTarget.Workspace);
    }
};

function vscode(DEVOPS_ORGANIZATION: ConfigurationKeys, value: string | undefined, vscode: any) {
    throw new Error("Function not implemented.");
}
