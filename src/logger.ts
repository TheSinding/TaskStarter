import pino from 'pino'
// import { window } from 'vscode'
// const channelName = 'taskstarter'
// const outputChannel = window.createOutputChannel(channelName)
const logger = pino({ level: 'debug' })

export { logger }
