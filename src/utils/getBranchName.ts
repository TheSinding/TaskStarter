import { RefType, Repository } from '../@types/git'

export const getBranchName = (repository: Repository) => {
  const HEAD = repository.state.HEAD

  if (!HEAD) {
    return ''
  }

  const tag = repository.state.refs.filter((iref) => iref.type === RefType.Tag && iref.commit === HEAD.commit)[0]
  const tagName = tag && tag.name
  const head = HEAD.name || tagName || (HEAD.commit || '').slice(0, 8)

  return head
}
