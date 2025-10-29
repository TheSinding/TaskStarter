import { BoardReference } from 'azure-devops-node-api/interfaces/WorkInterfaces'
import { commands, window } from 'vscode'
import * as config from '../../configuration'
import * as api from './api'
import { logger } from '../../logger'
import { BoardPickItem } from './types'

export const COMMAND = 'taskstarter.moveTaskToInProgress'

export const moveTaskToInProgress = () => {
  const boardsMapper = (board: BoardReference): BoardPickItem => ({ label: board.name as string, ref: board })
  const fetchBoards = async (): Promise<BoardPickItem[]> => {
    const boardRefs = await api.getBoards()
    return boardRefs.map(boardsMapper)
  }
  const commandHandler = async () => {
    logger.debug('Requesting organization')
    const boardId = config.getProjectKey('defaultProjectBoardId')
    if (!boardId) {
      const boardPick = await window.showQuickPick(fetchBoards())
      console.log(boardPick)
      if (!boardPick) throw new Error('Abort')
      config.updateProjectKey('defaultProjectBoardId', boardPick.ref.id)
    }
  }
  return commands.registerCommand(COMMAND, commandHandler)
}
