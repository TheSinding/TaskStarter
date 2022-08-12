import { Extension, extensions } from 'vscode'
import { GitExtension, API as BuiltInGitApi } from './@types/git'

export const getBuiltInGitApi = async (): Promise<BuiltInGitApi | undefined> => {
  try {
    const extension = extensions.getExtension('vscode.git') as Extension<GitExtension>
    if (extension !== undefined) {
      const gitExtension = extension.isActive ? extension.exports : await extension.activate()

      return gitExtension.getAPI(1)
    }
  } catch {
    throw new Error('Git extension not found')
  }
}
