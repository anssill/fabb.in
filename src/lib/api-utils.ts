export async function safeJsonParse(input: any): Promise<any> {
  if (!input) return {}
  try {
    if (typeof input.json === 'function') {
      const cloned = typeof input.clone === 'function' ? input.clone() : input
      const text = await cloned.text()
      return text ? JSON.parse(text) : {}
    }
    if (typeof input === 'string') {
      return JSON.parse(input)
    }
    return input
  } catch (e) {
    try {
      if (typeof input.json === 'function') {
        return await input.json()
      }
    } catch (innerError) {
      // Ignore
    }
    return {}
  }
}

export function isValidUuid(id: any): boolean {
  if (typeof id !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

