/* eslint-disable @typescript-eslint/naming-convention */
import { commands, QuickPickItem, ThemeIcon, window } from 'vscode'
import { assignTask, getParentType, getTaskColumns, listTasks, moveTaskToColumn } from './api'
import { getProfile } from '../../api'
import { logger } from '../../logger'
import * as config from '../../configuration'
import { TaskPick, UserInfo, WorkItem } from './types'
import { NoWorkItemsError } from './NoWorkItemsError'
import { COMMAND as startFromParentCommand } from './startTaskFromParent'
import { getWorkItemIcon, nameBranch, stripIcons } from './utils'
import { COMMAND as openOnDevOpsCommand } from '../openOnDevOps'
import { WorkItemType } from '../../@types/VscodeTypes'
import { getBuiltInGitApi } from '../../git'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { Repository } from '../../@types/git'

// TODO: Simplify this file, please

export const COMMAND = 'taskstarter.startTask'

const GO_BACK_ITEM: QuickPickItem = {
  label: '$(arrow-left) Go back',
  alwaysShow: true,
}

const getTaskOptions = async (parentId?: number): Promise<TaskPick[]> => {
  try {
    const _tasks = await listTasks(parentId)
    const tasks = _tasks.filter(taskFilter).map(taskMapper).reverse()
    return parentId ? [GO_BACK_ITEM, ...tasks] : tasks
  } catch (error) {
    throw error
  }
}

const commandHandler = async (parentId?: number, parentType?: WorkItemType) => {
  try {
    const gitApi = await getBuiltInGitApi()
    if (!gitApi) {
      throw new Error('Could not find git API')
    }

    const repository = gitApi.repositories[0]
    const title = 'Pick a task'
    const placeholder = 'Search by assignee, name or task ID'
    logger.debug('Getting tasks')

    window.showInformationMessage(`Getting tasks from ${parentId ? 'parent' : 'current iteration'}`)

    const picker = createQuickPickHelper<TaskPick>({
      title,
      placeholder,
      busy: true,
      matchOnDescription: true,
      matchOnDetail: true,
      ignoreFocusOut: true,
    })

    picker.show()

    picker.items = await getTaskOptions(parentId)
    picker.busy = false

    picker.onDidAccept(() => {
      if (!picker.selectedItems.length || !picker.enabled) {
        return
      }

      picker.enabled = false
      picker.busy = true
      picker.keepScrollPosition = true

      changeTask(picker.selectedItems[0], repository, parentType)
    })

    picker.onDidTriggerItemButton(({ item }) => commands.executeCommand(openOnDevOpsCommand, item.description))
  } catch (error: any) {
    logger.error(error)
    if (error instanceof NoWorkItemsError && parentId) {
      window.showErrorMessage('No new work items in parent')
      commands.executeCommand(startFromParentCommand)
    } else {
      window.showErrorMessage(error.message)
    }
  }
}

const changeTask = async (taskPick: TaskPick, repository: Repository, parentType?: WorkItemType) => {
  if (stripIcons(taskPick.label).toLowerCase().includes('go back') && taskPick.alwaysShow) {
    return commands.executeCommand(startFromParentCommand)
  }

  let _parentType: WorkItemType | undefined = parentType

  if (!_parentType) {
    _parentType = await getParentType(Number(taskPick.description))
  }

  const branchName = nameBranch(taskPick, _parentType)

  const confirmedBranchName = await window.showInputBox({
    placeHolder: branchName,
    title: 'New branch name',
    value: branchName,
  })
  if (!confirmedBranchName) {
    throw new Error('Canceled changing task')
  }
  logger.debug(`Starting task: "${taskPick.label}"`)

  await repository.createBranch(confirmedBranchName, true)

  if (config.getProjectKey('autoAssignTask', true)) {
    getProfile()
      .then((me) => {
        return assignTask(Number(taskPick.description), me)
      })
      .catch((e) => {
        logger.error(e)
        window.showErrorMessage('Failed to assign task to you.')
      })
  }

  if (config.getProjectKey('autoMoveTaskToInProgress', true)) {
    moveTask(Number(taskPick.description))
  }
}

const moveTask = async (taskId: number) => {
  try {
    let inProgressColumnName = config.getProjectKey('inProgressColumnName')
    if (!inProgressColumnName) {
      const { columns } = await getTaskColumns()
      if (!columns) {
        throw new Error('No Columns')
      }
      const columnsPicks = columns.map((c) => ({ label: c.name as string }))
      const newName = await window.showQuickPick(columnsPicks, {
        title: 'Set in-progress column, to automatically move it',
      })
      if (newName) {
        inProgressColumnName = newName.label
        await config.updateProjectKey('inProgressColumnName', newName.label)
      }
    }
    if (inProgressColumnName) {
      await moveTaskToColumn(taskId, inProgressColumnName)
    }
  } catch (error) {
    window.showWarningMessage("Didn't move task")
  }
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
  return commands.registerCommand(COMMAND, commandHandler)
}
