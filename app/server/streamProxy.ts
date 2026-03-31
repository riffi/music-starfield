import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

const ALLOWED_STREAM_HOSTS = new Set(['radio.hearme.fm', 'station-sound.ru', '5.restream.one', 'icecast.pulsradio.com', 'listen1.myradio24.com'])

type MiddlewareLikeRequest = http.IncomingMessage & { query?: Record<string, string | string[] | undefined> }

function getTargetUrl(req: MiddlewareLikeRequest) {
  const queryUrl = req.query?.url
  if (typeof queryUrl === 'string') return queryUrl
  if (Array.isArray(queryUrl)) return queryUrl[0]

  const requestUrl = new URL(req.url ?? '', 'http://localhost')
  return requestUrl.searchParams.get('url')
}

export function handleStreamProxy(req: MiddlewareLikeRequest, res: http.ServerResponse) {
  const targetUrl = getTargetUrl(req)
  const origin = req.headers.origin ?? '*'

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Missing "url" query parameter.')
    return
  }

  let upstreamUrl: URL
  try {
    upstreamUrl = new URL(targetUrl)
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Invalid upstream URL.')
    return
  }

  if (!['http:', 'https:'].includes(upstreamUrl.protocol)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Unsupported upstream protocol.')
    return
  }

  if (!ALLOWED_STREAM_HOSTS.has(upstreamUrl.hostname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Upstream host is not allowed.')
    return
  }

  const client = upstreamUrl.protocol === 'https:' ? https : http
  const headers: http.OutgoingHttpHeaders = {
    'user-agent': req.headers['user-agent'] ?? 'music-galaxy-stream-proxy',
    accept: req.headers.accept ?? '*/*',
  }

  if (req.headers.range) headers.range = req.headers.range

  const upstream = client.request(
    upstreamUrl,
    {
      method: 'GET',
      headers,
    },
    (upstreamRes) => {
      const responseHeaders = { ...upstreamRes.headers }
      delete responseHeaders['access-control-allow-origin']
      delete responseHeaders['access-control-allow-credentials']
      delete responseHeaders['content-security-policy']

      res.writeHead(upstreamRes.statusCode ?? 502, {
        ...responseHeaders,
        'access-control-allow-origin': origin,
        'access-control-expose-headers': 'content-type, icy-name, icy-genre, icy-description, icy-url',
        'cache-control': 'no-store',
      })

      upstreamRes.pipe(res)
    },
  )

  upstream.on('error', () => {
    if (res.headersSent) {
      res.end()
      return
    }

    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Failed to fetch upstream stream.')
  })

  res.on('close', () => upstream.destroy())
  upstream.end()
}
