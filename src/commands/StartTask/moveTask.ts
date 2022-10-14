import { window } from 'vscode'
import * as config from '../../configuration'
import { getTaskColumns, moveTaskToColumn } from './api'
export const moveTask = async (taskId: number) => {
  try {
    let inProgressColumnName = config.getProjectKey('inProgressColumnName')
    if (!inProgressColumnName) {
      const { columns } = await getTaskColumns()
      if (!columns) throw new Error('No Columns')

      const columnsPicks = columns.map((c) => ({ label: c.name as string }))
      const newName = await window.showQuickPick(columnsPicks, {
        title: 'Set in-progress column, to automatically move it',
      })
      if (newName) {
        inProgressColumnName = newName.label
        await config.updateProjectKey('inProgressColumnName', newName.label)
      }
    }
    if (inProgressColumnName) await moveTaskToColumn(taskId, inProgressColumnName)
  } catch (error) {
    window.showWarningMessage("Didn't move task")
  }
}
