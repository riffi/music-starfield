import type http from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleStreamProxy } from './server/streamProxy.js'

function streamProxyPlugin() {
  return {
    name: 'stream-proxy',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: http.IncomingMessage, res: http.ServerResponse) => void) => void } }) {
      server.middlewares.use('/api/stream-proxy', handleStreamProxy)
    },
  }
}

export default defineConfig({
  plugins: [react(), streamProxyPlugin()],
})
