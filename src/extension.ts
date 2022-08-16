// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { setDevOpsPATToken } from './commands/SetTokenCommand/setDevOpsPATToken'
import * as config from './configuration'
import { setDevOpsOrganization } from './commands/SetOrganizationCommand/setDevOpsOrganization'
import { setDevOpsInstanceURL } from './commands/setDevopsInstanceURL'
import { setDevopsProject } from './commands/setDevopsProject'
import { setDevopsTeam } from './commands/SetTeam/setDevopsTeam'
import { startTask } from './commands/StartTask/startTask'
import { runInit, COMMAND as RUN_INIT_COMMAND } from './commands/runInit'
import { startTaskFromParent } from './commands/StartTask/startTaskFromParent'
import { init as initTaskReference } from './taskReferenceItem'
import { openOnDevOps } from './commands/openOnDevOps'
import { logger } from './logger'
import { finishTask } from './commands/FinishTask/finishTask'
import { CurrentTaskTracker } from './CurrentTaskTracker'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  logger.debug('TaskStarter is now active!')
  initExt()
  CurrentTaskTracker.init()

  context.subscriptions.push(
    setDevOpsPATToken(),
    setDevOpsOrganization(),
    setDevOpsInstanceURL(),
    setDevopsProject(),
    setDevopsTeam(),
    runInit(),
    startTask(),
    startTaskFromParent(),
    openOnDevOps(),
    initTaskReference(),
    finishTask()
  )

  vscode.workspace.onDidChangeConfiguration((event) => {
    // TODO: add a isReady flag to commands
    if (!event.affectsConfiguration(config.SECTION)) {
      return
    }
    setInitialized()
  })
}

const initExt = () => {
  const RUN_INIT = 'Run init'
  const DONT_SHOW_AGAIN = "Don't show again"
  setInitialized()

  if (!isInitialized() && !config.get('hideInitPrompt', false)) {
    vscode.window
      .showInformationMessage('Task starter - Not initialized for this project', RUN_INIT, DONT_SHOW_AGAIN)
      .then((selection) => {
        if (selection === RUN_INIT) {
          vscode.commands.executeCommand(RUN_INIT_COMMAND)
        }
        if (selection === DONT_SHOW_AGAIN) {
          config.update('hideInitPrompt', true, true)
        }
      })
  }
}

const setInitialized = () => {
  vscode.commands.executeCommand('setContext', 'taskstarter.isInitialized', isInitialized())
}

export const isInitialized = (): boolean =>
  !!config.getProjectKey('devopsPATToken') &&
  !!config.getProjectKey('devopsProject') &&
  !!config.getProjectKey('devopsTeam') &&
  !!config.getProjectKey('devopsOrganization')

// this method is called when your extension is deactivated
export function deactivate() {}
