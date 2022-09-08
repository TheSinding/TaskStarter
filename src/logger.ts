import pino from 'pino'
import { window } from 'vscode'
import { VSCodeTransport } from './utils/VSCodeTransport'

const channelName = 'TaskStarter'
const outputChannel = window.createOutputChannel(channelName)

const logger = pino({ level: 'debug' }, new VSCodeTransport(outputChannel))

const namespacedLogger = pino({ level: 'debug' }, new VSCodeTransport(outputChannel, {
	pinoPretty: {
		customOptions:
		{
			messageFormat: "[{namespace}] - {msg}",
			ignore: "pid,hostname,namespace",
		}
	}
}))

const createNamespaced = (namespace: string) => namespacedLogger.child({ namespace })


export { createNamespaced, logger }
