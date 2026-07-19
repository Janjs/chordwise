export async function getResponseErrorText(response: Response) {
  const text = await response.text().catch(() => '')
  if (!text) return undefined

  try {
    const result = JSON.parse(text)
    if (typeof result?.error === 'string') return result.error
    if (typeof result?.message === 'string') return result.message
  } catch {
    // Plain-text upstream errors are useful diagnostics too.
  }

  return text.slice(0, 500)
}

export function getStorageUploadFailureMessage(
  status: number,
  statusText: string,
  upstreamError?: string,
) {
  const statusLabel = statusText ? `${status} ${statusText}` : String(status)
  const detail = upstreamError ? `: ${upstreamError.replace(/[.\s]+$/, '')}` : ''
  return `Convex storage upload failed (${statusLabel})${detail}.`
}

export function describeUploadUrl(uploadUrl: string) {
  const url = new URL(uploadUrl)
  return {
    origin: url.origin,
    pathname: url.pathname,
  }
}
