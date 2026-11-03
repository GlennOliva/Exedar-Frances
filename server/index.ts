import { createApp } from './app'
import { getEnv } from './config/env'
import { startScheduler } from './jobs/scheduler'

const env = getEnv()
const app = createApp({ serveStatic: env.NODE_ENV === 'production' })

const server = app.listen(env.PORT, () => console.log(`Wedding server listening on port ${env.PORT}`))
const scheduler = startScheduler()
function shutdown() { scheduler.stop(); server.close() }
process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())

export { app }
