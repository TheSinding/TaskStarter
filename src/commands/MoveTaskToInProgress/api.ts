import { getApi, getTeamContext } from '../../api'

export const getBoards = async () => {
  const api = await (await getApi()).getWorkApi()
  return api.getBoards(getTeamContext())
}

export const getBoardColumns = async (boardId: string) => {
  const wApi = await (await getApi()).getWorkApi()
  return wApi.getBoardColumns(getTeamContext(), boardId)
}

export const getTaskBoardColumns = async () => {
  const wApi = await (await getApi()).getWorkApi()
  return wApi.getColumns(getTeamContext())
}
