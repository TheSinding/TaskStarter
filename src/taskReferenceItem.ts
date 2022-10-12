import { StatusBarAlignment, StatusBarItem, window, workspace } from 'vscode'
import { COMMAND as openOnDevOpsCommand } from './commands/openOnDevOps'
import { WorkItem } from './@types/azure'
import { CurrentTaskTracker } from './CurrentTaskTracker'
import { isInitialized } from './extension'

export const init = (): StatusBarItem => {
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)

  const setup = async () => {
    setVisibility()
    changeTitle()
    CurrentTaskTracker.instance.on('currentTaskChanged', changeTitle)
    CurrentTaskTracker.instance.on('fetchingCurrentTask', setLoading)
    workspace.onDidChangeWorkspaceFolders(setVisibility)
  }

  const setVisibility = () => {
    if (isInitialized()) {
      statusBarItem.show()
    } else {
      statusBarItem.hide()
    }
  }

  const setLoading = () => {
    statusBarItem.text = `$(loading~spin) Loading...`
  }

  const changeTitle = async (currentTask?: WorkItem) => {
    if (!currentTask) {
      statusBarItem.text = 'No current task'
      statusBarItem.tooltip = undefined
      statusBarItem.command = undefined
    } else {
      const title = `$(symbol-task) ${currentTask.id} - ${currentTask.fields?.['System.Title']}`
      statusBarItem.text = title
      statusBarItem.tooltip = 'Open on DevOps'
      statusBarItem.command = { title: 'Open on devops', command: openOnDevOpsCommand, arguments: [currentTask.id] }
    }
  }

  setup()

  return statusBarItem
}
