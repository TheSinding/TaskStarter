import { UserIdentityRef } from "azure-devops-node-api/interfaces/GalleryInterfaces";

/* eslint-disable @typescript-eslint/naming-convention */
export enum TaskFields {
	TITLE = "System.Title",
	ID = "System.Id",
	ASSIGNED_TO = "System.AssignedTo",
	STATE = "System.State",
	TYPE = "System.WorkItemType",
	REMAINING_WORK = "Microsoft.VSTS.Scheduling.RemainingWork"
}

export interface UserInfo extends UserIdentityRef {
	_links?: {
		avatar?: { href?: string }
	}
	uniqueName?: string
	imageUrl?: string
	descriptor?: string
}

