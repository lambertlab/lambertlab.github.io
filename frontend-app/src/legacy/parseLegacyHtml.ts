export interface ParsedLegacyHtml {
  title: string
  description: string
  bodyContentHtml: string
}

const TITLE_PATTERN = /<title>([\s\S]*?)<\/title>/i
const BODY_PATTERN = /<body[^>]*>([\s\S]*?)<\/body>/i
const DESCRIPTION_PATTERNS = [
  /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["'][^>]*>/i,
  /<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["'][^>]*>/i,
]

function extractDescription(source: string): string {
  for (const pattern of DESCRIPTION_PATTERNS) {
    const matched = source.match(pattern)
    if (matched && matched[1]) {
      return matched[1].trim()
    }
  }
  return ''
}

export function parseLegacyHtml(source: string): ParsedLegacyHtml {
  const titleMatch = source.match(TITLE_PATTERN)
  const bodyMatch = source.match(BODY_PATTERN)

  const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : ''
  const description = extractDescription(source)
  const bodyInner = bodyMatch && bodyMatch[1] ? bodyMatch[1] : ''

  const afterHeader = bodyInner.replace(/^[\s\S]*?<\/header>/i, '')
  const withoutScripts = afterHeader.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const bodyContentHtml = withoutScripts.trim()

  return {
    title,
    description,
    bodyContentHtml,
  }
}

