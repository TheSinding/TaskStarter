/* eslint-disable @typescript-eslint/naming-convention */
import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api'
import { TeamContext, TeamProjectReference, WebApiTeam } from 'azure-devops-node-api/interfaces/CoreInterfaces'
import * as config from './configuration'
import { logger } from './logger'
import moize from 'moize'
import { Profile } from 'azure-devops-node-api/interfaces/ProfileInterfaces'

const DEFAULT_INSTANCE_URL = 'https://dev.azure.com'
const VSSPS_INSTANCE = 'https://vssps.dev.azure.com'

export const getTeamContext = (): TeamContext => ({
  team: config.getProjectKey('devopsTeam'),
  project: config.getProjectKey('devopsProject'),
})
export const getApi = (instance: string = DEFAULT_INSTANCE_URL): WebApi => {
  if (!config.getProjectKey('devopsPATToken')) {
    throw new Error('DevOps PAT Token not set')
  }
  const token = config.getProjectKey('devopsPATToken') as string
  const customInstance = config.getProjectKey('devopsInstanceURL') as string
  const organization = config.getProjectKey('devopsOrganization')
  const authHandler = getPersonalAccessTokenHandler(token)
  logger.debug({ token, instance, organization })
  return new WebApi(
    `${customInstance ? (instance !== DEFAULT_INSTANCE_URL ? instance : customInstance) : instance}/${organization}`,
    authHandler
  )
}

async function _profile(id: string = 'me') {
  return (await getApi(VSSPS_INSTANCE).getProfileApi()).getProfile(id) as Promise<
    Profile & { displayName: string; emailAddress: string }
  >
}
export const getProfile = moize(_profile)

export const listProjects = async (): Promise<TeamProjectReference[]> => {
  try {
    logger.debug('Fetching projects')
    const coreApi = await getApi().getCoreApi()
    const projects = await coreApi.getProjects()
    return projects
  } catch (error) {
    logger.error(error, 'Error fetching projects')
    throw error
  }
}

export const listTeams = async (): Promise<WebApiTeam[]> => {
  try {
    logger.debug('Fetching teams')
    const coreApi = await getApi().getCoreApi()
    const teams = await coreApi.getAllTeams()
    return teams
  } catch (error) {
    logger.error(error, 'Error listing teams')
    throw error
  }
}
