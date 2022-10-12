import { UserIdentityRef } from 'azure-devops-node-api/interfaces/GalleryInterfaces'
import { Profile } from 'azure-devops-node-api/interfaces/ProfileInterfaces'
import { WorkItem as AzureWorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'

export type WorkItemType = 'Product Backlog Item' | 'Bug' | 'Epic' | 'Feature' | 'Task' | 'Issue'

export type FullProfile = Profile & { emailAddress: string; displayName: string }

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
  'System.AreaPath',
  'System.IterationPath',
] as const

export type WorkItemField = typeof fields[number]

export type WorkItem = AzureWorkItem & { fields?: Record<WorkItemField, any> }
