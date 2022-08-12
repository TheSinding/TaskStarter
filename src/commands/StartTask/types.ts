import { UserIdentityRef } from 'azure-devops-node-api/interfaces/GalleryInterfaces'
import { WorkItem as _WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import { QuickPickItem, Uri } from 'vscode'
import { WorkItemType } from '../../@types/VscodeTypes'
export interface UserInfo extends UserIdentityRef {
  _links?: {
    avatar?: { href?: string }
  }
  uniqueName?: string
  imageUrl?: string
  descriptor?: string
}

export const fields = [
  'System.Title',
  'System.Id',
  'System.AssignedTo',
  'System.State',
  'System.WorkItemType',
  'Microsoft.VSTS.Scheduling.RemainingWork',
  'System.Parent',
] as const

export type WorkItemField = typeof fields[number]

export type WorkItem = _WorkItem & { fields?: Record<WorkItemField, any> }

export type TaskPick = QuickPickItem & { taskUri?: Uri; taskType?: WorkItemType }
