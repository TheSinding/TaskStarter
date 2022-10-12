import { WorkItem as _WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import { QuickPickItem } from 'vscode'
import { WorkItemType } from '../../@types/azure'

export type TaskPick = QuickPickItem & {
  taskUrl?: string
  taskType?: WorkItemType
  taskName?: string
  command?: string
  workItem?: _WorkItem
}
