/* eslint-disable @typescript-eslint/naming-convention */
import { commands, window } from 'vscode'
import { createNamespaced } from '../../logger'
import { listParents } from './api'
import { getListAllPick, taskMapper, workItemFilter } from './utils'
import { COMMAND as startTaskCommand } from './startTask'
import { COMMAND as openOnDevOpsCommand } from '../openOnDevOps'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import { showProgressNotification } from '../../utils/showProgressNotification'
import { TaskPick } from './types'

export const COMMAND = 'taskstarter.startTaskFromParent'
const logger = createNamespaced(COMMAND)

const commandHandler = async (onlyCurrentIteration: boolean = true) => {
  try {
    const next = (selectedItems: readonly TaskPick[]) => {
      if (!selectedItems.length) {
        return
      }
      const selectedItem = selectedItems[0]

      switch (selectedItem.command) {
        case 'taskstarter.startTaskFromParent':
          return commands.executeCommand(COMMAND, !onlyCurrentIteration)
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

    const notificationTitle = `Getting parents from ${onlyCurrentIteration ? 'current iteration' : 'all iterations'}`
    const parents = await showProgressNotification(notificationTitle, listParents(onlyCurrentIteration))
    const taskFilter = workItemFilter(['Done'])
    picker.items = [
      getListAllPick(onlyCurrentIteration, COMMAND),
      ...parents.filter(taskFilter).map(taskMapper).reverse(),
    ]
    picker.busy = false

    picker.onDidAccept(() => next(picker.selectedItems))
    picker.onDidTriggerItemButton(({ item }) => commands.executeCommand(openOnDevOpsCommand, item.description))
  } catch (error: any) {
    logger.error(error)
    window.showErrorMessage(error.message)
  }
}

export const startTaskFromParent = () => {
  return commands.registerCommand(COMMAND, commandHandler)
}
