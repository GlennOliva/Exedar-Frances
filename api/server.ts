import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApp } from '../server/app.js'

const app = createApp()
const routeParameter = '__vercel_api_path'

export const config = { runtime: 'nodejs', maxDuration: 300 }

export default function handler(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? '/', 'https://vercel.internal')
  const route = url.searchParams.get(routeParameter)

  if (route !== null) {
    url.searchParams.delete(routeParameter)
    request.url = `/api/${route.replace(/^\/+/, '')}${url.search}`
  }

  return app(request, response)
}
