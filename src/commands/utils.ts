import { Uri } from 'vscode'
import * as config from '../configuration'

export const getTaskUri = (id: string | number): Uri | undefined => {
  const organization = config.getProjectKey('devopsOrganization')
  const project = config.getProjectKey('devopsProject')

  if (!organization || !project) {
    return
  }

  return Uri.parse(`https://${organization}.visualstudio.com/${project}/_workitems/edit/${id}/`)
}
