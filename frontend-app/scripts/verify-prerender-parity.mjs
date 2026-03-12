import fs from 'node:fs'
import path from 'node:path'

const outputRoot = path.resolve('.output/public')
const pagesToCheck = [
  'index.html',
  'about/index.html',
  'contact/index.html',
  'projects/index.html',
  'projects/personal-toolbox/index.html',
  'projects/ai-message-value-triage/index.html',
  'projects/personal-website/index.html',
  'journal/index.html',
  'status/index.html',
  'journal/model-first-engineering/index.html',
  'journal/ai-collaboration-checklist/index.html',
  'journal/operational-habits-that-stick/index.html',
]

const requiredFragments = [
  'class="ll-header"',
  'class="ll-site-footer"',
  'data-system-status',
  'href="/projects/"',
  'href="/journal/index.html"',
  'href="/about/index.html"',
  'href="/contact/index.html"',
  'href="/status/"',
]

const forbiddenFragments = ['href="/projects/index.html"', 'Control Center']

const pageSpecificForbiddenFragments = {
  'projects/personal-toolbox/index.html': ['href="../index.html"', 'href="/projects/personal-toolbox/index.html"'],
  'projects/ai-message-value-triage/index.html': ['href="../index.html"', 'href="/projects/ai-message-value-triage/index.html"'],
}

let failed = false

for (const relativePagePath of pagesToCheck) {
  const fullPath = path.join(outputRoot, relativePagePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`[missing] ${relativePagePath}`)
    failed = true
    continue
  }

  const html = fs.readFileSync(fullPath, 'utf8')
  for (const fragment of requiredFragments) {
    if (!html.includes(fragment)) {
      console.error(`[contract] ${relativePagePath} missing "${fragment}"`)
      failed = true
    }
  }

  for (const fragment of forbiddenFragments) {
    if (html.includes(fragment)) {
      console.error(`[contract] ${relativePagePath} should not contain "${fragment}"`)
      failed = true
    }
  }

  const pageSpecificFragments = pageSpecificForbiddenFragments[relativePagePath] ?? []
  for (const fragment of pageSpecificFragments) {
    if (html.includes(fragment)) {
      console.error(`[contract] ${relativePagePath} should not contain "${fragment}"`)
      failed = true
    }
  }
}

if (failed) {
  process.exit(1)
}

console.log('[verify-prerender-parity] passed')
