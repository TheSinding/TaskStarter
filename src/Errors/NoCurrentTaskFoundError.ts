export class NoCurrentTaskFoundError extends Error {
  constructor() {
    super('No current task found')
  }
}
