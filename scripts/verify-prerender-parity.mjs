import fs from 'node:fs'
import path from 'node:path'
import { createGateCollector } from './gate-layering.mjs'
import { prerenderOutputFiles } from './page-registry.mjs'

const outputRoot = path.resolve('.output/public')
const pagesToCheck = prerenderOutputFiles

const shellRequiredFragments = [
  'class="ll-header"',
  'class="ll-site-footer"',
  'id="main-content"',
  'data-theme-mode-switch',
  'data-system-status',
  'href="/projects/"',
  'href="/journal/"',
  'href="/about/"',
  'href="/contact/"',
  'href="/status/"',
]

const forbiddenFragments = [
  'href="/index.html"',
  'href="/about/index.html"',
  'href="/contact/index.html"',
  'href="/journal/index.html"',
  'href="/projects/index.html"',
  'href="/status/index.html"',
]

const pageSpecificRequiredFragments = {
  'contact/index.html': ['class="wrap"', 'class="grid"', 'href="https://github.com/lambertlab"', 'href="mailto:you@example.com"'],
  'index.html': [
    'data-home-managed-by-projects',
    'data-home-featured-projects',
    'data-home-featured-slot="0"',
  ],
  'journal/index.html': [
    'class="journal-grid"',
    'class="note-list"',
    'class="archive-row"',
    'href="/journal/model-first-engineering/"',
    'href="/journal/ai-collaboration-checklist/"',
    'href="/journal/operational-habits-that-stick/"',
  ],
  'projects/index.html': [
    'data-project-catalog',
    'data-loading-state',
    'data-empty-state',
    'data-error-state',
    'id="retry-fetch"',
    'data-project-grid',
  ],
  'status/index.html': ['class="status-page-shell"', 'class="status-state-panel"', 'class="status-page-hero"'],
  'admin/index.html': ['Control Center'],
  'admin/projects/index.html': ['Control Center'],
  'projects/personal-toolbox/index.html': ['project-detail-shell', 'project-detail-loading'],
  'projects/ai-message-value-triage/index.html': ['project-detail-shell', 'project-detail-loading'],
  'projects/personal-website/index.html': ['project-detail-shell', 'project-detail-loading'],
}

const pageSpecificForbiddenFragments = {
  'index.html': ['Control Center'],
  'about/index.html': ['Control Center'],
  'contact/index.html': ['data-legacy-page="contact"', 'Control Center'],
  'journal/index.html': ['data-legacy-page="journal"', 'Control Center'],
  'status/index.html': ['Control Center'],
  'journal/model-first-engineering/index.html': ['Control Center'],
  'journal/ai-collaboration-checklist/index.html': ['Control Center'],
  'journal/operational-habits-that-stick/index.html': ['Control Center'],
  'projects/index.html': ['Control Center'],
  'projects/personal-toolbox/index.html': ['href="../index.html"', 'href="/projects/personal-toolbox/index.html"', 'Control Center'],
  'projects/ai-message-value-triage/index.html': ['href="../index.html"', 'href="/projects/ai-message-value-triage/index.html"', 'Control Center'],
  'projects/personal-website/index.html': ['Control Center'],
}

const gate = createGateCollector('verify-prerender-parity')

for (const relativePagePath of pagesToCheck) {
  const fullPath = path.join(outputRoot, relativePagePath)
  if (!fs.existsSync(fullPath)) {
    gate.addBlocking({
      code: 'prerender.missing-page',
      message: 'Required prerender output is missing.',
      location: relativePagePath,
    })
    continue
  }

  const html = fs.readFileSync(fullPath, 'utf8')
  for (const fragment of shellRequiredFragments) {
    if (!html.includes(fragment)) {
      gate.addBlocking({
        code: 'prerender.missing-shell-fragment',
        message: `Missing required fragment "${fragment}".`,
        location: relativePagePath,
      })
    }
  }

  for (const fragment of pageSpecificRequiredFragments[relativePagePath] ?? []) {
    if (!html.includes(fragment)) {
      gate.addBlocking({
        code: 'prerender.missing-page-fragment',
        message: `Missing page-specific fragment "${fragment}".`,
        location: relativePagePath,
      })
    }
  }

  for (const fragment of forbiddenFragments) {
    if (html.includes(fragment)) {
      gate.addBlocking({
        code: 'prerender.forbidden-fragment',
        message: `Found forbidden fragment "${fragment}".`,
        location: relativePagePath,
      })
    }
  }

  const pageSpecificFragments = pageSpecificForbiddenFragments[relativePagePath] ?? []
  for (const fragment of pageSpecificFragments) {
    if (html.includes(fragment)) {
      gate.addBlocking({
        code: 'prerender.forbidden-page-fragment',
        message: `Found forbidden page-specific fragment "${fragment}".`,
        location: relativePagePath,
      })
    }
  }
}

gate.addInfo({
  code: 'prerender.scan-finished',
  message: `Scanned ${pagesToCheck.length} prerender pages.`,
})
gate.printSummary()

if (gate.hasBlocking()) {
  process.exit(1)
}

console.log('[verify-prerender-parity] passed')
