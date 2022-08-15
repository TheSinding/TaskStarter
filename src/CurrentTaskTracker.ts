import { ok } from 'assert'
import EventEmitter = require('events')
import { Repository } from './@types/git'
import { getTask } from './commands/StartTask/api'
import { WorkItem } from './commands/StartTask/types'
import { getBuiltInGitApi } from './git'
import { getBranchName } from './utils/getBranchName'

interface CurrentTaskEvents {
  currentTaskChanged: (workItem?: WorkItem) => void
  fetchingCurrentTask: () => void
}

export declare interface CurrentTaskTracker {
  on<U extends keyof CurrentTaskEvents>(event: U, listener: CurrentTaskEvents[U]): this
  once<U extends keyof CurrentTaskEvents>(event: U, listener: CurrentTaskEvents[U]): this
  emit<U extends keyof CurrentTaskEvents>(event: U, ...args: Parameters<CurrentTaskEvents[U]>): boolean
}

export class CurrentTaskTracker extends EventEmitter {
  private static _instance: CurrentTaskTracker
  private _repository: Repository | undefined
  private _currentTask: WorkItem | undefined
  private _prevBranchName: string = ''

  constructor() {
    super()
    this.setup()
  }

  private async setup() {
    const gitAPI = await getBuiltInGitApi()

    this._repository = gitAPI?.repositories[0]

    if (!this._repository) {
      return
    }

    this._repository.state.onDidChange(() => this.branchChanged())
    this.branchChanged()
  }

  private branchChanged() {
    if (!this._repository || this._repository.state.HEAD?.name === this._prevBranchName) {
      return
    }
    if (this._repository.state.HEAD) {
      this._prevBranchName = this._repository.state.HEAD.name as string
      const branchName = getBranchName(this._repository!)
      this.setCurrentTask(branchName)
    }
  }

  private getTaskID(branchName: string): string | undefined {
    const regex = /\/([0-9]+)-/
    const match = branchName.match(regex)
    if (match?.length && match.length > 1) {
      return match[1]
    }
    return undefined
  }

  private async setCurrentTask(branchName: string) {
    this.emit('fetchingCurrentTask')
    const taskId = this.getTaskID(branchName)
    if (taskId) {
      const task = await getTask(Number(taskId))
      if (task) {
        this._currentTask = task
      } else {
        this._currentTask = undefined
      }
    } else {
      this._currentTask = undefined
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
