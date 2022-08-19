import { Extension, extensions } from 'vscode'
import { GitExtension, API as BuiltInGitApi, IExecutionResult } from './@types/git'

const getConfigKey =
  (api: BuiltInGitApi) =>
  (cwd: string, key: string): Promise<IExecutionResult<string>> => {
    return api._model.git.exec(cwd, ['config', '--get', key])
  }

export interface CustomGitAPI extends BuiltInGitApi {
  getConfigKey(cwd: string, key: string): Promise<IExecutionResult<string>>
}

export const getBuiltInGitApi = async (): Promise<CustomGitAPI | undefined> => {
  try {
    const extension = extensions.getExtension('vscode.git') as Extension<GitExtension>
    if (extension !== undefined) {
      const gitExtension = extension.isActive ? extension.exports : await extension.activate()
      const api = gitExtension.getAPI(1)

      return Object.assign(api, { getConfigKey: getConfigKey(api) })
    }
  } catch {
    throw new Error('Git extension not found')
  }
}
