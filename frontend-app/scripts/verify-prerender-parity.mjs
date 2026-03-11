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
  'journal/index.html',
  'journal/model-first-engineering/index.html',
  'journal/ai-collaboration-checklist/index.html',
  'journal/operational-habits-that-stick/index.html',
  'insights/index.html',
  'insights/model-first-engineering.html',
  'insights/ai-collaboration-checklist.html',
  'insights/operational-habits-that-stick.html',
]

const requiredFragments = [
  'class="ll-header"',
  'data-system-status',
  'href="/projects/index.html"',
  'href="/journal/index.html"',
  'href="/about/index.html"',
  'href="/contact/index.html"',
]

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
}

if (failed) {
  process.exit(1)
}

console.log('[verify-prerender-parity] passed')
