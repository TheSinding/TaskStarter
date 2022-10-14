import { commands, env, InputBoxValidationMessage, Uri, window } from 'vscode'
import { createNamespaced } from '../../logger'
import { createNewTask } from './api'
import * as configuration from '../../configuration'
import { getProfile } from '../../api'
import { WorkItem } from '../../@types/azure'
import { changeTask } from '../StartTask/changeTask'
import { getBuiltInGitApi } from '../../git'
import { showProgressNotification } from '../../utils/showProgressNotification'

export const COMMAND = 'taskstarter.addNewTask'
const logger = createNamespaced(COMMAND)

type ValidationResult =
  | string
  | InputBoxValidationMessage
  | Thenable<string | InputBoxValidationMessage | null | undefined>
  | null
  | undefined

const remainingWorkValidator = (value: string): ValidationResult => {
  if (isNaN(+value)) return { message: 'Weight has to be a number', severity: 3 }
  if (+value < 0) return { message: 'Weight cannot be a negative number', severity: 3 }
  if (+value % 1 !== 0) return { message: 'Weight has to be a whole number', severity: 3 }
  return
}

const OPEN_TASK_ITEM = 'Open task'
const openTask = (id: number) => {
  const team = configuration.getProjectKey('devopsTeam')
  const project = configuration.getProjectKey('devopsProject')
  const organization = configuration.getProjectKey('devopsOrganization')

  env.openExternal(
    Uri.parse(
      `https://dev.azure.com/${organization}/${project}//_backlogs/backlog/${team}/Backlog items/?workitem=${id}`
    )
  )
}

export const addNewTask = () => {
  const commandHandler = async (parentItem: WorkItem) => {
    try {
      logger.debug('Adding a new task')
      const gitApi = await getBuiltInGitApi()
      if (!gitApi) throw new Error('Could not find git API')

      const repository = gitApi.repositories[0]

      const title = await window.showInputBox({
        title: 'Add a title',
        placeHolder: '[Scope] Example title',
        ignoreFocusOut: true,
      })
      if (!title) return

      const remainingWork = await window.showInputBox({
        title: 'Optional: Specify weight',
        placeHolder: '420',
        validateInput: remainingWorkValidator,
        ignoreFocusOut: true,
      })

      const project = configuration.getProjectKey('devopsProject')
      const profile = await getProfile()

      const createdTask = await showProgressNotification(
        'Creating new task, please wait...',
        createNewTask({ title, remainingWork, parent: parentItem }, project as string, profile)
      )

      window.showInformationMessage(`Task created`, OPEN_TASK_ITEM).then((value) => {
        if (value === 'Open task') return openTask(createdTask.id as number)
      })

      const payload = {
        id: createdTask.id?.toString() as string,
        title: createdTask.fields?.['System.Title'] as string,
      }

      changeTask(payload, repository, parentItem)
    } catch (error) {
      logger.error(error)
      window.showErrorMessage('An error occurred creating the task')
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
