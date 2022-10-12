import { ok } from 'assert'
import EventEmitter = require('events')
import { Repository } from './@types/git'

import { getTask } from './commands/StartTask/api'
import { WorkItem } from './@types/azure'
import { CustomGitAPI, getBuiltInGitApi } from './git'
import { createNamespaced } from './logger'

const logger = createNamespaced('CurrentTaskTracker')

interface CurrentTaskEvents {
  currentTaskChanged: (workItem?: WorkItem) => void
  fetchingCurrentTask: () => void
}

export declare interface CurrentTaskTracker {
  on<U extends keyof CurrentTaskEvents>(event: U, listener: CurrentTaskEvents[U]): this
  once<U extends keyof CurrentTaskEvents>(event: U, listener: CurrentTaskEvents[U]): this
  emit<U extends keyof CurrentTaskEvents>(event: U, ...args: Parameters<CurrentTaskEvents[U]>): boolean
}

export const getWorkItemStateKey = (branchName: string) => `branch.${branchName}.workitemid`

export class CurrentTaskTracker extends EventEmitter {
  private static _instance: CurrentTaskTracker
  private _repository: Repository | undefined
  private _currentTask: WorkItem | undefined
  private _gitAPI?: CustomGitAPI
  private _prevBranchName = ""

  constructor() {
    super()
    this.setup()
  }

  private async setup() {
    this._gitAPI = await getBuiltInGitApi()

    this._repository = this._gitAPI?.repositories[0]
    if (!this._repository) return

    this._repository.state.onDidChange(() => this._stateChange())

    this._repository.repository.onDidRunOperation((e) => {
      if (e.operation === "Checkout") this._stateChange()
      if (e.operation === "Config") this._stateChange()
    })
    this._stateChange()
  }

  private async _stateChange() {
    if (!this._repository) return

    const branchName = this._repository.state.HEAD?.name
    if (!branchName || branchName === this._prevBranchName) return
    logger.debug("Branch changed")
    this._prevBranchName = branchName

    try {
      const configKey = getWorkItemStateKey(branchName)
      const executedCmd = await this._gitAPI?.getConfigKey(this._repository?.rootUri.path, configKey)
      const workItemId = executedCmd?.stdout.trim()

      if (!workItemId) {
        logger.debug("Found no current task")
        this._unsetCurrentTask()
      } else {
        if (this._currentTask?.id !== Number(workItemId)) this._setCurrentTask(workItemId)
      }
    } catch (error) {
      logger.error(error, "Failed to get work task ID")
      this._unsetCurrentTask()
    }
  }

  private async _unsetCurrentTask() {
    this._currentTask = undefined
    this.emit('currentTaskChanged', this._currentTask)
  }

  private async _setCurrentTask(taskId: string) {
    this.emit('fetchingCurrentTask')
    const task = await getTask(Number(taskId))

    if (task) {
      logger.debug(`Current task: ${task.fields?.['System.Title']}`)
      this._currentTask = task
    } else {
      logger.error("Failed to find the current task")
      this._unsetCurrentTask()
    }
    this.emit('currentTaskChanged', this._currentTask)
  }

  public static get instance(): CurrentTaskTracker {
    ok(this._instance, 'Static instance not initialized, call .init()')
    return this._instance
  }

  public get currentTask(): WorkItem | undefined {
    return this._currentTask
  }

  public static init(): void {
    this._instance = new CurrentTaskTracker()
  }
}
