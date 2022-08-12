export class NoTeamsFoundError extends Error {
  constructor() {
    super('No teams found')
  }
}
