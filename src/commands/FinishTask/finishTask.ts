/* eslint-disable @typescript-eslint/naming-convention */
import { GitRepository } from 'azure-devops-node-api/interfaces/TfvcInterfaces'
import { commands, QuickPickItem, window, env, Uri } from 'vscode'
import { logger } from '../../logger'
import { createPullRequest, getBranches, getRepositories } from './api'
import * as config from '../../configuration'
import { GitBranchStats } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { getBuiltInGitApi } from '../../git'
import { CurrentTaskTracker } from '../../CurrentTaskTracker'

export const COMMAND = 'taskstarter.finishTask'

type RepositoryPick = QuickPickItem & { repository: GitRepository }
type BranchPick = QuickPickItem & { branch: GitBranchStats; isDefault: boolean }

export const finishTask = () => {
  const fetchRepositories = async (): Promise<RepositoryPick[]> => {
    const project = config.getProjectKey('devopsProject')
    if (!project) {
      throw new Error('Missing configuration key "project"')
    }
    const repositories = await getRepositories(project)
    return repositories.map((r) => ({
      label: r.name || '',
      repository: r,
    }))
  }

  const fetchBranches = async (repository: GitRepository): Promise<any> => {
    const branches = await getBranches(repository as Required<GitRepository>)
    const { defaultBranch } = repository
    return branches
      .map((b): BranchPick => {
        const isDefaultBranch = defaultBranch ? defaultBranch.includes(b.name as string) : false
        return {
          label: b.name as string,
          description: isDefaultBranch ? '(default)' : '',
          alwaysShow: isDefaultBranch,
          isDefault: isDefaultBranch,
          branch: b,
        }
      })
      .sort((a, b) => (a.isDefault > b.isDefault ? -1 : 1))
  }

  const commandHandler = async () => {
    try {
      const currentTask = CurrentTaskTracker.instance.currentTask
      const gitAPI = await getBuiltInGitApi()

      const repository = gitAPI?.repositories[0]
      if (!repository || !currentTask) {
        return
      }

      const title = 'Pick the repository'
      const placeHolder = 'Search for the repository you want to add a PR to'
      const repositoryPick = await window.showQuickPick<RepositoryPick>(fetchRepositories(), { title, placeHolder })

      if (!repositoryPick) {
        return
      }
      const targetBranchPick = await window.showQuickPick<BranchPick>(fetchBranches(repositoryPick?.repository), {
        title: 'Select a target branch',
        placeHolder: 'Search for a target branch',
      })

      const pullRequestTitle = await window.showInputBox({
        title: 'Add a title to your pull request',
        value: currentTask.fields?.['System.Title'],
      })

      if (!targetBranchPick || !pullRequestTitle) {
        return
      }

      logger.debug('Finish task', repositoryPick?.repository.name)
      if (!repository.state.HEAD || !CurrentTaskTracker.instance.currentTask) {
        // TODO: Do some better error handling
        return
      }

      const pr = await createPullRequest(
        currentTask.id as number,
        pullRequestTitle,
        repositoryPick.repository,
        repository.state.HEAD.name as string,
        targetBranchPick.branch.name as string
      )
      const organization = config.getProjectKey('devopsOrganization')
      const project = config.getProjectKey('devopsProject')
      const repositoryName = pr.repository?.name
      const id = pr.pullRequestId

      env.openExternal(
        Uri.parse(`https://dev.azure.com/${organization}/${project}/_git/${repositoryName}/pullrequest/${id}`)
      )
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
