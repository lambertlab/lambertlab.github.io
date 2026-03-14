import fs from 'node:fs'
import path from 'node:path'
import { createGateCollector } from './gate-layering.mjs'

const gate = createGateCollector('verify-editorial-workflow')
const repoRoot = path.resolve('.')
const modelFile = path.resolve(repoRoot, 'src/content/contentModels.ts')

const contentRoutes = [
  'src/routes/about/index.tsx',
  'src/routes/about/index[.]html.tsx',
  'src/routes/contact/index.tsx',
  'src/routes/contact/index[.]html.tsx',
  'src/routes/journal/index.tsx',
  'src/routes/journal/index[.]html.tsx',
  'src/routes/journal/model-first-engineering/index.tsx',
  'src/routes/journal/model-first-engineering/index[.]html.tsx',
  'src/routes/journal/ai-collaboration-checklist/index.tsx',
  'src/routes/journal/ai-collaboration-checklist/index[.]html.tsx',
  'src/routes/journal/operational-habits-that-stick/index.tsx',
  'src/routes/journal/operational-habits-that-stick/index[.]html.tsx',
]

const legacyPathsToDelete = [
  'src/components/LegacyPageView.tsx',
  'src/legacy/pages.ts',
  'src/legacy/parseLegacyHtml.ts',
  'src/legacy/useHomeSplitLayout.ts',
  'src/legacy-html',
]

const legacyImportWhitelist = [
  // Format:
  // { file: 'src/path/to/file.tsx', reason: 'why this legacy import is temporarily allowed' },
]

function readText(filePath) {
  return fs.readFileSync(path.resolve(repoRoot, filePath), 'utf8')
}

function assertFileExists(filePath) {
  const resolved = path.resolve(repoRoot, filePath)
  if (!fs.existsSync(resolved)) {
    gate.addBlocking({
      code: 'editorial.missing-file',
      message: `Missing required file: ${filePath}`,
      location: filePath,
    })
    return false
  }
  return true
}

function verifyModelEntry() {
  if (!assertFileExists('src/content/contentModels.ts')) {
    return
  }

  const source = readText('src/content/contentModels.ts')
  const exportedModels = ['aboutPageContentModel', 'contactPageContentModel', 'journalIndexContentModel', 'journalDetailContentBySlug']

  for (const modelName of exportedModels) {
    if (!source.includes(`export const ${modelName}`)) {
      gate.addBlocking({
        code: 'editorial.model-export-missing',
        message: `Required content model export is missing: ${modelName}`,
        location: 'src/content/contentModels.ts',
      })
    }
  }
}

function verifyRouteTemplateConsumption() {
  for (const routeFile of contentRoutes) {
    if (!assertFileExists(routeFile)) {
      continue
    }

    const source = readText(routeFile)
    if (!source.includes("from '~/content/contentModels'")) {
      gate.addBlocking({
        code: 'editorial.route-not-model-first',
        message: 'Content route does not consume model entry from src/content/contentModels.ts',
        location: routeFile,
      })
    }
    if (source.includes("from '~/legacy/") || source.includes('legacyPages') || source.includes('LegacyPageView')) {
      gate.addBlocking({
        code: 'editorial.route-legacy-fallback',
        message: 'Content route regressed to legacy entry usage.',
        location: routeFile,
      })
    }
  }
}

function verifyLegacySunsetGuardrail() {
  for (const legacyPath of legacyPathsToDelete) {
    const resolved = path.resolve(repoRoot, legacyPath)
    if (fs.existsSync(resolved)) {
      gate.addBlocking({
        code: 'legacy.asset-still-present',
        message: 'Legacy sunset batch expected this asset to be retired.',
        location: legacyPath,
      })
    }
  }
}

function verifyNoRawLegacyHtmlImport() {
  const sourceRoot = path.resolve(repoRoot, 'src')
  const stack = [sourceRoot]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }
    const stat = fs.statSync(current)
    if (stat.isDirectory()) {
      const children = fs.readdirSync(current).map((name) => path.join(current, name))
      for (const child of children) {
        stack.push(child)
      }
      continue
    }
    if (!current.endsWith('.ts') && !current.endsWith('.tsx')) {
      continue
    }
    const rel = path.relative(repoRoot, current).replace(/\\/g, '/')
    const source = fs.readFileSync(current, 'utf8')
    if (source.includes('legacy-html/') && source.includes('?raw')) {
      gate.addBlocking({
        code: 'legacy.raw-import-detected',
        message: 'Raw legacy-html import detected after P5.3 sunset.',
        location: rel,
      })
    }
  }
}

function verifyNoLegacyModuleImports() {
  const allowedByFile = new Map(legacyImportWhitelist.map((item) => [item.file, item.reason]))
  const sourceRoot = path.resolve(repoRoot, 'src')
  const stack = [sourceRoot]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    const stat = fs.statSync(current)
    if (stat.isDirectory()) {
      const children = fs.readdirSync(current).map((name) => path.join(current, name))
      for (const child of children) {
        stack.push(child)
      }
      continue
    }

    if (!current.endsWith('.ts') && !current.endsWith('.tsx')) {
      continue
    }

    const rel = path.relative(repoRoot, current).replace(/\\/g, '/')
    const source = fs.readFileSync(current, 'utf8')
    if (!source.includes("~/legacy/") && !source.includes("src/legacy/")) {
      continue
    }

    const reason = allowedByFile.get(rel)
    if (!reason) {
      gate.addBlocking({
        code: 'legacy.import-disallowed',
        message: 'Disallowed legacy module import detected. Add explicit whitelist entry with reason if truly required.',
        location: rel,
      })
      continue
    }

    gate.addObserving({
      code: 'legacy.import-whitelisted',
      message: `Legacy import allowed by whitelist: ${reason}`,
      location: rel,
    })
  }
}

function main() {
  if (!fs.existsSync(modelFile)) {
    gate.addBlocking({
      code: 'editorial.model-file-missing',
      message: 'Missing model entry file src/content/contentModels.ts',
      location: 'src/content/contentModels.ts',
    })
  }

  verifyModelEntry()
  verifyRouteTemplateConsumption()
  verifyLegacySunsetGuardrail()
  verifyNoRawLegacyHtmlImport()
  verifyNoLegacyModuleImports()

  gate.addInfo({
    code: 'editorial.workflow-summary',
    message: 'Checked model-first routes, legacy fallback usage, and retired asset guardrail.',
  })
  gate.printSummary()

  if (gate.hasBlocking()) {
    process.exit(1)
  }

  console.log('[verify-editorial-workflow] passed')
}

main()
