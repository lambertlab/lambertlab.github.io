import {
  buildSystemContentFactsFromSource,
  readContentModelsSource,
  resolveDefaultSystemContentFactsPath,
  resolveFrontendRepoRoot,
  writeSystemContentFacts,
} from './system-content-facts.mjs'

const frontendRepoRoot = resolveFrontendRepoRoot(import.meta.url)
const targetPath = process.env.SYSTEM_CONTENT_FACTS_PATH || resolveDefaultSystemContentFactsPath(frontendRepoRoot)
const source = readContentModelsSource(frontendRepoRoot)
const facts = buildSystemContentFactsFromSource(source)

writeSystemContentFacts(targetPath, facts)
console.log(`[export-system-content-facts] wrote ${targetPath}`)
