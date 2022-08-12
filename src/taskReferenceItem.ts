import { StatusBarAlignment, StatusBarItem, window } from 'vscode'
import { getBuiltInGitApi } from './git'

export const init = (): StatusBarItem => {
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
  statusBarItem.text = '$(symbol-task) Hello World'
  statusBarItem.command = 'taskstarter.runInit'
  statusBarItem.tooltip = 'Open task on Azure DevOps'

  const setup = async (item: StatusBarItem) => {
    console.log(item)

    const gitExt = await getBuiltInGitApi()

    const repository = gitExt?.repositories[0]
    console.log(repository?.getBranches({}))
    gitExt?.onDidOpenRepository(branchChanged)
    console.log(repository?.state, repository?.rootUri)
    gitExt?.onDidChangeState(branchChanged)
    console.log('state now', gitExt?.state)
  }

  const branchChanged = (e: any) => {
    console.log('state change event', e)
  }

  setup(statusBarItem)

  return statusBarItem
}
