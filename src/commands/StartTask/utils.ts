/* eslint-disable @typescript-eslint/naming-convention */
import * as config from '../../configuration'
import { UserInfo, WorkItem, WorkItemType } from '../../@types/azure'
import { sanitize } from '../../utils/sanitizeBranch'
import { ThemeIconName } from '../../@types/VscodeTypes'
import { TaskPick, TaskPickCommands } from './types'
import { ThemeIcon } from 'vscode'

type BranchType = 'feature' | 'bugfix' | 'hotfix'
type BowtieIconName = 'symbol-list' | 'symbol-bug' | 'symbol-task'

type IconName = BowtieIconName | ThemeIconName

export const getWorkItemIcon = (type: WorkItemType) => {
  const icons: Partial<Record<WorkItemType, IconName>> = {
    Bug: 'symbol-bug',
    'Product Backlog Item': 'symbol-list',
    Task: 'symbol-task',
  }
  return type in icons ? `$(${icons[type]})` : ''
}

export const stripIcons = (str: string) => str.replaceAll(/\$\(.+?\)/g, '')

export const nameBranch = (title: string, id: string, parentType: WorkItemType = 'Product Backlog Item') => {
  let label = title

  const customBranchRegex = config.getProjectKey('customBranchRegex')
  if (customBranchRegex) {
    const regex = new RegExp(customBranchRegex, 'g')
    label = label.replaceAll(regex, '')
  }
  label = sanitize(label)

  const branchName = `${getBranchType(parentType)}/${id}-${label}`
  return branchName
}

const branchTypes: Partial<Record<WorkItemType, BranchType>> = {
  'Product Backlog Item': 'feature',
  Bug: 'bugfix',
  Task: 'feature',
  Feature: 'feature',
  Issue: 'feature',
}

const getBranchType = (workItemType: WorkItemType) =>
  workItemType in branchTypes ? branchTypes[workItemType] : branchTypes['Task']

export type ListAllPick = (listAll: boolean, command: TaskPickCommands) => TaskPick
export const getListAllPick: ListAllPick = (listAll: boolean, command: TaskPickCommands): TaskPick => ({
  label: `$(list-flat) Show ${listAll ? 'all tasks' : 'tasks in current iteration'}`,
  alwaysShow: true,
  command,
})

export type Filter = 'Done' | 'Product Backlog Item' | 'Bug'
export type WorkItemFilterFn = (filters: Filter[]) => (value: WorkItem, index: number, array: WorkItem[]) => boolean

/**
 * Remove tasks based on the keywords in the filter param
 * @param {Filter} filter An array list of keywords to filter a task by.
 * @return A filter function to be used in conjunction with the [].filter() function.
 */
export const workItemFilter: WorkItemFilterFn =
  (filter: Filter[] = []) =>
  (task: WorkItem): boolean => {
    if (!task?.id || !task?.fields) return false
    const state = task?.fields?.['System.State']
    const type = task?.fields?.['System.WorkItemType']
    return !filter.includes(state) && !filter.includes(type)
  }

export const taskMapper = (task: WorkItem): TaskPick => {
  const assignedTo: UserInfo = task?.fields?.['System.AssignedTo']
  const remainingWork = task?.fields?.['Microsoft.VSTS.Scheduling.RemainingWork']
  const taskState = task?.fields?.['System.State']

  const assignedToText = `Assigned to: ${assignedTo && assignedTo.displayName ? assignedTo.displayName : 'None'}`
  const taskWeightText = `Task weight: ${remainingWork ? remainingWork : 'None'}`
  const taskStateText = `State: ${taskState ? taskState : 'Unknown'}`
  const buttons = [{ iconPath: new ThemeIcon('open-editors-view-icon'), tooltip: 'View on DevOps' }]

  return {
    label: `${getWorkItemIcon(task.fields?.['System.WorkItemType'])} ${task.fields!['System.Title']}`,
    description: `${task.id}`,
    detail: [assignedToText, taskWeightText, taskStateText].join(' | '),
    taskName: task.fields!['System.Title'],
    buttons,
    workItem: task,
  }
}
