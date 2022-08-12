/* eslint-disable @typescript-eslint/naming-convention */
import { commands, window, env } from 'vscode'
import { logger } from '../logger'
import { getTaskUri } from './utils'

export const COMMAND = 'taskstarter.openOnDevOps'

export const openOnDevOps = () => {
  const commandHandler = async (id: number | string) => {
    try {
      const uri = getTaskUri(id)
      if (!uri) {
        return
      }
      logger.debug('Opening task on devops')
      env.openExternal(uri)
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
