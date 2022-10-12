/* eslint-disable @typescript-eslint/naming-convention */
import { commands, ThemeIcon, window } from 'vscode'
import { createNamespaced } from '../../logger'
import { listParents } from './api'
import { getWorkItemIcon } from './utils'
import { COMMAND as startTaskCommand } from './startTask'
import { COMMAND as openOnDevOpsCommand } from '../openOnDevOps'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { showProgressNotification } from '../../utils/showProgressNotification'
import { TaskPick } from './types'
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import { UserInfo, WorkItemType } from '../../@types/azure'

export const COMMAND = 'taskstarter.startTaskFromParent'
const logger = createNamespaced(COMMAND)

const commandHandler = async () => {
  try {
    const next = (selectedItems: readonly TaskPick[]) => {
      if (!selectedItems.length) {
        return
      }

      commands.executeCommand(startTaskCommand, selectedItems[0].workItem)
    }

    const title = 'Start task from parent'
    const placeholder = 'Search by assignee, name or task ID'

    logger.debug('Getting Parents')

    const picker = createQuickPickHelper<TaskPick>({
      title,
      placeholder,
      busy: true,
      matchOnDescription: true,
      matchOnDetail: true,
      ignoreFocusOut: true,
    })

    picker.show()

    const notificationTitle = 'Getting parents in current iteration'
    const parents = await showProgressNotification(notificationTitle, listParents())
    picker.items = parents.filter(itemFilter).map(itemMapper).reverse()
    picker.busy = false

    picker.onDidAccept(() => next(picker.selectedItems))
    picker.onDidTriggerItemButton(({ item }) => commands.executeCommand(openOnDevOpsCommand, item.description))
  } catch (error: any) {
    logger.error(error)
    window.showErrorMessage(error.message)
  }
}

const itemMapper = (workItem: WorkItem): TaskPick => {
  const assignedTo: UserInfo = workItem.fields?.['System.AssignedTo']
  const itemType: WorkItemType = workItem.fields?.['System.WorkItemType']
  const taskState = workItem?.fields?.['System.State']

  const assignedToText = `Assigned to: ${assignedTo && assignedTo.displayName ? assignedTo.displayName : 'None'}`
  const taskTypeText = `Type: ${itemType ? itemType : 'Unknown'}`
  const taskStateText = `State: ${taskState ? taskState : 'Unknown'}`
  const buttons = [{ iconPath: new ThemeIcon('open-editors-view-icon'), tooltip: 'View on DevOps' }]

  return {
    label: `${getWorkItemIcon(itemType)} ${workItem.fields!['System.Title']}`,
    description: `${workItem.id}`,
    detail: [taskTypeText, assignedToText, taskStateText].join(' | '),
    buttons,
    taskType: itemType,
    taskUrl: workItem.url,
    workItem: workItem,
  }
}

const itemFilter = (task: WorkItem): Boolean => {
  const filter = ['Done']
  const state = task?.fields?.['System.State']
  const type = task?.fields?.['System.WorkItemType']
  return !filter.includes(state) && !filter.includes(type)
}

export const startTaskFromParent = () => {
  return commands.registerCommand(COMMAND, commandHandler)
}
