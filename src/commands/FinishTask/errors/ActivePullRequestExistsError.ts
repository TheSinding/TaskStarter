export class ActivePullRequestExistsError extends Error {
  constructor() {
    super('An active pull request already exist for this task')
  }
}
