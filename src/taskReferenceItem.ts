import { EventEmitter } from 'stream'
import { StatusBarAlignment, StatusBarItem, window } from 'vscode'
import { API, RefType, Repository } from './@types/git'
import { COMMAND as openOnDevOpsCommand } from './commands/openOnDevOps'
import { getTask } from './commands/StartTask/api'
import { WorkItem } from './commands/StartTask/types'
import { getBuiltInGitApi } from './git'

type CurrentTaskItemEvents = 'currentTaskChanged' | 'fetchingCurrentTask'
type CurrentTaskItemEmitter = Omit<EventEmitter, 'emit'> & {
  emit(event: CurrentTaskItemEvents, ...args: any[]): void
  emit(event: CurrentTaskItemEvents): void
  on(event: CurrentTaskItemEvents, fn: () => void): void
  once(event: CurrentTaskItemEvents, fn: () => void): void
}

export const init = (): StatusBarItem => {
  let repository: Repository | undefined
  let gitAPI: API | undefined
  let currentTask: WorkItem | undefined
  const stateEmitter: CurrentTaskItemEmitter = new EventEmitter()
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)

  const getBranchName = (repository: Repository) => {
    const HEAD = repository.state.HEAD

    if (!HEAD) {
      return ''
    }

    const tag = repository.state.refs.filter((iref) => iref.type === RefType.Tag && iref.commit === HEAD.commit)[0]
    const tagName = tag && tag.name
    const head = HEAD.name || tagName || (HEAD.commit || '').slice(0, 8)

    return head
  }

  const setup = async () => {
    gitAPI = await getBuiltInGitApi()

    repository = gitAPI?.repositories[0]
    if (!repository) {
      return
    }
    repository.state.onDidChange(branchChanged)
    stateEmitter.on('currentTaskChanged', changeTitle)
    stateEmitter.on('fetchingCurrentTask', setLoading)
  }

  const branchChanged = () => {
    if (repository) {
      const branchName = getBranchName(repository)
      setCurrentTask(branchName)
      statusBarItem.show()
    } else {
      statusBarItem.hide()
    }
  }

  const setCurrentTask = async (branchName: string) => {
    stateEmitter.emit('fetchingCurrentTask')
    const taskId = getTaskID(branchName)
    if (taskId) {
      const task = await getTask(Number(taskId), ['System.Title'])
      if (task) {
        currentTask = task
        changeTitle()
      } else {
        currentTask = undefined
      }
    } else {
      currentTask = undefined
    }
    stateEmitter.emit('currentTaskChanged')
  }

  const getTaskID = (branchName: string): string | undefined => {
    const regex = /\/([0-9]+)-/
    const match = branchName.match(regex)
    if (match?.length && match.length > 1) {
      return match[1]
    }
    return undefined
  }

  const setLoading = () => {
    statusBarItem.text = `$(loading~spin) Loading...`
  }

  const changeTitle = async () => {
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
