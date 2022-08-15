import { GitPullRequest } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { GitRepository } from 'azure-devops-node-api/interfaces/TfvcInterfaces'
import { getApi } from '../../api'
import * as config from '../../configuration'

export const createPullRequest = async (
  taskId: number,
  title: string,
  repository: GitRepository,
  source: string,
  target: string
): Promise<GitPullRequest> => {
  const devopsGitApi = await getApi().getGitApi()
  const project = config.getProjectKey('devopsProject')

  const pullRequest: GitPullRequest = {
    title,
    isDraft: true,
    repository,
    targetRefName: `refs/heads/${target}`,
    sourceRefName: `refs/heads/${source}`,
    workItemRefs: [
      {
        id: String(taskId),
      },
    ],
  }

  const response = await devopsGitApi.createPullRequest(pullRequest, repository.id as string, project)

  return response
}

export const getBranches = async (repository: Required<GitRepository>) => {
  const devopsGitApi = await getApi().getGitApi()
  return devopsGitApi.getBranches(repository.id)
}

export const getRepositories = async (devopsProject: string): Promise<GitRepository[]> => {
  const devopsGitApi = await getApi().getGitApi()
  return devopsGitApi.getRepositories(devopsProject)
}
