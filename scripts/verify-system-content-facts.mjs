import fs from 'node:fs'

import {
  buildSystemContentFactsFromSource,
  readContentModelsSource,
  readSystemContentFacts,
  resolveDefaultSystemContentFactsPath,
  resolveFrontendRepoRoot,
} from './system-content-facts.mjs'

const frontendRepoRoot = resolveFrontendRepoRoot(import.meta.url)
const targetPath = process.env.SYSTEM_CONTENT_FACTS_PATH || resolveDefaultSystemContentFactsPath(frontendRepoRoot)

if (!fs.existsSync(targetPath)) {
  console.log(`[verify-system-content-facts] skipped: target file not found at ${targetPath}`)
  process.exit(0)
}

const source = readContentModelsSource(frontendRepoRoot)
const expectedFacts = buildSystemContentFactsFromSource(source)
const actualFacts = readSystemContentFacts(targetPath)

if (JSON.stringify(actualFacts) !== JSON.stringify(expectedFacts)) {
  console.error(`[verify-system-content-facts] system content facts drift detected at ${targetPath}`)
  console.error('[verify-system-content-facts] run: npm run export:system-content-facts')
  process.exit(1)
}

console.log('[verify-system-content-facts] passed')
