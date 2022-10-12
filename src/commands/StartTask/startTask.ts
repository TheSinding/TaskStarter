/* eslint-disable @typescript-eslint/naming-convention */
import { commands, ThemeIcon, window } from 'vscode'
import { assignTask, getParentType, getTaskColumns, listTasks, moveTaskToColumn } from './api'
import { getProfile } from '../../api'
import { createNamespaced } from '../../logger'
import * as config from '../../configuration'
import { TaskPick } from './types'
import { NoWorkItemsError } from './NoWorkItemsError'
import { COMMAND as startFromParentCommand } from './startTaskFromParent'
import { getWorkItemIcon, nameBranch } from './utils'
import { COMMAND as openOnDevOpsCommand } from '../openOnDevOps'
import { COMMAND as addNewTaskCommand } from '../AddTask/AddTask'
import { WorkItemType, WorkItem, UserInfo } from '../../@types/azure'
import { getBuiltInGitApi } from '../../git'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { Repository } from '../../@types/git'
import { getWorkItemStateKey } from '../../CurrentTaskTracker'
import { showProgressNotification } from '../../utils/showProgressNotification'

// TODO: Simplify this file, please

export const COMMAND = 'taskstarter.startTask'
const logger = createNamespaced(COMMAND)

const GO_BACK_ITEM: TaskPick = {
  label: '$(arrow-left) Go back',
  alwaysShow: true,
  command: startFromParentCommand,
}
const ADD_NEW_TAASK_ITEM: TaskPick = {
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
      return parentId ? [GO_BACK_ITEM, ADD_NEW_TAASK_ITEM, ...tasks] : tasks
    } catch (error) {
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

        picker.enabled = false
        picker.busy = true
        picker.keepScrollPosition = true

        changeTask(picker.selectedItems[0], repository, parentItem)
      })

      picker.onDidTriggerItemButton(({ item }) => commands.executeCommand(openOnDevOpsCommand, item.description))
    } catch (error: any) {
      logger.error(error)
      if (error instanceof NoWorkItemsError && !!parentItem) {
        window.showErrorMessage(error.message)
      } else window.showErrorMessage(error.message)
    }
  }

  const changeTask = async (taskPick: TaskPick, repository: Repository, parentItem: WorkItem) => {
    if (taskPick.command) {
      return commands.executeCommand(taskPick.command, parentItem)
    }

    let _parentType: WorkItemType | undefined = parentItem.fields?.['System.WorkItemType']

    if (!_parentType) _parentType = await getParentType(Number(taskPick.description))

    const branchName = nameBranch(taskPick, _parentType)

    const confirmedBranchName = await window.showInputBox({
      placeHolder: branchName,
      title: 'New branch name',
      value: branchName,
    })

    try {
      if (!confirmedBranchName) throw new Error('Canceled changing task')

      const notificationTitle = `Starting task: "${taskPick.taskName}"`
      await showProgressNotification(notificationTitle, repository.createBranch(confirmedBranchName, true))

      // Set the work id in .git/config under newly created branch
      const configKey = getWorkItemStateKey(confirmedBranchName)
      repository.setConfig(configKey, taskPick.description as string)

      logger.debug(`Task started successfully`)
      window.showInformationMessage(`Started task: "${taskPick.taskName!}"`)

      // Try and fetch the current users profile to assign the task
      if (config.getProjectKey('autoAssignTask', true)) {
        getProfile()
          .then((me) => assignTask(Number(taskPick.description), me))
          .catch((e) => {
            logger.error(e)
            window.showErrorMessage('Failed to assign task to you.')
          })
      }

      if (config.getProjectKey('autoMoveTaskToInProgress', true)) moveTask(Number(taskPick.description))
    } catch (error: any) {
      logger.error(error)
      if (error.stderr) {
        const message = error.stderr.replace('fatal:', '').trim()
        window.showErrorMessage(message)
      } else {
        window.showErrorMessage(error.message)
      }
    }
  }

  const moveTask = async (taskId: number) => {
    try {
      let inProgressColumnName = config.getProjectKey('inProgressColumnName')
      if (!inProgressColumnName) {
        const { columns } = await getTaskColumns()
        if (!columns) throw new Error('No Columns')

        const columnsPicks = columns.map((c) => ({ label: c.name as string }))
        const newName = await window.showQuickPick(columnsPicks, {
          title: 'Set in-progress column, to automatically move it',
        })
        if (newName) {
          inProgressColumnName = newName.label
          await config.updateProjectKey('inProgressColumnName', newName.label)
        }
      }
      if (inProgressColumnName) await moveTaskToColumn(taskId, inProgressColumnName)
    } catch (error) {
      window.showWarningMessage("Didn't move task")
    }
  }

  return commands.registerCommand(COMMAND, commandHandler)
}
