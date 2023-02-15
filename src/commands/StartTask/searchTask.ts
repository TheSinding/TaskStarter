import { commands, window } from 'vscode'
import { createNamespaced } from '../../logger'
import { createQuickPickHelper } from '../../utils/createQuickPickHelper'
import * as api from './api'
import { TaskPick } from './types'
import { taskMapper } from './utils'
import { COMMAND as startTaskCommand } from './startTask'

export const COMMAND = 'taskstarter.searchTasks'

const logger = createNamespaced(COMMAND)
const DEBOUNCE_MS = 1000
let debouncer: NodeJS.Timeout

export const searchTasks = () => {
  const search = async (term: string): Promise<TaskPick[]> => {
    const tasks = await api.searchTasks(term)
    return tasks.map(taskMapper)
  }
  const commandHandler = async () => {
    try {
      logger.debug('Search task')
      const searchInput = createQuickPickHelper<TaskPick>({})
      searchInput.title = 'Search for a parent'

      searchInput.show()
      searchInput.matchOnDetail = true
      searchInput.matchOnDescription = true
      searchInput.ignoreFocusOut = true

      searchInput.onDidChangeValue((term) => {
        searchInput.items = []
        if (term) {
          searchInput.busy = true
        }
        clearTimeout(debouncer)
        debouncer = setTimeout(async () => {
          try {
            if (!term) return
            const items = await search(term)
            searchInput.items = items
            window.showInformationMessage(`Found ${items.length} task`)
          } catch (error) {
            window.showWarningMessage('Found no tasks. Try another search term')
          } finally {
            searchInput.busy = false
          }
        }, DEBOUNCE_MS)
      })
      searchInput.onDidAccept(() => {
        const item = searchInput.selectedItems[0]
        if (!item) {
          searchInput.hide()
          return
        }
        commands.executeCommand(startTaskCommand, item.workItem)
      })
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }

  return commands.registerCommand(COMMAND, commandHandler)
}
