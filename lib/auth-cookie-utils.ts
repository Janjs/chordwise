export function rewriteCookieForFrontend(cookie: string): string {
  const parts = cookie.split(';').map((part) => part.trim())
  const rewritten: string[] = []

  for (const part of parts) {
    const lowerPart = part.toLowerCase()
    if (lowerPart.startsWith('domain=')) {
      continue
    }
    if (lowerPart === 'samesite=strict') {
      rewritten.push('SameSite=Lax')
      continue
    }
    rewritten.push(part)
  }

  if (!rewritten.some((p) => p.toLowerCase().startsWith('samesite='))) {
    rewritten.push('SameSite=Lax')
  }

  if (!rewritten.some((p) => p.toLowerCase() === 'secure')) {
    rewritten.push('Secure')
  }

  return rewritten.join('; ')
}
