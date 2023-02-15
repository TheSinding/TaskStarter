import { Extension, extensions } from 'vscode'
import { GitExtension, API } from './@types/git'

export const getBuiltInGitApi = async (): Promise<API | undefined> => {
  try {
    const extension = extensions.getExtension('vscode.git') as Extension<GitExtension>

    if (extension !== undefined) {
      const gitExtension = extension.isActive ? extension.exports : await extension.activate()
      const api = gitExtension.getAPI(1)
      return api
    }
  } catch {
    throw new Error('Git extension not found')
  }
}
