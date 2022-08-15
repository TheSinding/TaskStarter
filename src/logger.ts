import pino from 'pino'
import { window } from 'vscode'
import { VSCodeTransport } from './utils/VSCodeTransport'

const channelName = 'TaskStarter'
const outputChannel = window.createOutputChannel(channelName)
const logger = pino({ level: 'debug' }, new VSCodeTransport(outputChannel))

export { logger }
