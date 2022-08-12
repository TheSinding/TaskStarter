import { WebApiTeam } from 'azure-devops-node-api/interfaces/CoreInterfaces'
import { commands, QuickPickItem, window } from 'vscode'
import { listTeams } from '../../api'
import * as config from '../../configuration'
import { logger } from '../../logger'
import { NoTeamsFoundError } from './NoTeamsFoundError'
import { TeamNotProvidedError } from './TeamNotProvidedError'

export const COMMAND = 'taskstarter.setDevOpsTeam'
export const setDevopsTeam = () => {
  const getTeamOptions = (): Promise<QuickPickItem[]> => {
    return new Promise(async (resolve) => {
      const teams = await listTeams()
      if (!teams.length) {
        throw new NoTeamsFoundError()
      }
      if (!teams) {
        resolve([])
      }
      resolve(teams.map(teamMapper))
    })
  }

  const commandHandler = async () => {
    try {
      logger.debug('Setting teams')
      const pickedTeam = await window.showQuickPick(getTeamOptions(), { title: 'Select your DevOps team:' })

      const teams = await listTeams()
      const team = teams.find((t) => t.name === pickedTeam?.label)
      if (!team || !pickedTeam) {
        throw new TeamNotProvidedError()
      }

      await config.updateProjectKey('devopsProject', team?.projectName)
      await config.updateProjectKey('devopsTeam', team?.name)
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }

  return commands.registerCommand(COMMAND, commandHandler)
}
const teamMapper = (team: WebApiTeam): QuickPickItem => {
  return {
    label: team.name || '',
    description: team.description || '',
    detail: `Default project: ${team.projectName}`,
  }
}
