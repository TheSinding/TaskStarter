import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'

import { WorkItem as FullWorkItem } from '../../@types/azure'
import { getApi } from '../../api'
import { FullProfile } from '../../@types/azure'

interface NewTask {
  remainingWork?: string
  parent: FullWorkItem
  title: string
}

const WORK_ITEM_TYPE = 'Task'

export const createNewTask = async (
  { title, remainingWork, parent }: NewTask,
  project: string,
  profile: FullProfile
): Promise<WorkItem> => {
  const witApi = await getApi().getWorkItemTrackingApi()
  const operations = [
    { op: 'add', path: '/fields/System.Title', from: null, value: title },
    {
      op: 'add',
      path: '/fields/System.AreaPath',
      from: null,
      value: parent.fields?.['System.AreaPath'],
    },
    {
      op: 'add',
      path: '/fields/System.IterationPath',
      from: null,
      value: parent.fields?.['System.IterationPath'],
    },
    {
      op: 'add',
      path: '/fields/System.AssignedTo',
      from: null,
      value: {
        id: profile.id,
        uniqueName: profile.emailAddress,
        displayName: profile.displayName,
      },
    },
    {
      op: 'add',
      path: '/relations/-',
      value: {
        rel: 'System.LinkTypes.Hierarchy-Reverse',
        url: parent.url,
      },
    },
  ]

  if (remainingWork) {
    operations.push({
      op: 'add',
      from: null,
      path: '/fields/Microsoft.VSTS.Scheduling.RemainingWork',
      value: remainingWork.toString(),
    })
  }

  return witApi.createWorkItem(null, operations, project, WORK_ITEM_TYPE)
}
