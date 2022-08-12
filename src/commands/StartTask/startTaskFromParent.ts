/* eslint-disable @typescript-eslint/naming-convention */
import { commands, env, ThemeIcon, Uri, window } from 'vscode'
import { logger } from '../../logger'
import { TaskPick, UserInfo, WorkItem } from './types'
import { listParents } from './api'
import { WorkItemType } from '../../@types/VscodeTypes'
import { getWorkItemIcon } from './utils'
import { COMMAND as startTaskCommand } from './startTask'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { getProjectKey } from '../../configuration'

export const COMMAND = 'taskstarter.startTaskFromParent'

const commandHandler = async () => {
  try {
    const next = (selectedItems: readonly TaskPick[]) => {
      if (!selectedItems.length) {
        return
      }
      const { description: id, taskType } = selectedItems[0]
      commands.executeCommand(startTaskCommand, id, taskType)
    }

    const title = 'Start task from parent'
    const placeholder = 'Search by assignee, name or task ID'

    logger.debug('Getting PBIs')
    window.showInformationMessage('Getting PBIs in current iteration')

    const picker = createQuickPickHelper<TaskPick>({
      title,
      placeholder,
      busy: true,
      matchOnDescription: true,
      matchOnDetail: true,
      ignoreFocusOut: true,
    })

    picker.show()

    const parents = await listParents()
    picker.items = parents.filter(itemFilter).map(itemMapper).reverse()
    picker.busy = false

    picker.onDidAccept(() => next(picker.selectedItems))
    picker.onDidTriggerItemButton(({ item }) => item.taskUri && env.openExternal(item.taskUri))
  } catch (error: any) {
    logger.error(error)
    window.showErrorMessage(error.message)
  }
}

const itemMapper = (workItem: WorkItem): TaskPick => {
  const organization = getProjectKey('devopsOrganization')
  const project = getProjectKey('devopsProject')
  const assignedTo: UserInfo = workItem.fields?.['System.AssignedTo']
  const itemType: WorkItemType = workItem.fields?.['System.WorkItemType']
  const taskState = workItem?.fields?.['System.State']

  const assignedToText = `Assigned to: ${assignedTo && assignedTo.displayName ? assignedTo.displayName : 'None'}`
  const taskTypeText = `Type: ${itemType ? itemType : 'Unknown'}`
  const taskStateText = `State: ${taskState ? taskState : 'Unknown'}`
  const buttons = []
  let taskUri: Uri | undefined

  if (organization && project) {
    taskUri = Uri.parse(`https://${organization}.visualstudio.com/${project}/_workitems/edit/${workItem.id}/`)
    buttons.push({ iconPath: new ThemeIcon('open-editors-view-icon'), tooltip: 'View on DevOps' })
  }

  return {
    label: `$(${getWorkItemIcon(itemType)}) ${workItem.fields!['System.Title']}`,
    description: `${workItem.id}`,
    detail: [taskTypeText, assignedToText, taskStateText].join(' | '),
    buttons,
    taskUri,
    taskType: itemType,
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
