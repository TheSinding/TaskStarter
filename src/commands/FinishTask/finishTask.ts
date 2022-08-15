/* eslint-disable @typescript-eslint/naming-convention */
import { GitRepository } from 'azure-devops-node-api/interfaces/TfvcInterfaces'
import { commands, QuickPickItem, window, env, Uri } from 'vscode'
import { logger } from '../../logger'
import { createPullRequest, getBranches, getRepositories } from './api'
import * as config from '../../configuration'
import { GitBranchStats } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { getBuiltInGitApi } from '../../git'
import { CurrentTaskTracker } from '../../CurrentTaskTracker'
import { Repository } from '../../@types/git'

type BranchPick = QuickPickItem & { branch: GitBranchStats; isDefault: boolean }

export const COMMAND = 'taskstarter.finishTask'
export const finishTask = () => {
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

  const remoteRepositoryMatcher = (localRepository: Repository) => (remoteRepository: GitRepository) => {
    // This probably have a high probability of not working ¯\_(ツ)_/¯
    const { remotes } = localRepository.state
    const { sshUrl, remoteUrl } = remoteRepository
    const match = remotes.some(
      (remoteRef) =>
        remoteRef.pushUrl === sshUrl ||
        remoteRef.pushUrl === remoteUrl ||
        remoteRef.fetchUrl === sshUrl ||
        remoteRef.fetchUrl === remoteUrl
    )
    return match
  }

  const commandHandler = async () => {
    try {
      const organization = config.getProjectKey('devopsOrganization')
      const project = config.getProjectKey('devopsProject')
      const currentTask = CurrentTaskTracker.instance.currentTask
      const gitAPI = await getBuiltInGitApi()

      const localRepository = gitAPI?.repositories[0]
      if (!localRepository || !currentTask) {
        return
      }
      if (!project) {
        throw new Error('Missing configuration key "project"')
      }
      const remoteRepositories = await getRepositories(project)
      if (!remoteRepositories.length) {
        throw new Error('No remote repositories found')
      }

      const remoteRepository = remoteRepositories.find(remoteRepositoryMatcher(localRepository))
      if (!remoteRepository) {
        throw new Error('No matching remote repository found')
      }

      const targetBranchPick = await window.showQuickPick<BranchPick>(fetchBranches(remoteRepository), {
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

      if (!localRepository.state.HEAD || !CurrentTaskTracker.instance.currentTask) {
        // TODO: Do some better error handling
        return
      }

      logger.debug(`Creating pull request for repository ${remoteRepository.name}`)

      const pullRequest = await createPullRequest(
        currentTask.id as number,
        pullRequestTitle,
        remoteRepository,
        localRepository.state.HEAD.name as string,
        targetBranchPick.branch.name as string
      )

      const repositoryName = pullRequest.repository?.name
      const id = pullRequest.pullRequestId

      window
        .showInformationMessage(
          `Created a pull request for task "${currentTask.fields?.['System.Title']}"`,
          OPEN_PULL_REQUEST_ITEM
        )
        .then((selection) => {
          if (selection && selection === 'Open pull request') {
            openPullRequest(organization as string, project, repositoryName as string, id as number)
          }
        })
    } catch (error: any) {
      logger.error(error)
      window.showErrorMessage(error.message)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}

const OPEN_PULL_REQUEST_ITEM = 'Open pull request'
const openPullRequest = (organization: string, project: string, repositoryName: string, id: number) => {
  env.openExternal(
    Uri.parse(`https://dev.azure.com/${organization}/${project}/_git/${repositoryName}/pullrequest/${id}`)
  )
}
