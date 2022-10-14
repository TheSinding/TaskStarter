/* eslint-disable @typescript-eslint/naming-convention */
import { commands, ThemeIcon, window } from 'vscode'
import { listTasks } from './api'
import { createNamespaced } from '../../logger'
import { TaskPick } from './types'
import { COMMAND as startFromParentCommand } from './startTaskFromParent'
import { getWorkItemIcon } from './utils'
import { COMMAND as openOnDevOpsCommand } from '../openOnDevOps'
import { COMMAND as addNewTaskCommand } from '../AddTask/AddTask'
import { WorkItem, UserInfo } from '../../@types/azure'
import { getBuiltInGitApi } from '../../git'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { showProgressNotification } from '../../utils/showProgressNotification'
import { changeTask } from './changeTask'

// TODO: Simplify this file, please

export const COMMAND = 'taskstarter.startTask'
const logger = createNamespaced(COMMAND)

const GO_BACK_ITEM: TaskPick = {
  label: '$(arrow-left) Go back',
  alwaysShow: true,
  command: startFromParentCommand,
}
const ADD_NEW_TASK_ITEM: TaskPick = {
  label: '$(plus) Add a task',
  alwaysShow: true,
  command: addNewTaskCommand,
}

const taskMapper = (task: WorkItem): TaskPick => {
  const assignedTo: UserInfo = task?.fields?.['System.AssignedTo']
  const remainingWork = task?.fields?.['Microsoft.VSTS.Scheduling.RemainingWork']
  const taskState = task?.fields?.['System.State']

  const assignedToText = `Assigned to: ${assignedTo && assignedTo.displayName ? assignedTo.displayName : 'None'}`
  const taskWeightText = `Task weight: ${remainingWork ? remainingWork : 'None'}`
  const taskStateText = `State: ${taskState ? taskState : 'Unknown'}`
  const buttons = [{ iconPath: new ThemeIcon('open-editors-view-icon'), tooltip: 'View on DevOps' }]

  return {
    label: `${getWorkItemIcon(task.fields?.['System.WorkItemType'])} ${task.fields!['System.Title']}`,
    description: `${task.id}`,
    detail: [assignedToText, taskWeightText, taskStateText].join(' | '),
    taskName: task.fields!['System.Title'],
    buttons,
  }
}

const taskFilter = (task: WorkItem): Boolean => {
  const filter = ['Product Backlog Item', 'Bug', 'Done']
  const state = task?.fields?.['System.State']
  const type = task?.fields?.['System.WorkItemType']
  return !filter.includes(state) && !filter.includes(type)
}

export const startTask = () => {
  const getTaskOptions = async (parentId?: number): Promise<TaskPick[]> => {
    try {
      const _tasks = await listTasks(parentId)
      const tasks = _tasks.filter(taskFilter).map(taskMapper).reverse()
      return parentId ? [GO_BACK_ITEM, ADD_NEW_TASK_ITEM, ...tasks] : tasks
    } catch (error) {
      if (parentId) return [GO_BACK_ITEM, ADD_NEW_TASK_ITEM]
      throw error
    }
  }

  const commandHandler = async (parentItem: WorkItem) => {
    try {
      const gitApi = await getBuiltInGitApi()
      if (!gitApi) throw new Error('Could not find git API')

      const repository = gitApi.repositories[0]
      const title = 'Pick a task'
      const placeholder = 'Search by assignee, name or task ID'
      logger.debug('Getting tasks')

      const picker = createQuickPickHelper<TaskPick>({
        title,
        placeholder,
        busy: true,
        matchOnDescription: true,
        matchOnDetail: true,
        ignoreFocusOut: true,
      })

      picker.show()

      const notificationTitle = `Getting tasks from ${parentItem.id ? 'parent' : 'current iteration'}`

      picker.items = await showProgressNotification(notificationTitle, getTaskOptions(parentItem.id))
      picker.busy = false

      picker.onDidAccept(() => {
        if (!picker.selectedItems.length || !picker.enabled) return
        const selectedItem = picker.selectedItems[0]

        picker.enabled = false
        picker.busy = true
        picker.keepScrollPosition = true

        const payload = { id: selectedItem.description as string, title: selectedItem.taskName as string }

        if (selectedItem.command) {
          return commands.executeCommand(selectedItem.command, parentItem)
        }

        changeTask(payload, repository, parentItem)
      })

      picker.onDidTriggerItemButton(({ item }) => commands.executeCommand(openOnDevOpsCommand, item.description))
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
