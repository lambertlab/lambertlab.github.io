import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, 'visual-parity.config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const cliModeArg = process.argv.find((arg) => arg.startsWith('--mode='))
const requestedMode = (process.env.VISUAL_PARITY_MODE || cliModeArg?.split('=')[1] || config.defaultMode || 'smoke')
  .toLowerCase()
const modeConfig = config.modes?.[requestedMode]
const rawHeaderStabilitySkipAllowlist = modeConfig?.headerStability?.skipAllowlist
const headerStabilitySkipAllowlist = Array.isArray(rawHeaderStabilitySkipAllowlist)
  ? rawHeaderStabilitySkipAllowlist
    .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim())
  : []
const headerStabilityMaxAttempts = 3
const headerStabilityRetryDelayMs = 350

if (!modeConfig) {
  const availableModes = Object.keys(config.modes || {})
  throw new Error(`Missing mode "${requestedMode}" in visual-parity.config.json. Available: ${availableModes.join(', ')}`)
}

const outputRoot = path.resolve(__dirname, '..', '.output', 'public')
const reportRoot = path.resolve(__dirname, '..', 'qa', 'visual-parity')
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const runDir = path.join(reportRoot, runId)
const latestDir = path.join(reportRoot, 'latest')
const expectedDiffCategories = new Set(['intentional-change', 'suspected-regression'])

const shellKeyAreas = [
  { name: 'header', selector: '.ll-header' },
  { name: 'main-nav', selector: '.ll-nav' },
  { name: 'theme-switch', selector: '[data-theme-mode-switch]' },
  { name: 'status-entry', selector: '[data-system-status]' },
  { name: 'footer', selector: '.ll-site-footer' },
]

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pickContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return mimeTypes[ext] || 'application/octet-stream'
}

function pickByName(allItems, selectedNames, label) {
  if (selectedNames === 'all') {
    return allItems
  }

  const selected = []
  for (const name of selectedNames || []) {
    const item = allItems.find((entry) => entry.name === name)
    if (!item) {
      throw new Error(`Unknown ${label} "${name}" in mode "${requestedMode}"`)
    }
    selected.push(item)
  }
  return selected
}

function appendQuery(pathname, key, value) {
  const parsed = new URL(pathname, 'http://localhost')
  parsed.searchParams.set(key, value)
  return `${parsed.pathname}${parsed.search}`
}

function joinUrl(baseUrl, pathname) {
  return new URL(pathname, baseUrl).toString()
}

function createStaticServer(rootDir, port) {
  const server = http.createServer((req, res) => {
    try {
      const requestPath = decodeURIComponent((req.url || '/').split('?')[0])
      const safePath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath
      let targetPath = path.resolve(rootDir, safePath)

      if (!targetPath.startsWith(path.resolve(rootDir))) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
        targetPath = path.join(targetPath, 'index.html')
      } else if (!path.extname(targetPath) && fs.existsSync(`${targetPath}.html`)) {
        targetPath = `${targetPath}.html`
      }

      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
        res.writeHead(404)
        res.end('Not Found')
        return
      }

      res.writeHead(200, {
        'Content-Type': pickContentType(targetPath),
        'Cache-Control': 'no-store',
      })
      fs.createReadStream(targetPath).pipe(res)
    } catch {
      res.writeHead(500)
      res.end('Server Error')
    }
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => resolve({ server, port }))
  })
}

async function createStaticServerWithFallback(rootDir, preferredPort, maxRetries = 20) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const port = preferredPort + attempt
    try {
      return await createStaticServer(rootDir, port)
    } catch (error) {
      if (error?.code !== 'EADDRINUSE' || attempt === maxRetries) {
        throw error
      }
    }
  }

  throw new Error(`Unable to bind static server from port ${preferredPort}`)
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve())
  })
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

function writeText(filePath, payload) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, payload, 'utf8')
}

function copyDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return
  }
  ensureDir(targetDir)
  for (const item of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, item.name)
    const targetPath = path.join(targetDir, item.name)
    if (item.isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function parseExpectedDiffMap(rawMap) {
  const map = {}
  for (const [caseId, entry] of Object.entries(rawMap || {})) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Invalid expectedDiffs entry for "${caseId}"`)
    }

    const category = typeof entry.category === 'string' ? entry.category.trim() : ''
    const reason = typeof entry.reason === 'string' ? entry.reason.trim() : ''

    if (!expectedDiffCategories.has(category)) {
      throw new Error(
        `Invalid expectedDiff category for "${caseId}": "${category}". Allowed: ${Array.from(expectedDiffCategories).join(', ')}`,
      )
    }

    if (!reason) {
      throw new Error(`Missing expectedDiff reason for "${caseId}".`)
    }

    map[caseId] = { category, reason }
  }

  return map
}

function shouldDisableStatusHydration(request) {
  try {
    const frameUrl = request.frame()?.url()
    if (!frameUrl) {
      return false
    }
    const parsed = new URL(frameUrl)
    return parsed.pathname.startsWith('/status/') && parsed.searchParams.get('visual_nojs') === '1'
  } catch {
    return false
  }
}

function getStatusIssueScenario(request) {
  try {
    const frameUrl = request.frame()?.url()
    if (!frameUrl) {
      return 'single'
    }
    const issueMode = new URL(frameUrl).searchParams.get('issues')
    if (issueMode === 'empty' || issueMode === 'multi') {
      return issueMode
    }
  } catch {
    return 'single'
  }
  return 'single'
}

function buildStatusPublicPayload(issueMode) {
  const knownIssuesByMode = {
    empty: [],
    single: [
      {
        key: 'content-latency',
        level: 'warn',
        status: 'monitoring',
        title: 'Some content updates may appear with delay.',
        summary: 'Recent updates can take longer than usual to appear on public pages.',
        surfaces: ['projects', 'journal'],
        updated_at: '2026-03-12T00:00:00Z',
        detail: 'We are monitoring the delay. Public pages remain available while newer updates catch up.',
      },
    ],
    multi: [
      {
        key: 'content-latency',
        level: 'warn',
        status: 'active',
        title: 'Some content updates may appear with delay.',
        summary: 'Recent updates can take longer than usual to appear on public pages.',
        surfaces: ['projects', 'journal'],
        updated_at: '2026-03-12T00:00:00Z',
        detail: 'Public pages remain available, but new content may take longer than usual to show up.',
      },
      {
        key: 'status-clarity-followup',
        level: 'info',
        status: 'resolved',
        title: 'Status wording was recently clarified.',
        summary: 'The page now explains the difference between the header light and this public trust summary.',
        surfaces: ['status'],
        updated_at: '2026-03-12T00:00:00Z',
        detail: 'The wording update is live. We are keeping the note visible for a short period so returning visitors can reorient.',
      },
    ],
  }

  const knownIssues = knownIssuesByMode[issueMode] || knownIssuesByMode.single
  return {
    ok: true,
    page: {
      overall_status: {
        status: issueMode === 'multi' ? 'yellow' : 'green',
        summary:
          knownIssues.length > 0
            ? 'Core public surfaces remain available, with a few visitor-facing issues or follow-up notes listed below.'
            : 'Core public surfaces are available and no visitor-facing issues are currently listed.',
        updated_at: '2026-03-12T00:00:00Z',
        context: {
          label: 'Public trust summary',
          scope: 'public-trust',
          note: 'The header status light reflects system health only. This page also considers public surface availability, content freshness, and visitor-facing issues.',
        },
      },
      public_surface: {
        summary: { status: 'green', label: 'Core public surfaces are available.' },
        key_surfaces: [
          { key: 'home', label: 'Home', path: '/', health: 'up', note: 'Entry surface is serving normally.' },
          { key: 'projects', label: 'Projects', path: '/projects/', health: 'up', note: 'Project catalog is available.' },
          { key: 'journal', label: 'Journal', path: '/journal/', health: 'up', note: 'Writing surface is available.' },
        ],
      },
      content_freshness: {
        summary: {
          status: knownIssues.length > 0 ? 'yellow' : 'green',
          label:
            knownIssues.length > 0
              ? 'Some public content updates are moving more slowly than usual.'
              : 'Projects and journal content are up to date.',
        },
        areas: [],
        active_focus: 'Improving public information architecture and trust surfaces.',
      },
      known_issues: knownIssues,
    },
  }
}

function createMockProjects() {
  return [
    {
      project_key: 'personal-toolbox',
      slug: 'personal-toolbox',
      canonical_path: '/projects/personal-toolbox/',
      name: 'Personal Toolbox',
      summary: 'A compact personal tooling workspace for daily execution loops.',
      headline: 'A stable toolbox surface for recurring work and small utilities.',
      overview: 'This project consolidates task helpers and lightweight automation into one practical workspace.',
      stage: 'active',
      source_type: 'github',
      project_type: 'tooling',
      stack: ['TypeScript', 'Node.js'],
      is_featured: true,
      featured_rank: 1,
      status_note: 'Actively iterating on operator workflows.',
      highlights: ['Shared project truth source.', 'Stable detail routing.'],
      links: {
        primary: 'https://example.com/projects/personal-toolbox/',
        repo: 'https://github.com/lambertlab/personal-toolbox',
        demo: null,
        docs: null,
        notes: null,
      },
      source_refs: {
        repo_full_name: 'lambertlab/personal-toolbox',
        repo_url: 'https://github.com/lambertlab/personal-toolbox',
        visibility: 'public',
      },
      updated_at: '2026-03-12T00:00:00Z',
      synced_at: '2026-03-12T00:00:00Z',
      full_name: 'lambertlab/personal-toolbox',
      url: 'https://github.com/lambertlab/personal-toolbox',
      description: 'Legacy compatibility description.',
      language: 'TypeScript',
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2026-03-12T00:00:00Z',
      visibility: 'public',
      archived: false,
      fork: false,
      source: 'github',
      tags: ['tooling', 'automation'],
      is_active: true,
    },
    {
      project_key: 'ai-message-value-triage',
      slug: 'ai-message-value-triage',
      canonical_path: '/projects/ai-message-value-triage/',
      name: 'AI Message Value Triage',
      summary: 'Evaluate message quality with reusable triage heuristics.',
      headline: 'Message analysis with lightweight operational scoring.',
      overview: 'The project explores message review workflows and repeatable signal extraction.',
      stage: 'research',
      source_type: 'github',
      project_type: 'agent',
      stack: ['Python', 'Prompts'],
      is_featured: true,
      featured_rank: 2,
      status_note: 'Research track remains active.',
      highlights: ['Shared homepage and catalog entry fields.', 'Detail page reads backend contract.'],
      links: {
        primary: 'https://example.com/projects/ai-message-value-triage/',
        repo: 'https://github.com/lambertlab/ai-message-value-triage',
        demo: null,
        docs: null,
        notes: null,
      },
      source_refs: {
        repo_full_name: 'lambertlab/ai-message-value-triage',
        repo_url: 'https://github.com/lambertlab/ai-message-value-triage',
        visibility: 'public',
      },
      updated_at: '2026-03-11T00:00:00Z',
      synced_at: '2026-03-12T00:00:00Z',
      full_name: 'lambertlab/ai-message-value-triage',
      url: 'https://github.com/lambertlab/ai-message-value-triage',
      description: 'Legacy compatibility description.',
      language: 'Python',
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2026-03-11T00:00:00Z',
      visibility: 'public',
      archived: false,
      fork: false,
      source: 'github',
      tags: ['agent', 'ai'],
      is_active: true,
    },
  ]
}

async function applyMockRoutes(context) {
  await context.route('**/*.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: '',
    })
  })

  await context.route('https://cdn.tailwindcss.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: 'window.tailwind = window.tailwind || { config: {} };',
    })
  })

  await context.route('https://fonts.googleapis.com/**', async (route) => route.abort())
  await context.route('https://fonts.gstatic.com/**', async (route) => route.abort())
}

async function configureContext(context, theme) {
  await applyMockRoutes(context)
  await context.addInitScript(({ currentTheme }) => {
    localStorage.setItem('ll-color-mode-v1', currentTheme)
    localStorage.setItem('theme', currentTheme)
    localStorage.setItem('ll-font-theme', 'classic')
  }, { currentTheme: theme })
}

async function waitForPageStable(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('.ll-header', { timeout: 8000 }).catch(() => {})
  await wait(600)
}

async function collectNodeRects(page, selectors) {
  return page.evaluate((nodeSelectors) => {
    const result = {}
    for (const selector of nodeSelectors) {
      const node = document.querySelector(selector)
      if (!node) {
        result[selector] = null
        continue
      }
      const rect = node.getBoundingClientRect()
      result[selector] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }
    return result
  }, selectors)
}

function calculateMaxShift(baseRects, nextRects) {
  let maxShift = 0

  for (const selector of Object.keys(baseRects)) {
    const baseRect = baseRects[selector]
    const nextRect = nextRects[selector]
    if (!baseRect || !nextRect) {
      continue
    }
    const deltas = [
      Math.abs(baseRect.x - nextRect.x),
      Math.abs(baseRect.y - nextRect.y),
      Math.abs(baseRect.width - nextRect.width),
      Math.abs(baseRect.height - nextRect.height),
    ]
    for (const delta of deltas) {
      if (delta > maxShift) {
        maxShift = delta
      }
    }
  }

  return maxShift
}

function resolveHeaderStabilitySkipReason(errorMessage) {
  for (const entry of headerStabilitySkipAllowlist) {
    if (errorMessage.includes(entry)) {
      return entry
    }
  }
  return null
}

function buildUncheckedShellAssertions() {
  return shellKeyAreas.map((area) => ({
    name: area.name,
    selector: area.selector,
    present: null,
  }))
}

async function collectShellAssertions(page) {
  const shellAssertions = []
  const missingShellAreas = []
  for (const area of shellKeyAreas) {
    const present = (await page.locator(area.selector).first().count()) > 0
    shellAssertions.push({
      name: area.name,
      selector: area.selector,
      present,
    })
    if (!present) {
      missingShellAreas.push(area.name)
    }
  }
  return { shellAssertions, missingShellAreas }
}

function summarizeShellAssertionCoverage(results) {
  const summary = Object.fromEntries(
    shellKeyAreas.map((area) => [area.name, { checkedCases: 0, missingCases: 0 }]),
  )
  for (const entry of results) {
    for (const assertion of entry.shellAssertions || []) {
      const areaSummary = summary[assertion.name]
      if (!areaSummary || typeof assertion.present !== 'boolean') {
        continue
      }
      areaSummary.checkedCases += 1
      if (!assertion.present) {
        areaSummary.missingCases += 1
      }
    }
  }
  return summary
}

function resolveHeaderStabilityConclusion(headerStability) {
  if (headerStability.skipped) {
    return 'skipped'
  }
  return headerStability.pass ? 'pass' : 'fail'
}

function formatErrorWithStack(error) {
  if (error instanceof Error) {
    return error.stack ? String(error.stack) : `${error.name}: ${error.message}`
  }
  return String(error)
}

function isHeaderStabilityRetryableError(errorMessage) {
  const normalized = errorMessage.toLowerCase()
  return (
    normalized.includes('browsercontext.newpage') ||
    normalized.includes('browser.newcontext') ||
    normalized.includes('browser.newpage') ||
    (normalized.includes('target page, context or browser has been closed') &&
      (normalized.includes('browsercontext') || normalized.includes('newpage') || normalized.includes('browser')))
  )
}

async function launchVisualBrowser() {
  try {
    return await chromium.launch({ headless: true, channel: 'msedge' })
  } catch {
    return chromium.launch({ headless: true })
  }
}

async function runHeaderStabilityCheck(browser, baseUrl, thresholdPx) {
  const selectors = ['.ll-header', '.ll-brand', '.ll-nav', '[data-theme-mode-switch]', '[data-system-status]']
  const navigationSequence = [
    { selector: '.ll-header .ll-nav-link[href="/projects/"]', to: '/projects/' },
    { selector: '.ll-header .ll-nav-link[href="/journal/index.html"]', to: '/journal/index.html' },
    { selector: '.ll-header .ll-nav-link[href="/about/index.html"]', to: '/about/index.html' },
    { selector: '.ll-header .ll-cta[href="/contact/index.html"]', to: '/contact/index.html' },
  ]

  let context
  let page
  try {
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    })
    await configureContext(context, 'light')
    page = await context.newPage()
    await page.goto(joinUrl(baseUrl, '/index.html'))
    await waitForPageStable(page)

    const baselineRects = await collectNodeRects(page, selectors)
    let maxShift = 0
    const records = []

    for (const item of navigationSequence) {
      await page.locator(item.selector).first().click()
      await page.waitForURL(`**${item.to}`)
      await waitForPageStable(page)
      const nextRects = await collectNodeRects(page, selectors)
      const shift = calculateMaxShift(baselineRects, nextRects)
      records.push({ step: item.to, shift })
      maxShift = Math.max(maxShift, shift)
    }

    return { thresholdPx, maxShift, pass: maxShift <= thresholdPx, records }
  } finally {
    if (page) {
      await page.close().catch(() => {})
    }
    if (context) {
      await context.close().catch(() => {})
    }
  }
}

async function runHeaderStabilityCheckWithRetry(baseUrl, thresholdPx) {
  const attemptLogs = []
  for (let attempt = 1; attempt <= headerStabilityMaxAttempts; attempt += 1) {
    let attemptBrowser
    try {
      attemptBrowser = await launchVisualBrowser()
      const result = await runHeaderStabilityCheck(attemptBrowser, baseUrl, thresholdPx)
      return {
        ...result,
        retry: {
          maxAttempts: headerStabilityMaxAttempts,
          attemptCount: attempt,
          retried: attempt > 1,
        },
        attemptLogs,
      }
    } catch (error) {
      const errorMessage = formatErrorWithStack(error)
      const retryable = isHeaderStabilityRetryableError(errorMessage)
      attemptLogs.push({
        attempt,
        retryable,
        error: errorMessage,
      })
      console.error(
        `[visual-parity][header-stability] attempt ${attempt}/${headerStabilityMaxAttempts} failed retryable=${retryable}: ${errorMessage}`,
      )
      const shouldRetry = retryable && attempt < headerStabilityMaxAttempts
      if (!shouldRetry) {
        const detail = attemptLogs
          .map((entry) => `attempt=${entry.attempt} retryable=${entry.retryable} error=${entry.error}`)
          .join('\n')
        const finalError = new Error(`header stability failed after ${attempt} attempt(s)\n${detail}`)
        finalError.attemptLogs = attemptLogs
        throw finalError
      }
      await wait(headerStabilityRetryDelayMs * attempt)
    } finally {
      if (attemptBrowser) {
        await attemptBrowser.close().catch(() => {})
      }
    }
  }

  throw new Error(`header stability failed without result after ${headerStabilityMaxAttempts} attempts`)
}

function renderMarkdownReport(report) {
  const lines = []
  lines.push('# Visual Parity Structural Report')
  lines.push('')
  lines.push(`- Mode: \`${report.mode}\``)
  lines.push(`- Gate Mode: \`${report.gateMode}\``)
  lines.push(`- Run ID: \`${report.runId}\``)
  lines.push(`- Base URL: \`${report.baseUrl}\``)
  lines.push(`- Total Cases: \`${report.summary.totalCases}\``)
  lines.push(`- Failed Cases: \`${report.summary.failedCases}\``)
  lines.push(`- Warning Signals: \`${report.summary.warningCount}\``)
  lines.push(`- Missing Expected Attribution: \`${report.summary.missingExpectedAttribution}\``)
  lines.push('')
  lines.push('## Check Conclusions')
  lines.push('')
  for (const check of report.checks) {
    const detailSuffix = check.detail ? ` (${check.detail})` : ''
    lines.push(`- ${check.name}: \`${check.result}\`${detailSuffix}`)
  }
  lines.push('')
  lines.push('## Header Stability')
  lines.push('')
  lines.push(`- Conclusion: \`${report.headerStability.conclusion}\``)
  lines.push(`- Max Shift: \`${report.headerStability.maxShift.toFixed(3)}px\``)
  lines.push(`- Threshold: \`${report.headerStability.thresholdPx}px\``)
  lines.push(`- Pass: \`${report.headerStability.pass}\``)
  lines.push(`- Attempts: \`${report.headerStability.retry.attemptCount}/${report.headerStability.retry.maxAttempts}\``)
  lines.push(`- Retried: \`${report.headerStability.retry.retried}\``)
  if (report.headerStability.error) {
    lines.push(`- Error: \`${report.headerStability.error}\``)
  }
  if (report.headerStability.skipReason) {
    lines.push(`- Skip Reason: \`${report.headerStability.skipReason}\``)
  }
  if ((report.headerStability.attemptLogs || []).length > 0) {
    lines.push('- Attempt Logs:')
    for (const attemptEntry of report.headerStability.attemptLogs) {
      lines.push(
        `  - attempt=${attemptEntry.attempt} retryable=${attemptEntry.retryable} error=${attemptEntry.error}`,
      )
    }
  }
  lines.push('')
  lines.push('## Shell Assertion Coverage')
  lines.push('')
  for (const area of shellKeyAreas) {
    const areaSummary = report.shellAssertionCoverage[area.name]
    lines.push(`- ${area.name}: checked=${areaSummary.checkedCases} missing=${areaSummary.missingCases}`)
  }
  lines.push('')
  lines.push('## Warning Signals')
  lines.push('')
  if (report.warnings.length === 0) {
    lines.push('- None')
  } else {
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`)
    }
  }
  lines.push('')
  lines.push('## Failures')
  lines.push('')

  const failed = report.results.filter((entry) => !entry.pass)
  if (failed.length === 0) {
    lines.push('- None')
  } else {
    for (const entry of failed) {
      lines.push(
        `- ${entry.caseId}: reason=${entry.blockingReason || 'shell-assertion'} missing=${entry.missingShellAreas.join(', ') || 'none'} error=${entry.error || 'none'}`,
      )
    }
  }

  return lines.join('\n')
}

async function main() {
  ensure(fs.existsSync(outputRoot), 'Missing ".output/public". Run `npm run build` first.')

  const selectedViewports = pickByName(config.viewports, modeConfig.viewports, 'viewport')
  const selectedThemes = modeConfig.themes === 'all' ? config.themes : modeConfig.themes || []
  const selectedPages = pickByName(config.pages, modeConfig.pages, 'page')
  const expectedDiffMap = parseExpectedDiffMap(modeConfig.expectedDiffs || {})
  const shouldRequireExpectedAttribution = requestedMode === 'smoke'
  for (const theme of selectedThemes) {
    ensure(config.themes.includes(theme), `Unknown theme "${theme}" in mode "${requestedMode}"`)
  }

  const expectedCaseIds = new Set(Object.keys(expectedDiffMap))
  const plannedCaseIds = []
  for (const viewport of selectedViewports) {
    for (const theme of selectedThemes) {
      for (const pageConfig of selectedPages) {
        plannedCaseIds.push(`${pageConfig.name}__${viewport.name}__${theme}`)
      }
    }
  }

  const missingExpectedAttribution = plannedCaseIds.filter((caseId) => !expectedCaseIds.has(caseId))
  if (shouldRequireExpectedAttribution) {
    ensure(
      missingExpectedAttribution.length === 0,
      `Missing expectedDiff attribution for smoke cases: ${missingExpectedAttribution.join(', ')}`,
    )
  }

  ensureDir(runDir)

  const staticSite = await createStaticServerWithFallback(outputRoot, config.ports.newSite)
  const baseUrl = `http://127.0.0.1:${staticSite.port}`
  let browser

  try {
    browser = await launchVisualBrowser()

    const results = []
    const warnings = []
    if (!shouldRequireExpectedAttribution && missingExpectedAttribution.length > 0) {
      warnings.push(
        `missing expected attribution for mode "${requestedMode}": ${missingExpectedAttribution.join(', ')}`,
      )
    }
    for (const viewport of selectedViewports) {
      for (const theme of selectedThemes) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: theme === 'dark' ? 'dark' : 'light',
        })
        context.setDefaultNavigationTimeout(15000)
        await configureContext(context, theme)

        for (const pageConfig of selectedPages) {
          const caseId = `${pageConfig.name}__${viewport.name}__${theme}`
          const basePath = pageConfig.newPath || pageConfig.path
          const targetPath = pageConfig.name.startsWith('status-')
            ? appendQuery(basePath, 'visual_nojs', '1')
            : basePath
          const page = await context.newPage()

          try {
            await page.goto(joinUrl(baseUrl, targetPath), { waitUntil: 'domcontentloaded', timeout: 10000 })
            await waitForPageStable(page)

            const { shellAssertions, missingShellAreas } = await collectShellAssertions(page)

            results.push({
              caseId,
              page: pageConfig.name,
              viewport: viewport.name,
              theme,
              targetPath,
              expectedCategory: expectedDiffMap[caseId]?.category || null,
              expectedReason: expectedDiffMap[caseId]?.reason || null,
              blockingReason: missingShellAreas.length > 0 ? 'missing-shell-areas' : null,
              shellAssertions,
              missingShellAreas,
              pass: missingShellAreas.length === 0,
            })
            if (missingShellAreas.length > 0) {
              console.error(`[visual-parity][block] ${caseId} missing shell areas: ${missingShellAreas.join(', ')}`)
            } else {
              console.log(`[visual-parity] ${caseId} pass=yes`)
            }
          } catch (error) {
            results.push({
              caseId,
              page: pageConfig.name,
              viewport: viewport.name,
              theme,
              targetPath,
              expectedCategory: expectedDiffMap[caseId]?.category || null,
              expectedReason: expectedDiffMap[caseId]?.reason || null,
              blockingReason: 'navigation-error',
              shellAssertions: buildUncheckedShellAssertions(),
              missingShellAreas: [],
              pass: false,
              error: String(error),
            })
            console.error(`[visual-parity][block] ${caseId} navigation failed: ${String(error)}`)
          } finally {
            await page.close().catch(() => {})
          }
        }

        await context.close()
      }
    }

    let headerStability = {
      thresholdPx: config.thresholds.headerShiftPx,
      maxShift: 0,
      pass: false,
      records: [],
      skipped: false,
      error: null,
      skipReason: null,
      conclusion: 'fail',
      retry: {
        maxAttempts: headerStabilityMaxAttempts,
        attemptCount: 0,
        retried: false,
      },
      attemptLogs: [],
    }
    try {
      headerStability = await runHeaderStabilityCheckWithRetry(baseUrl, config.thresholds.headerShiftPx)
      headerStability = {
        ...headerStability,
        skipped: false,
        error: null,
        skipReason: null,
      }
      headerStability.conclusion = resolveHeaderStabilityConclusion(headerStability)
      if (!headerStability.pass) {
        console.error(
          `[visual-parity][block] header stability exceeded threshold: maxShift=${headerStability.maxShift.toFixed(3)} threshold=${headerStability.thresholdPx}`,
        )
      }
    } catch (error) {
      const errorMessage = String(error)
      const skipReason = resolveHeaderStabilitySkipReason(errorMessage)
      if (skipReason) {
        headerStability = {
          thresholdPx: config.thresholds.headerShiftPx,
          maxShift: 0,
          pass: true,
          records: [],
          skipped: true,
          error: errorMessage,
          skipReason,
          retry: {
            maxAttempts: headerStabilityMaxAttempts,
            attemptCount: 1,
            retried: false,
          },
          attemptLogs: error?.attemptLogs || [],
        }
        warnings.push(`header-stability skipped via allowlist match "${skipReason}"`)
        console.warn(`[visual-parity][warn] header stability skipped via allowlist "${skipReason}": ${errorMessage}`)
      } else {
        headerStability = {
          thresholdPx: config.thresholds.headerShiftPx,
          maxShift: 0,
          pass: false,
          records: [],
          skipped: false,
          error: errorMessage,
          skipReason: null,
          retry: {
            maxAttempts: headerStabilityMaxAttempts,
            attemptCount: Math.max(1, error?.attemptLogs?.length || 0),
            retried: (error?.attemptLogs?.length || 0) > 1,
          },
          attemptLogs: error?.attemptLogs || [],
        }
        console.error(`[visual-parity][block] header stability failed: ${errorMessage}`)
      }
      headerStability.conclusion = resolveHeaderStabilityConclusion(headerStability)
    }
    const failedCases = results.filter((entry) => !entry.pass).length
    const shellAssertionCoverage = summarizeShellAssertionCoverage(results)
    const attributionCheckResult = shouldRequireExpectedAttribution
      ? (missingExpectedAttribution.length > 0 ? 'fail' : 'pass')
      : (missingExpectedAttribution.length > 0 ? 'warn' : 'pass')
    const checks = [
      {
        name: 'shell-key-areas',
        result: failedCases > 0 ? 'fail' : 'pass',
        detail: `blockingCases=${failedCases}`,
      },
      {
        name: 'header-stability',
        result: headerStability.conclusion,
        detail: `maxShift=${headerStability.maxShift.toFixed(3)} threshold=${headerStability.thresholdPx}`,
      },
      {
        name: 'expected-attribution',
        result: attributionCheckResult,
        detail: `missing=${missingExpectedAttribution.length}`,
      },
      {
        name: 'runtime-noise',
        result: warnings.length > 0 ? 'warn' : 'pass',
        detail: `warnings=${warnings.length}`,
      },
    ]
    const report = {
      mode: requestedMode,
      gateMode: 'single-site-shell-stability',
      runId,
      baseUrl,
      thresholds: {
        headerShiftPx: config.thresholds.headerShiftPx,
      },
      summary: {
        totalCases: results.length,
        failedCases,
        warningCount: warnings.length,
        missingExpectedAttribution: missingExpectedAttribution.length,
      },
      warnings,
      checks,
      headerStability,
      shellAssertionCoverage,
      results,
    }

    writeJson(path.join(runDir, 'report.json'), report)
    writeText(path.join(runDir, 'report.md'), renderMarkdownReport(report))

    if (fs.existsSync(latestDir)) {
      fs.rmSync(latestDir, { recursive: true, force: true })
    }
    copyDirectory(runDir, latestDir)

    if (failedCases > 0 || !headerStability.pass) {
      console.error('[visual-parity] failed')
      process.exitCode = 1
      return
    }

    console.log('[visual-parity] passed')
  } finally {
    if (browser) {
      await browser.close()
    }
    await closeServer(staticSite.server)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
