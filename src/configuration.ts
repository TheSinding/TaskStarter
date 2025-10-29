/* eslint-disable @typescript-eslint/naming-convention */
import { workspace, ConfigurationTarget, WorkspaceConfiguration, SecretStorage, ExtensionContext } from 'vscode'

export type ConfigurationKey = `${ConfigurationKeys}`

export const SECTION = 'taskstarter'
export enum ConfigurationKeys {
  PROJECT_CONFIGS = 'projectConfigs',
  HIDE_INIT_PROMPT = 'hideInitPrompt',
}

interface ProjectConfig {
  projectName?: string
  devopsOrganization?: string
  devopsTeam?: string
  devopsProject?: string
  customBranchRegex?: string
  autoMoveTaskToInProgress?: boolean
  autoAssignTask?: boolean
  inProgressColumnName?: string
  defaultProjectBoardId?: string
  devopsInstanceURL?: string
}

let secretStore: SecretStorage | null = null

export const setSecretStore = (context: ExtensionContext) => {
  secretStore = context.secrets
}

const getProjectName = () => {
  if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
    const { name } = workspace.workspaceFolders[0]
    return name
  }
  return
}

type UpdateConfigurationKey = (
  section: ConfigurationKey,
  value: any,
  configurationTarget?: boolean | ConfigurationTarget | null | undefined,
  overrideInLanguage?: boolean | undefined
) => Thenable<void>

export const get = <T>(section: ConfigurationKey, defaultValue?: T): T =>
  workspace.getConfiguration(SECTION).get<T>(section, defaultValue!)
export const update: UpdateConfigurationKey = (
  section: ConfigurationKey,
  value: any,
  configurationTarget?,
  overrideInLanguage?
) => workspace.getConfiguration(SECTION).update(section, value, configurationTarget, overrideInLanguage)
export const has: (section: ConfigurationKey) => boolean = (section: ConfigurationKey): boolean =>
  workspace.getConfiguration(SECTION).has(section)
export const inspect: WorkspaceConfiguration['inspect'] = (section: ConfigurationKey) =>
  workspace.getConfiguration(SECTION).inspect(section)

const getProjectObject = (projectName: string) => {
  const projectConfigs = get<ProjectConfig[]>('projectConfigs')
  const projectConfig = projectConfigs.find((p) => p.projectName === projectName)

  if (!projectConfig) {
    return {} as ProjectConfig
  }
  return projectConfig
}

export const updateProjectKey = <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) => {
  const projectName = getProjectName()
  if (!projectName) {
    throw new Error('No project found')
  }
  const configs = get<ProjectConfig[]>('projectConfigs')
  const current = configs.find((p) => p.projectName === projectName) || { projectName }
  return update(
    'projectConfigs',
    [...configs.filter((p) => p.projectName !== projectName), { ...current, [key]: value }],
    true
  )
}

export const getProjectKey = <K extends keyof ProjectConfig>(
  section: K,
  defaultValue?: Required<ProjectConfig>[K]
): ProjectConfig[K] => {
  const projectName = getProjectName()
  if (!projectName) {
    throw new Error('No project found')
  }
  const projectConfig = getProjectObject(projectName!)

  if ((!projectConfig || !projectConfig[section]) && defaultValue) {
    return defaultValue as Required<ProjectConfig>[K]
  }
  return projectConfig[section]
}

interface SecureProjectKeys {
  devopsPATToken?: string
}
export const getSecureKey = async <K extends keyof SecureProjectKeys>(key: K): Promise<SecureProjectKeys[K]> => {
  if (!secretStore) {
    throw new Error('Secrets store must be initialized')
  }
  const projectName = getProjectName()
  if (!projectName) {
    throw new Error('No project found')
  }
  try {
    const a = await secretStore.get(`${projectName}.${key}`)
    console.log(a)
  } catch (error) {
    console.log('what the fuck')
  }

  return secretStore.get(`${projectName}.${key}`)
}

export const setSecureKey = <K extends keyof SecureProjectKeys>(key: K, value: string): Thenable<void> => {
  if (!secretStore) {
    throw new Error('Secrets store must be initialized')
  }
  const projectName = getProjectName()
  if (!projectName) {
    throw new Error('No project found')
  }
  return secretStore.store(`${projectName}.${key}`, value)
}
