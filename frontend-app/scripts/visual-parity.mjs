import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, 'visual-parity.config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const cliModeArg = process.argv.find((arg) => arg.startsWith('--mode='))
const requestedMode = (process.env.VISUAL_PARITY_MODE || cliModeArg?.split('=')[1] || config.defaultMode || 'smoke').toLowerCase()
const modeConfig = config.modes?.[requestedMode]

if (!modeConfig) {
  const availableModes = Object.keys(config.modes || {})
  throw new Error(`Unknown visual parity mode "${requestedMode}". Available modes: ${availableModes.join(', ')}`)
}

const oldSiteRoot = path.resolve(__dirname, '..', '..', 'baseline-site')
const newSiteRoot = path.resolve(__dirname, '..', '.output', 'public')
const reportRoot = path.resolve(__dirname, '..', 'qa', 'visual-parity')
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const runDir = path.join(reportRoot, runId)
const latestDir = path.join(reportRoot, 'latest')

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

const keyAreas = [
  { name: 'header', selector: '.ll-header' },
  { name: 'theme-switch', selector: '[data-theme-mode-switch]' },
  { name: 'status-lamp', selector: '[data-system-status]' },
]

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sanitize(input) {
  return input.replace(/[^a-zA-Z0-9-_./]/g, '_')
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

function joinUrl(baseUrl, pathname) {
  return new URL(pathname, baseUrl).toString()
}

function pickContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return mimeTypes[ext] || 'application/octet-stream'
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
    } catch (error) {
      res.writeHead(500)
      res.end('Server Error')
    }
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      resolve({ server, port })
    })
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

function comparePngs(oldFilePath, newFilePath, diffFilePath) {
  const oldImage = PNG.sync.read(fs.readFileSync(oldFilePath))
  const newImage = PNG.sync.read(fs.readFileSync(newFilePath))

  if (oldImage.width !== newImage.width || oldImage.height !== newImage.height) {
    return {
      mismatchedPixels: Number.MAX_SAFE_INTEGER,
      mismatchRatio: 1,
      width: oldImage.width,
      height: oldImage.height,
      dimensionMismatch: true,
    }
  }

  const diffImage = new PNG({ width: oldImage.width, height: oldImage.height })
  const mismatchedPixels = pixelmatch(
    oldImage.data,
    newImage.data,
    diffImage.data,
    oldImage.width,
    oldImage.height,
    { threshold: 0.1 },
  )

  fs.writeFileSync(diffFilePath, PNG.sync.write(diffImage))

  return {
    mismatchedPixels,
    mismatchRatio: mismatchedPixels / (oldImage.width * oldImage.height),
    width: oldImage.width,
    height: oldImage.height,
    dimensionMismatch: false,
  }
}

async function applyMockRoutes(context) {
  await context.route('https://cdn.tailwindcss.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: 'window.tailwind = window.tailwind || { config: {} };',
    })
  })

  await context.route('https://fonts.googleapis.com/**', async (route) => {
    await route.abort()
  })

  await context.route('https://fonts.gstatic.com/**', async (route) => {
    await route.abort()
  })

  await context.route('**/status/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'green',
        ok: true,
        service: 'mock-backend',
        version: '1.0.0',
        reason: '后端服务可用（mock）',
      }),
    })
  })

  await context.route('**/healthz', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'green',
        ok: true,
        service: 'mock-backend',
        version: '1.0.0',
        reason: '后端服务可用（mock）',
      }),
    })
  })

  await context.route('**/home-content', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, reason: 'mock-disabled' }),
    })
  })
}

async function configureContext(context, theme) {
  await applyMockRoutes(context)
  await context.addInitScript(({ currentTheme }) => {
    localStorage.setItem('ll-color-mode-v1', currentTheme)
    localStorage.setItem('theme', currentTheme)
    localStorage.setItem('ll-font-theme', 'classic')
  }, { currentTheme: theme })
}

async function takeKeyAreaScreenshot(page, selector, outputPath) {
  const locator = page.locator(selector).first()
  if ((await locator.count()) === 0) {
    return false
  }
  try {
    await locator.scrollIntoViewIfNeeded()
    await locator.screenshot({ path: outputPath, animations: 'disabled' })
    return true
  } catch {
    return false
  }
}

async function waitForPageStable(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('[data-theme-mode-switch]', { timeout: 5000 }).catch(() => {})
  await wait(350)
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
      result[selector] = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }
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

async function runHeaderStabilityCheck(browser, baseUrl, thresholdPx) {
  const desktopViewport = { width: 1440, height: 900 }
  const selectors = [
    '.ll-header',
    '.ll-brand',
    '.ll-nav',
    '[data-theme-mode-switch]',
    '[data-system-status]',
  ]
  const navigationSequence = [
    { label: 'Projects', to: '/projects/index.html' },
    { label: 'Journal', to: '/journal/index.html' },
    { label: 'About', to: '/about/index.html' },
    { label: 'Get in touch', to: '/contact/index.html' },
  ]

  const context = await browser.newContext({ viewport: desktopViewport, colorScheme: 'light' })
  await configureContext(context, 'light')
  const page = await context.newPage()
  await page.goto(joinUrl(baseUrl, '/index.html'))
  await waitForPageStable(page)

  const baselineRects = await collectNodeRects(page, selectors)
  let maxShift = 0
  const records = []

  for (const item of navigationSequence) {
    if (item.label === 'Get in touch') {
      await page.locator('.ll-header .ll-cta').click()
    } else {
      await page.locator('.ll-header .ll-nav-link', { hasText: item.label }).first().click()
    }
    await page.waitForURL(`**${item.to}`)
    await waitForPageStable(page)
    const nextRects = await collectNodeRects(page, selectors)
    const shift = calculateMaxShift(baselineRects, nextRects)
    records.push({ step: item.to, shift })
    if (shift > maxShift) {
      maxShift = shift
    }
  }

  await page.locator('.ll-header .ll-brand').click()
  await page.waitForURL('**/index.html')
  await waitForPageStable(page)
  const homeRects = await collectNodeRects(page, selectors)
  const homeShift = calculateMaxShift(baselineRects, homeRects)
  records.push({ step: '/index.html', shift: homeShift })
  if (homeShift > maxShift) {
    maxShift = homeShift
  }

  await context.close()

  return {
    thresholdPx,
    maxShift,
    pass: maxShift <= thresholdPx,
    records,
  }
}

function renderMarkdownReport(report) {
  const lines = []
  lines.push('# Visual Parity Report')
  lines.push('')
  lines.push(`- Mode: \`${report.mode}\``)
  lines.push(`- Run ID: \`${report.runId}\``)
  lines.push(`- Old Site: \`${report.oldBaseUrl}\``)
  lines.push(`- New Site: \`${report.newBaseUrl}\``)
  lines.push(`- Total Cases: \`${report.summary.totalCases}\``)
  lines.push(`- Failed Cases: \`${report.summary.failedCases}\``)
  lines.push(`- Full Page Threshold: \`${report.thresholds.fullPageMismatchRatio}\``)
  lines.push(`- Key Area Threshold: \`${report.thresholds.keyAreaMismatchRatio}\``)
  lines.push('')
  lines.push('## Header Stability')
  lines.push('')
  lines.push(`- Max Shift: \`${report.headerStability.maxShift.toFixed(3)}px\``)
  lines.push(`- Threshold: \`${report.headerStability.thresholdPx}px\``)
  lines.push(`- Pass: \`${report.headerStability.pass}\``)
  lines.push('')
  lines.push('## Failing Cases')
  lines.push('')

  const failedCases = report.results.filter((item) => !item.pass)
  if (failedCases.length === 0) {
    lines.push('- None')
  } else {
    for (const entry of failedCases) {
      lines.push(`- ${entry.caseId}: full=${entry.full.mismatchRatio.toFixed(4)} pass=${entry.pass}`)
      for (const keyArea of entry.keyAreas) {
        const skipFlag = keyArea.skipped ? ' skipped=true' : ''
        lines.push(
          `  - ${keyArea.name}: exists=${keyArea.exists}${skipFlag} ratio=${keyArea.mismatchRatio.toFixed(4)} pass=${keyArea.pass}`,
        )
      }
    }
  }

  lines.push('')
  lines.push('## Files')
  lines.push('')
  lines.push(`- JSON: \`report.json\``)
  lines.push(`- Images: \`old/\`, \`new/\`, \`diff/\``)
  return lines.join('\n')
}

async function main() {
  const selectedViewports = pickByName(config.viewports, modeConfig.viewports, 'viewport')
  const selectedThemes = modeConfig.themes === 'all' ? config.themes : modeConfig.themes || []
  const selectedPages = pickByName(config.pages, modeConfig.pages, 'page')

  if (selectedThemes.length === 0) {
    throw new Error(`Mode "${requestedMode}" has no themes configured`)
  }
  for (const theme of selectedThemes) {
    if (!config.themes.includes(theme)) {
      throw new Error(`Unknown theme "${theme}" in mode "${requestedMode}"`)
    }
  }

  ensureDir(runDir)
  ensureDir(path.join(runDir, 'old'))
  ensureDir(path.join(runDir, 'new'))
  ensureDir(path.join(runDir, 'diff'))

  const oldSite = await createStaticServerWithFallback(oldSiteRoot, config.ports.oldSite)
  const newSite = await createStaticServerWithFallback(newSiteRoot, config.ports.newSite)

  const oldBaseUrl = `http://127.0.0.1:${oldSite.port}`
  const newBaseUrl = `http://127.0.0.1:${newSite.port}`

  console.log(`[visual] mode=${requestedMode} pages=${selectedPages.length} viewports=${selectedViewports.length} themes=${selectedThemes.length}`)
  console.log(`[visual] oldBase=${oldBaseUrl} newBase=${newBaseUrl}`)

  let browser
  try {
    try {
      browser = await chromium.launch({ headless: true, channel: 'msedge' })
    } catch {
      browser = await chromium.launch({ headless: true })
    }

    const results = []

    for (const viewport of selectedViewports) {
      for (const theme of selectedThemes) {
        const contextOptions = {
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: theme === 'dark' ? 'dark' : 'light',
        }
        const oldContext = await browser.newContext(contextOptions)
        const newContext = await browser.newContext(contextOptions)
        oldContext.setDefaultNavigationTimeout(20000)
        newContext.setDefaultNavigationTimeout(20000)
        await configureContext(oldContext, theme)
        await configureContext(newContext, theme)
        const oldPage = await oldContext.newPage()
        const newPage = await newContext.newPage()

        for (const pageConfig of selectedPages) {
          const caseId = `${pageConfig.name}__${viewport.name}__${theme}`
          const relativeDir = sanitize(`${viewport.name}/${theme}/${pageConfig.name}`)
          const oldPath = pageConfig.oldPath || pageConfig.path
          const newPath = pageConfig.newPath || pageConfig.path

          console.log(`[visual] start ${caseId}`)

          try {
            await Promise.all([
              oldPage.goto(joinUrl(oldBaseUrl, oldPath), {
                waitUntil: 'domcontentloaded',
                timeout: 10000,
              }),
              newPage.goto(joinUrl(newBaseUrl, newPath), {
                waitUntil: 'domcontentloaded',
                timeout: 10000,
              }),
            ])
            await Promise.all([waitForPageStable(oldPage), waitForPageStable(newPage)])
          } catch (error) {
            results.push({
              caseId,
              page: pageConfig.name,
              oldPath,
              newPath,
              viewport: viewport.name,
              theme,
              pass: false,
              error: String(error),
              full: {
                mismatchRatio: 1,
                threshold: config.thresholds.fullPageMismatchRatio,
              },
              keyAreas: [],
            })
            console.log(`[visual] ${caseId} navigation failed`)
            continue
          }

          const oldFullPath = path.join(runDir, 'old', `${relativeDir}__full.png`)
          const newFullPath = path.join(runDir, 'new', `${relativeDir}__full.png`)
          const diffFullPath = path.join(runDir, 'diff', `${relativeDir}__full.png`)
          ensureDir(path.dirname(oldFullPath))
          ensureDir(path.dirname(newFullPath))
          ensureDir(path.dirname(diffFullPath))

          await oldPage.screenshot({ path: oldFullPath, fullPage: true, animations: 'disabled' })
          await newPage.screenshot({ path: newFullPath, fullPage: true, animations: 'disabled' })

          const fullCompare = comparePngs(oldFullPath, newFullPath, diffFullPath)
          const fullPass = fullCompare.mismatchRatio <= config.thresholds.fullPageMismatchRatio

          const areaSelectors = [
            ...keyAreas,
            { name: 'hero', selector: pageConfig.heroSelector },
            { name: 'content', selector: pageConfig.contentSelector },
          ]

          const keyAreaResults = []
          for (const area of areaSelectors) {
            const oldAreaPath = path.join(runDir, 'old', `${relativeDir}__${area.name}.png`)
            const newAreaPath = path.join(runDir, 'new', `${relativeDir}__${area.name}.png`)
            const diffAreaPath = path.join(runDir, 'diff', `${relativeDir}__${area.name}.png`)
            const oldExists = await takeKeyAreaScreenshot(oldPage, area.selector, oldAreaPath)
            const newExists = await takeKeyAreaScreenshot(newPage, area.selector, newAreaPath)

            if (!oldExists && !newExists) {
              keyAreaResults.push({
                name: area.name,
                selector: area.selector,
                exists: false,
                symmetricMissing: true,
                skipped: true,
                mismatchRatio: 0,
                pass: true,
              })
              continue
            }

            if (!oldExists || !newExists) {
              keyAreaResults.push({
                name: area.name,
                selector: area.selector,
                exists: false,
                symmetricMissing: false,
                skipped: false,
                mismatchRatio: 1,
                pass: false,
              })
              continue
            }

            ensureDir(path.dirname(diffAreaPath))
            const compareResult = comparePngs(oldAreaPath, newAreaPath, diffAreaPath)
            keyAreaResults.push({
              name: area.name,
              selector: area.selector,
              exists: true,
              symmetricMissing: false,
              skipped: false,
              mismatchRatio: compareResult.mismatchRatio,
              pass: compareResult.mismatchRatio <= config.thresholds.keyAreaMismatchRatio,
            })
          }

          const casePass = fullPass && keyAreaResults.every((item) => item.pass)
          results.push({
            caseId,
            page: pageConfig.name,
            oldPath,
            newPath,
            viewport: viewport.name,
            theme,
            pass: casePass,
            full: {
              mismatchRatio: fullCompare.mismatchRatio,
              threshold: config.thresholds.fullPageMismatchRatio,
            },
            keyAreas: keyAreaResults,
          })

          console.log(
            `[visual] ${caseId} full=${fullCompare.mismatchRatio.toFixed(4)} pass=${casePass ? 'yes' : 'no'}`,
          )
        }

        await oldContext.close()
        await newContext.close()
      }
    }

    const headerStability = await runHeaderStabilityCheck(
      browser,
      newBaseUrl,
      config.thresholds.headerShiftPx,
    )
    console.log(
      `[stability] maxShift=${headerStability.maxShift.toFixed(3)}px pass=${headerStability.pass ? 'yes' : 'no'}`,
    )

    const failedCases = results.filter((item) => !item.pass).length
    const report = {
      mode: requestedMode,
      runId,
      oldBaseUrl,
      newBaseUrl,
      thresholds: {
        fullPageMismatchRatio: config.thresholds.fullPageMismatchRatio,
        keyAreaMismatchRatio: config.thresholds.keyAreaMismatchRatio,
        headerShiftPx: config.thresholds.headerShiftPx,
      },
      summary: {
        totalCases: results.length,
        failedCases,
      },
      headerStability,
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
    await closeServer(oldSite.server)
    await closeServer(newSite.server)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
