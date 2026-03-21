import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function resolveScriptDir(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl))
}

export function resolveFrontendRepoRoot(importMetaUrl = import.meta.url) {
  return path.resolve(resolveScriptDir(importMetaUrl), '..')
}

export function resolveDefaultSystemContentFactsPath(frontendRepoRoot) {
  return path.resolve(frontendRepoRoot, '..', 'lambertlab-backend', 'apps', 'api', 'resources', 'system_content_facts.json')
}

export function readContentModelsSource(frontendRepoRoot) {
  const sourcePath = path.resolve(frontendRepoRoot, 'src', 'content', 'contentModels.ts')
  return fs.readFileSync(sourcePath, 'utf8')
}

function assertIsoDate(value, context) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`[system-content-facts] Invalid updatedAt for ${context}: ${value}`)
  }
}

export function extractJournalArtifactsFromContentModels(source) {
  const pattern = /slug:\s*'(?<slug>\/journal(?:\/[^']*)?\/)'\s*,\s*updatedAt:\s*'(?<updatedAt>[^']+)'\s*,\s*visibility:\s*'(?<visibility>[^']+)'/g
  const artifacts = []

  for (const match of source.matchAll(pattern)) {
    const { slug, updatedAt, visibility } = match.groups ?? {}
    if (!slug || !updatedAt || visibility !== 'public') {
      continue
    }

    assertIsoDate(updatedAt, slug)
    artifacts.push({
      slug,
      updated_at: updatedAt,
    })
  }

  artifacts.sort((left, right) => left.slug.localeCompare(right.slug))
  return artifacts
}

export function buildSystemContentFactsFromSource(source) {
  const journalArtifacts = extractJournalArtifactsFromContentModels(source)
  if (journalArtifacts.length === 0) {
    throw new Error('[system-content-facts] No public journal artifacts were found in src/content/contentModels.ts')
  }

  const journalUpdatedAt = journalArtifacts.reduce(
    (latest, artifact) => (artifact.updated_at > latest ? artifact.updated_at : latest),
    journalArtifacts[0].updated_at,
  )

  return {
    narrative_content: {
      journal_updated_at: journalUpdatedAt,
      journal_artifacts: journalArtifacts,
    },
  }
}

export function readSystemContentFacts(targetPath) {
  return JSON.parse(fs.readFileSync(targetPath, 'utf8'))
}

export function writeSystemContentFacts(targetPath, facts) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, `${JSON.stringify(facts, null, 2)}\n`, 'utf8')
}
