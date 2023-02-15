import { getApi, getTeamContext } from '../../api'
import { NotFoundError } from '../../Errors/NotFoundError'
import { chunk } from 'lodash'
import { createNamespaced } from '../../logger'
import { NoWorkItemsError } from './NoWorkItemsError'
import { WorkItemLink, WorkItemReference } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import { fields, FullProfile, WorkItem, WorkItemField, WorkItemType } from '../../@types/azure'

const logger = createNamespaced('StartTask.API')

const WORK_ITEM_REQUEST_LIMIT = 200
const MAX_WORK_ITEMS_FETCH = 1000

const defaultFields = `[${fields.join('], [')}]`

export const searchTasks = async (term: string): Promise<WorkItem[]> => {
  const query = `SELECT ${defaultFields} FROM WorkItem
     WHERE   
      (
        [System.WorkItemType] IN GROUP 'Microsoft.RequirementCategory' OR 
        [System.WorkItemType] IN GROUP 'Microsoft.BugCategory' 
      )
      AND [System.TeamProject] = @project
      AND (
        [System.Title] contains '${term}'
        OR 
        [System.AssignedTo] contains '${term}'
      )
      AND
      [System.State] <> 'Done'
      ORDER BY [System.CreatedDate] DESC`

  return queryTasks(query)
}

export const listTasks = async (currentIteration: boolean, parentId?: number): Promise<WorkItem[]> => {
  logger.debug('Fetching tasks')

  let query = ''
  if (parentId) {
    query = `SELECT ${defaultFields} FROM WorkItemLinks
     WHERE ([Source].[System.Id] = ${parentId}) 
     AND ([Source].[System.TeamProject] = @project)
     AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') 
     AND ( [Target].[System.WorkItemType] <> '') 
    MODE (Recursive)`
  } else {
    query = `SELECT * FROM WorkItems 
              WHERE ${currentIteration ? '[System.IterationPath] = @CurrentIteration AND ' : ''}
              [System.WorkItemType] IN GROUP 'Microsoft.TaskCategory'
              AND [System.TeamProject] = @project
              ORDER BY [System.CreatedDate] DESC
              ${!currentIteration ? `ASOF @StartOfYear` : ''}
              `
  }

  return queryTasks(query)
}

export const listParents = async (currentIteration: boolean): Promise<WorkItem[]> => {
  logger.debug('Fetching Parent items')

  const query = `SELECT ${defaultFields} FROM WorkItems
	WHERE ${currentIteration ? '[System.IterationPath] = @CurrentIteration AND ' : ''}
  (
      [System.WorkItemType] IN GROUP 'Microsoft.RequirementCategory' OR 
      [System.WorkItemType] IN GROUP 'Microsoft.BugCategory' 
  )`

  return queryTasks(query)
}

const queryTasks = async (query: string): Promise<WorkItem[]> => {
  logger.debug(`Executing following WIQL\n${query}`)
  const relationsReducer = (targets: WorkItemReference[], rel: WorkItemLink) => {
    if (rel.source && rel.target) {
      targets.push(rel.target)
    }
    return targets
  }

  const witApi = await getApi().getWorkItemTrackingApi()

  const { workItems, workItemRelations, columns } = await witApi.queryByWiql({ query }, getTeamContext())
  logger.debug(`Got ${workItems?.length} workItems and ${workItemRelations?.length} rels`)

  const items: WorkItemReference[] = [
    workItems?.length ? workItems : [],
    workItemRelations?.length ? workItemRelations.reduce(relationsReducer, []) : [],
  ].flat()

  if (items.length > MAX_WORK_ITEMS_FETCH) {
    logger.info(
      `Found more than ${MAX_WORK_ITEMS_FETCH} work items in query. Showing amount to ${MAX_WORK_ITEMS_FETCH}`
    )
  }

  const chunks = chunk(items.slice(0, MAX_WORK_ITEMS_FETCH), WORK_ITEM_REQUEST_LIMIT)

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

export const assignTask = async (id: number, profile: FullProfile) => {
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
  // const boardId = getProjectKey('defaultProjectBoardId')
  // if (!boardId) {
  //   throw new Error('No default board')
  // }

  // //TODO: Figure out how to get the default board ?
  // console.log(getTeamContext())
  // const b = await api.getBoards(getTeamContext())
  // console.log(b)
  // const a = await api.getBoardColumns(getTeamContext(), boardId)
  // console.log(a)

  return api.getColumns(getTeamContext())
}
// getTaskColumns().then((a) => console.log(a))

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
