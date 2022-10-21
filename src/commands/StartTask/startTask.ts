/* eslint-disable @typescript-eslint/naming-convention */
import { commands, QuickPick, window } from 'vscode'
import { listTasks } from './api'
import { createNamespaced } from '../../logger'
import { TaskPick } from './types'
import { COMMAND as startFromParentCommand } from './startTaskFromParent'
import { getListAllPick, taskMapper, workItemFilter } from './utils'
import { COMMAND as openOnDevOpsCommand } from '../openOnDevOps'
import { COMMAND as addNewTaskCommand } from '../AddTask/AddTask'
import { WorkItem } from '../../@types/azure'
import { getBuiltInGitApi } from '../../git'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { showProgressNotification } from '../../utils/showProgressNotification'
import { changeTask } from './changeTask'
import { Repository } from '../../@types/git'

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

export const startTask = () => {
  const getTaskOptions = async (onlyCurrentIteration: boolean, parentId?: number): Promise<TaskPick[]> => {
    try {
      const taskFilter = workItemFilter(['Bug', 'Done', 'Product Backlog Item'])
      const _tasks = await listTasks(onlyCurrentIteration, parentId)
      const tasks = _tasks.filter(taskFilter).map(taskMapper).reverse()
      return parentId
        ? [GO_BACK_ITEM, ADD_NEW_TASK_ITEM, ...tasks]
        : [getListAllPick(onlyCurrentIteration, COMMAND), ...tasks]
    } catch (error) {
      logger.error(error)
      if (parentId) return [GO_BACK_ITEM, ADD_NEW_TASK_ITEM]
      throw error
    }
  }

  const commandHandler = async (parentItem: WorkItem, onlyCurrentIteration: boolean = true) => {
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

      let notificationTitle = 'Getting tasks from '
      if (!onlyCurrentIteration) {
        notificationTitle += 'all iterations'
      } else {
        notificationTitle += ` ${parentItem?.id ? 'parent' : 'current iteration'}`
      }

      if (!onlyCurrentIteration) {
        window.showInformationMessage('Note: Listing all tasks can take a while.')
      }

      picker.items = await showProgressNotification(
        notificationTitle,
        getTaskOptions(onlyCurrentIteration, parentItem?.id)
      )
      picker.busy = false

      picker.onDidAccept(() => next(picker, onlyCurrentIteration, repository, parentItem))

      picker.onDidTriggerItemButton(({ item }) => commands.executeCommand(openOnDevOpsCommand, item.description))
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}

const next = (
  picker: QuickPick<TaskPick>,
  onlyCurrentIteration: boolean,
  repository: Repository,
  parentItem?: WorkItem
) => {
  if (!picker.selectedItems.length || !picker.enabled) return
  const selectedItem = picker.selectedItems[0]

  picker.enabled = false
  picker.busy = true
  picker.keepScrollPosition = true

  const payload = { id: selectedItem.description as string, title: selectedItem.taskName as string }

  switch (selectedItem.command) {
    case 'taskstarter.addNewTask':
      return commands.executeCommand(selectedItem.command, parentItem)
    case 'taskstarter.startTask':
      return commands.executeCommand(selectedItem.command, parentItem, !onlyCurrentIteration)
    case 'taskstarter.startTaskFromParent':
      return commands.executeCommand(selectedItem.command, onlyCurrentIteration)
  }

  changeTask(payload, repository, parentItem)
}
