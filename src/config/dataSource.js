const configuredSource = String(import.meta.env.VITE_DATA_SOURCE || 'api').trim().toLowerCase()

export const DATA_SOURCE = configuredSource === 'mock' ? 'mock' : 'api'
export const isMockMode = DATA_SOURCE === 'mock'
export const isApiMode = !isMockMode

if (configuredSource !== 'api' && configuredSource !== 'mock') {
  console.warn(`[data-source] Unsupported VITE_DATA_SOURCE="${configuredSource}". Using api.`)
}
