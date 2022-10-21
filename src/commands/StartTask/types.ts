import { WorkItem as _WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import { QuickPickItem } from 'vscode'
import { COMMAND as START_FROM_PARENTS_COMMAND } from './startTaskFromParent'
import { COMMAND as ADD_TASK_COMMAND } from '../AddTask/AddTask'
import { COMMAND as START_TASK_COMMAND } from './startTask'

export type TaskPickCommands = typeof START_FROM_PARENTS_COMMAND | typeof ADD_TASK_COMMAND | typeof START_TASK_COMMAND

export type TaskPick = QuickPickItem & {
  taskName?: string
  command?: TaskPickCommands
  workItem?: _WorkItem
}
