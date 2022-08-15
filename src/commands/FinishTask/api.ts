import { GitPullRequest } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { GitRepository } from 'azure-devops-node-api/interfaces/TfvcInterfaces'
import { getApi } from '../../api'
import * as config from '../../configuration'
import { logger } from '../../logger'
import { ActivePullRequestExistsError } from './errors/ActivePullRequestExistsError'

export const createPullRequest = async (
  taskId: number,
  title: string,
  repository: GitRepository,
  source: string,
  target: string
): Promise<GitPullRequest> => {
  try {
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
  } catch (error) {
    logger.error(error)
    if (error instanceof Error && error.message.includes('active pull request')) {
      throw new ActivePullRequestExistsError()
    }
    throw new Error('An error occurred creating pull request')
  }
}

export const getBranches = async (repository: Required<GitRepository>) => {
  const devopsGitApi = await getApi().getGitApi()
  return devopsGitApi.getBranches(repository.id)
}

export const getRepositories = async (devopsProject: string): Promise<GitRepository[]> => {
  const devopsGitApi = await getApi().getGitApi()
  return devopsGitApi.getRepositories(devopsProject)
}
