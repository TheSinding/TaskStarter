import { commands, window } from 'vscode'
import * as config from '../../configuration'
import { logger } from '../../logger'
import { TokenNotProvidedError } from './TokenNotProvidedError'

export const COMMAND = 'taskstarter.setDevOpsPATToken'
export const setDevOpsPATToken = () => {
  const setTokenCommandHandler = async () => {
    logger.debug('Requesting personal access token')
    const prevToken = await config.getSecureKey('devopsPATToken')
    const token = await window.showInputBox({
      title: 'Input your azure personal access token',
      password: true,
      value: prevToken,
    })
    if (!token) {
      throw new TokenNotProvidedError()
    }
    await config.setSecureKey('devopsPATToken', token)
  }
  return commands.registerCommand(COMMAND, setTokenCommandHandler)
}
