import { BoardReference } from 'azure-devops-node-api/interfaces/WorkInterfaces'
import { QuickPickItem } from 'vscode'

export interface BoardPickItem extends QuickPickItem {
  ref: BoardReference
}
