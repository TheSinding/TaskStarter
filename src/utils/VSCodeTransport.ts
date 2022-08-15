const prettyFactory: PrettyFactory = require('pino-pretty').prettyFactory
import { PrettyOptions } from 'pino-pretty'
import { Writable } from 'stream'
import { OutputChannel } from 'vscode'

type PrettyFactory = (opt?: PrettyOptions) => PinoPrettifierFn
type PinoPrettifierFn = (inputData: string) => string
interface VSCodeTransportOptions {
  pinoPretty?: {
    customOptions?: PrettyOptions
  }
}

export class VSCodeTransport extends Writable {
  private _prettifier: PinoPrettifierFn
  constructor(readonly outputChannel: OutputChannel, opt?: VSCodeTransportOptions) {
    super()
    this._prettifier = prettyFactory(opt?.pinoPretty?.customOptions)
  }
  _write(chunk: any, _encoding: BufferEncoding, next: (error?: Error | null | undefined) => void): void {
    this.outputChannel.append(this._prettifier(chunk.toString()))
    next()
  }
}
