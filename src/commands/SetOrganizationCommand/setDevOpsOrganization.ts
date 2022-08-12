import { commands, window } from 'vscode'
import * as config from '../../configuration'
import { logger } from '../../logger'
import { OrganizationNotProvidedError } from './OrganizationNotProvidedError'

export const COMMAND = 'taskstarter.setDevOpsOrganization'
export const setDevOpsOrganization = () => {
  const commandHandler = async () => {
    logger.debug('Requesting organization')
    const prevOrganization = config.getProjectKey('devopsOrganization', '')
    const organization = await window.showInputBox({ title: 'Input your DevOps organization', value: prevOrganization })
    if (!organization) {
      throw new OrganizationNotProvidedError()
    }

    await config.updateProjectKey('devopsOrganization', organization)
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
