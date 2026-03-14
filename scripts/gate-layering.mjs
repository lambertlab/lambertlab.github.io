import fs from 'node:fs'
import path from 'node:path'

const GATE_LEVELS = ['blocking', 'observing', 'info']

function ensureLevel(level) {
  if (!GATE_LEVELS.includes(level)) {
    throw new Error(`Unsupported gate level "${level}"`)
  }
}

function formatSignal(signal) {
  const locationSuffix = signal.location ? ` location=${signal.location}` : ''
  const ruleSuffix = signal.ruleId ? ` ruleId=${signal.ruleId}` : ''
  return `- [${signal.code}] ${signal.message}${locationSuffix}${ruleSuffix}`
}

function normalizeRule(rule, sourcePath) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    throw new Error(`Invalid whitelist rule in ${sourcePath}`)
  }

  const ruleId = String(rule.ruleId || '').trim()
  const scope = String(rule.scope || '').trim()
  const evidence = String(rule.evidence || '').trim()
  const invalidatesWhen = String(rule.invalidatesWhen || '').trim()
  const expiresOn = String(rule.expiresOn || '').trim()
  const downgradeTo = String(rule.downgradeTo || '').trim()
  const contains = String(rule.contains || '').trim()

  if (!ruleId || !scope || !evidence || !invalidatesWhen || !expiresOn || !contains) {
    throw new Error(`Whitelist rule missing required fields in ${sourcePath}: ${JSON.stringify(rule)}`)
  }
  if (scope === '*' || scope.toLowerCase() === 'global') {
    throw new Error(`Whitelist rule "${ruleId}" cannot use global scope`)
  }
  if (downgradeTo !== 'observing' && downgradeTo !== 'info') {
    throw new Error(`Whitelist rule "${ruleId}" cannot downgrade to "${downgradeTo}"`)
  }
  const expiresDate = new Date(expiresOn)
  if (Number.isNaN(expiresDate.getTime())) {
    throw new Error(`Whitelist rule "${ruleId}" has invalid expiresOn: "${expiresOn}"`)
  }

  return {
    ruleId,
    scope,
    contains,
    evidence,
    invalidatesWhen,
    expiresOn,
    downgradeTo,
  }
}

export function createGateCollector(name) {
  return {
    name,
    blocking: [],
    observing: [],
    info: [],
    addSignal(level, signal) {
      ensureLevel(level)
      this[level].push(signal)
    },
    addBlocking(signal) {
      this.addSignal('blocking', signal)
    },
    addObserving(signal) {
      this.addSignal('observing', signal)
    },
    addInfo(signal) {
      this.addSignal('info', signal)
    },
    hasBlocking() {
      return this.blocking.length > 0
    },
    printSummary() {
      console.log(`[${this.name}] layered-summary blocking=${this.blocking.length} observing=${this.observing.length} info=${this.info.length}`)
      for (const level of GATE_LEVELS) {
        if (this[level].length === 0) {
          continue
        }
        console.log(`[${this.name}] ${level}-signals`)
        for (const signal of this[level]) {
          console.log(formatSignal(signal))
        }
      }
    },
    toJSON() {
      return {
        blocking: this.blocking,
        observing: this.observing,
        info: this.info,
      }
    },
  }
}

export function loadNoiseWhitelist(filePath) {
  const resolvedPath = path.resolve(filePath)
  if (!fs.existsSync(resolvedPath)) {
    return []
  }

  const raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
  if (!Array.isArray(raw)) {
    throw new Error(`Noise whitelist must be an array: ${resolvedPath}`)
  }
  return raw.map((rule) => normalizeRule(rule, resolvedPath))
}

export function matchWhitelistRule(rules, scope, text) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return null
  }
  for (const rule of rules) {
    if (rule.scope !== scope) {
      continue
    }
    if (text.includes(rule.contains)) {
      return rule
    }
  }
  return null
}
