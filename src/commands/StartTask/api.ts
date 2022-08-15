import { Profile } from 'azure-devops-node-api/interfaces/ProfileInterfaces'
import { getApi, getTeamContext } from '../../api'
import { NotFoundError } from '../../Errors/NotFoundError'
import { chunk } from 'lodash'
import { logger } from '../../logger'
import { NoWorkItemsError } from './NoWorkItemsError'
import { fields, WorkItem, WorkItemField } from './types'
import { WorkItemType } from '../../@types/VscodeTypes'
import { WorkItemLink, WorkItemReference } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'

const WORK_ITEM_LIMIT = 200

const defaultFields = `[${fields.join('], [')}]`

export const listTasks = async (parentId?: number): Promise<WorkItem[]> => {
  logger.debug('Fetching tasks')

  let query = ''
  if (parentId) {
    query = `SELECT ${defaultFields} FROM WorkItemLinks
     WHERE ([Source].[System.Id] = ${parentId}) 
     AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') 
     AND ( [Target].[System.WorkItemType] <> '') 
    MODE (Recursive)`
  } else {
    query = `SELECT ${defaultFields} FROM WorkItems 
              WHERE [System.IterationPath] = @CurrentIteration
              AND [System.WorkItemType] IN GROUP 'Microsoft.TaskCategory'`
  }

  return queryTasks(query)
}

export const listParents = async (): Promise<WorkItem[]> => {
  logger.debug('Fetching Parent items')

  const query = `SELECT ${defaultFields} FROM WorkItems
	WHERE [System.IterationPath] = @CurrentIteration
	AND 
  (
      [System.WorkItemType] IN GROUP 'Microsoft.RequirementCategory' OR 
      [System.WorkItemType] IN GROUP 'Microsoft.BugCategory' 
  )`

  return queryTasks(query)
}

const queryTasks = async (query: string): Promise<WorkItem[]> => {
  const relationsReducer = (targets: WorkItemReference[], rel: WorkItemLink) => {
    if (rel.source && rel.target) {
      targets.push(rel.target)
    }
    return targets
  }

  const witApi = await getApi().getWorkItemTrackingApi()

  const { workItems, workItemRelations, columns } = await witApi.queryByWiql({ query }, getTeamContext())

  const items: WorkItemReference[] = [
    workItems?.length ? workItems : [],
    workItemRelations?.length ? workItemRelations.reduce(relationsReducer, []) : [],
  ].flat()

  const chunks = chunk(items, WORK_ITEM_LIMIT)

  let result = (
    await Promise.all(
      chunks.map((c) =>
        witApi.getWorkItemsBatch({
          ids: c?.map((i) => i.id!),
          fields: columns && columns?.length ? columns.map((c) => c.referenceName as string) : undefined,
        })
      )
    )
  ).flat() as WorkItem[]

  if (!result.length) {
    throw new NoWorkItemsError()
  }

  logger.debug(`Found ${result?.length} items`)

  return result
}

export const getTask = async (id: number, fields?: WorkItemField[]): Promise<WorkItem> => {
  const witApi = await getApi().getWorkItemTrackingApi()

  const workItem = (await witApi.getWorkItem(id, fields)) as WorkItem
  if (!workItem) {
    throw new NotFoundError()
  }

  return workItem
}

export const assignTask = async (id: number, profile: Profile & { emailAddress: string; displayName: string }) => {
  const witApi = await getApi().getWorkItemTrackingApi()
  return witApi.updateWorkItem(
    null,
    [
      {
        op: 'add',
        path: '/fields/System.AssignedTo',
        value: {
          id: profile.id,
          uniqueName: profile.emailAddress,
          displayName: profile.displayName,
        },
      },
    ],
    id
  )
}

export const getTaskColumns = async () => {
  const api = await getApi().getWorkApi()
  return api.getColumns(getTeamContext())
}

export const moveTaskToColumn = async (id: number, column: string) => {
  const witApi = await getApi().getWorkItemTrackingApi()
  witApi.updateWorkItem(
    null,
    [
      {
        op: 'add',
        path: '/fields/System.State',
        value: column,
      },
    ],
    id
  )
}

export const getTaskType = async (taskId: number): Promise<WorkItemType> => {
  const query = `SELECT [System.WorkItemType] FROM WorkItems WHERE [System.Id] = ${taskId}`
  const tasks = await queryTasks(query)

  if (!tasks.length) {
    throw new NotFoundError()
  }
  return tasks[0].fields!['System.WorkItemType']
}

export const getParentType = async (taskId: number): Promise<WorkItemType> => {
  // TODO: Look into optimizing this mess
  // First query the parent id of the task - because WIQL is so awesome that means you cant do subqueries (i think)
  const query = `SELECT [System.Parent] FROM WorkItems WHERE [System.Id] = ${taskId}`
  const tasks = await queryTasks(query)
  if (!tasks.length) {
    throw new NotFoundError()
  }

  const parentId = tasks[0].fields!['System.Parent']
  return getTaskType(parentId)
}
