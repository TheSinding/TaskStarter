import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import { window } from 'vscode'
import { WorkItemType } from '../../@types/azure'
import { Repository } from '../../@types/git'
import { getWorkItemStateKey } from '../../CurrentTaskTracker'
import { showProgressNotification } from '../../utils/showProgressNotification'
import { assignTask, getParentType } from './api'
import { nameBranch } from './utils'
import { createNamespaced } from '../../logger'
import * as config from '../../configuration'
import { getProfile } from '../../api'
import { moveTask } from './moveTask'
const logger = createNamespaced('startTask.changeTask')

interface CreateTaskPayload {
  id: string
  title: string
}
export const changeTask = async (payload: CreateTaskPayload, repository: Repository, parentItem?: WorkItem) => {
  let _parentType: WorkItemType | undefined = parentItem?.fields?.['System.WorkItemType']

  if (!_parentType) _parentType = await getParentType(Number(payload.id))

  const branchName = nameBranch(payload.title, payload.id, _parentType)

  const confirmedBranchName = await window.showInputBox({
    placeHolder: branchName,
    title: 'New branch name',
    value: branchName,
  })

  try {
    if (!confirmedBranchName) throw new Error('Canceled changing task')

    const notificationTitle = `Starting task: "${payload.title}"`
    await showProgressNotification(notificationTitle, repository.createBranch(confirmedBranchName, true))

    // Set the work id in .git/config under newly created branch
    const configKey = getWorkItemStateKey(confirmedBranchName)
    repository.setConfig(configKey, payload.id)

    logger.debug(`Task started successfully`)
    window.showInformationMessage(`Started task: "${payload.title!}"`)

    // Try and fetch the current users profile to assign the task
    if (config.getProjectKey('autoAssignTask', true)) {
      getProfile()
        .then((me) => assignTask(Number(payload.id), me))
        .catch((e) => {
          logger.error(e)
          window.showErrorMessage('Failed to assign task to you.')
        })
    }

    if (config.getProjectKey('autoMoveTaskToInProgress', true)) moveTask(Number(payload.id))
  } catch (error: any) {
    logger.error(error)
    if (error.stderr) {
      const message = error.stderr.replace('fatal:', '').trim()
      window.showErrorMessage(message)
    } else {
      window.showErrorMessage(error.message)
    }
  }
}
