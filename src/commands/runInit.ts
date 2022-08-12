/* eslint-disable @typescript-eslint/naming-convention */
import { commands, window } from 'vscode'
import { COMMAND as setTokenCommand } from './SetTokenCommand/setDevOpsPATToken'
import { COMMAND as setOrganizationCommand } from './SetOrganizationCommand/setDevOpsOrganization'
import { COMMAND as setTeamCommand } from './SetTeam/setDevopsTeam'
import { logger } from '../logger'

export const COMMAND = 'taskstarter.runInit'
export const runInit = () => {
  const commandHandler = async () => {
    try {
      logger.debug('Running initialization')
      await commands.executeCommand(setTokenCommand)
      await commands.executeCommand(setOrganizationCommand)
      await commands.executeCommand(setTeamCommand)
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
