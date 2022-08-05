import { UserIdentityRef } from "azure-devops-node-api/interfaces/GalleryInterfaces";

import { WorkItem as _WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";

/* eslint-disable @typescript-eslint/naming-convention */
// TODO remove this enum?
export enum TaskFields {
	TITLE = "System.Title",
	ID = "System.Id",
	ASSIGNED_TO = "System.AssignedTo",
	STATE = "System.State",
	TYPE = "System.WorkItemType",
	REMAINING_WORK = "Microsoft.VSTS.Scheduling.RemainingWork",
	PARENT = "System.Parent"
}

export interface UserInfo extends UserIdentityRef {
	_links?: {
		avatar?: { href?: string }
	}
	uniqueName?: string
	imageUrl?: string
	descriptor?: string
}

export const fields = ["System.Title",
	"System.Id",
	"System.AssignedTo",
	"System.State",
	"System.WorkItemType",
	"Microsoft.VSTS.Scheduling.RemainingWork",
	"System.Parent"
] as const;

type WorkItemField = typeof fields[number];

export type WorkItem = _WorkItem & { fields?: Record<WorkItemField, any> };