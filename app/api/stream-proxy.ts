import type http from 'node:http'
import { handleStreamProxy } from '../server/streamProxy.js'

export default function handler(req: http.IncomingMessage & { query?: Record<string, string | string[] | undefined> }, res: http.ServerResponse) {
  handleStreamProxy(req, res)
}
