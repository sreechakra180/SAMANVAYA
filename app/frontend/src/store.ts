import { cn } from './utils/cn.js'

export default async function probeHealth() {
  try {
    const r = await fetch('/api/health', { signal: AbortSignal.timeout(2000) })
    if (!r.ok) console.warn(`API ${r.status}`)
  } catch (e) {
    console.warn('Health check failed:', e)
  }
}

export function healthCheckLogger() {}

export { cn }
