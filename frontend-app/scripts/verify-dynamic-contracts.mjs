import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const outputRoot = path.resolve('.output/public')
const preferredPort = 4202

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pickContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
  }

  return map[extension] || 'application/octet-stream'
}

function createStaticServer(rootDir, port) {
  const server = http.createServer((request, response) => {
    try {
      const requestPath = decodeURIComponent((request.url || '/').split('?')[0])
      const safePath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath
      let targetPath = path.resolve(rootDir, safePath)

      if (!targetPath.startsWith(path.resolve(rootDir))) {
        response.writeHead(403)
        response.end('Forbidden')
        return
      }

      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
        targetPath = path.join(targetPath, 'index.html')
      } else if (!path.extname(targetPath) && fs.existsSync(`${targetPath}.html`)) {
        targetPath = `${targetPath}.html`
      }

      if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
        response.writeHead(404)
        response.end('Not Found')
        return
      }

      response.writeHead(200, {
        'Content-Type': pickContentType(targetPath),
        'Cache-Control': 'no-store',
      })
      fs.createReadStream(targetPath).pipe(response)
    } catch {
      response.writeHead(500)
      response.end('Server Error')
    }
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

async function createStaticServerWithFallback(rootDir, preferred, maxRetries = 20) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const port = preferred + attempt
    try {
      const server = await createStaticServer(rootDir, port)
      return { server, port }
    } catch (error) {
      if (error?.code !== 'EADDRINUSE' || attempt === maxRetries) {
        throw error
      }
    }
  }

  throw new Error(`Unable to bind static server from port ${preferred}`)
}

function closeServer(server) {
  return new Promise((resolve) => server.close(() => resolve()))
}

function createMockProjects() {
  return [
    {
      project_key: 'personal-toolbox',
      slug: 'personal-toolbox',
      canonical_path: '/projects/personal-toolbox/',
      name: 'Personal Toolbox',
      summary: 'A compact personal tooling workspace for recurring execution loops.',
      headline: 'A stable toolbox surface for recurring work and utilities.',
      overview: 'This project consolidates helpers, repeatable commands, and lightweight automation.',
      stage: 'active',
      source_type: 'github',
      project_type: 'tooling',
      stack: ['TypeScript', 'Node.js'],
      is_featured: true,
      featured_rank: 1,
      status_note: 'Actively iterating.',
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
      highlights: ['Shared homepage and catalog fields.', 'Detail page reads backend contract.'],
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

async function installRoutes(context, state) {
  const projects = createMockProjects()

  await context.route('https://cdn.tailwindcss.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: 'window.tailwind = window.tailwind || { config: {} };',
    })
  })

  await context.route('https://fonts.googleapis.com/**', async (route) => route.abort())
  await context.route('https://fonts.gstatic.com/**', async (route) => route.abort())

  await context.route('**/*', async (route) => {
    const request = route.request()
    const requestType = request.resourceType()
    const url = new URL(request.url())
    const pathname = url.pathname

    if (state.disableAppHydration && pathname.startsWith('/assets/') && pathname.endsWith('.js')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: '',
      })
      return
    }

    if (pathname.endsWith('/status/summary') || pathname.endsWith('/healthz')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'green',
          ok: true,
          service: 'mock-backend',
          version: '1.0.0',
          reason: 'mock',
        }),
      })
      return
    }

    if (!(requestType === 'fetch' || requestType === 'xhr')) {
      await route.continue()
      return
    }

    if (!pathname.startsWith('/projects')) {
      await route.continue()
      return
    }

    if (state.delayMs > 0) {
      await wait(state.delayMs)
    }

    if (pathname === '/projects/featured') {
      if (state.featuredMode === 'error') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'featured unavailable' }),
        })
        return
      }

      const featuredProjects = state.featuredMode === 'empty' ? [] : projects.filter((item) => item.is_featured)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          count: featuredProjects.length,
          projects: featuredProjects,
          fetched_at: '2026-03-12T00:00:00Z',
        }),
      })
      return
    }

    if (pathname === '/projects') {
      if (state.listMode === 'error') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'catalog unavailable' }),
        })
        return
      }

      const listProjects = state.listMode === 'empty' ? [] : projects
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          count: listProjects.length,
          projects: listProjects,
          fetched_at: '2026-03-12T00:00:00Z',
        }),
      })
      return
    }

    const detailSlug = pathname.replace(/^\/projects\//, '').replace(/\/+$/, '')
    if (!detailSlug) {
      await route.continue()
      return
    }

    if (state.detailMode === 'error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'detail unavailable' }),
      })
      return
    }

    const project = projects.find((item) => item.slug === detailSlug)
    if (state.detailMode === 'not-found' || !project) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Project not found.' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        project,
      }),
    })
  })
}

async function newContext(browser, state) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  })
  context.setDefaultNavigationTimeout(20000)
  context.on('page', (page) => {
    page.on('pageerror', (error) => {
      console.error(`[l3][pageerror] ${error.message}`)
    })
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`[l3][console:error] ${message.text()}`)
      }
    })
  })
  await installRoutes(context, state)
  return context
}

async function testHomeFeaturedContracts(browser, baseUrl) {
  const context = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    delayMs: 500,
  })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-home-featured-slot="0"][aria-busy="true"]', { timeout: 5000 })
    await page.waitForSelector('[data-home-featured-slot="0"][data-featured-state="ready"]', { timeout: 5000 })

    const title = (await page.locator('[data-home-featured-slot="0"] [data-project-name]').textContent())?.trim() || ''
    ensure(title.length > 0 && !/loading/i.test(title), 'home featured slot did not reach ready state')
  } finally {
    await context.close()
  }
}

async function readProjectsCatalogDebugState(page) {
  return await page.evaluate(() => {
    const readHidden = (selector) => {
      const node = document.querySelector(selector)
      if (!(node instanceof HTMLElement)) {
        return 'missing'
      }
      return node.hidden
    }

    const readText = (selector) => {
      const node = document.querySelector(selector)
      return node?.textContent?.trim() || ''
    }

    return {
      pathname: window.location.pathname,
      search: window.location.search,
      loadingHidden: readHidden('[data-loading-state]'),
      gridHidden: readHidden('[data-project-grid]'),
      emptyHidden: readHidden('[data-empty-state]'),
      errorHidden: readHidden('[data-error-state]'),
      cards: document.querySelectorAll('.project-card').length,
      hasProjectsRuntime: Boolean(window.__LL_PROJECTS_RUNTIME__),
      hasProjectsCatalogBootstrapped: Boolean(window.__LL_PROJECTS_CATALOG_BOOTSTRAPPED__),
      hasProjectsRuntimeScript: Boolean(document.querySelector('script[src="/js/projects-runtime.js"]')),
      hasProjectsCatalogScript: Boolean(document.querySelector('script[src="/js/projects-catalog.js"]')),
      hasProjectSearchInput: Boolean(document.getElementById('project-search')),
      hasSortInput: Boolean(document.getElementById('sort-by')),
      hasStageInput: Boolean(document.getElementById('stage-filter')),
      hasSourceInput: Boolean(document.getElementById('source-filter')),
      hasTypeInput: Boolean(document.getElementById('type-filter')),
      hasFeaturedInput: Boolean(document.getElementById('featured-only')),
      hasClearButton: Boolean(document.getElementById('clear-filters')),
      hasRetryButton: Boolean(document.getElementById('retry-fetch')),
      fetchStatus: readText('[data-fetch-status]'),
      resultsMeta: readText('[data-results-meta]'),
      errorDetail: readText('[data-error-detail]'),
    }
  })
}

async function ensureProjectsCatalogBootstrapped(page) {
  const bootstrapped = await page.evaluate(() => Boolean(window.__LL_PROJECTS_CATALOG_BOOTSTRAPPED__))
  if (bootstrapped) {
    return
  }

  const suffix = `l3-replay=${Date.now()}`
  await page.addScriptTag({ url: `/js/projects-runtime.js?${suffix}` }).catch(() => {})
  await page.addScriptTag({ url: `/js/projects-catalog.js?${suffix}` })
  await page.waitForTimeout(250)
}

async function testProjectsListStatesAndReplay(browser, baseUrl) {
  const state = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    delayMs: 700,
    disableAppHydration: true,
  }
  const context = await newContext(browser, state)

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/projects/?q=toolbox&stage=active&source=github&type=tooling&featured=1&sort=name`, {
      waitUntil: 'domcontentloaded',
    })
    await ensureProjectsCatalogBootstrapped(page)

    await page.waitForSelector('[data-loading-state]:not([hidden])', { timeout: 5000 })
    try {
      await page.waitForSelector('[data-project-grid]:not([hidden]) .project-card', { timeout: 10000 })
    } catch (error) {
      const debug = await readProjectsCatalogDebugState(page)
      throw new Error(`projects list did not reach ready state: ${JSON.stringify(debug)}; cause=${String(error)}`)
    }

    const filters = await page.evaluate(() => {
      const searchInput = document.getElementById('project-search')
      const stageSelect = document.getElementById('stage-filter')
      const sourceSelect = document.getElementById('source-filter')
      const typeSelect = document.getElementById('type-filter')
      const featuredOnly = document.getElementById('featured-only')

      return {
        pathname: window.location.pathname,
        q: searchInput instanceof HTMLInputElement ? searchInput.value.trim() : '',
        stage: stageSelect instanceof HTMLSelectElement ? stageSelect.value : '',
        source: sourceSelect instanceof HTMLSelectElement ? sourceSelect.value : '',
        type: typeSelect instanceof HTMLSelectElement ? typeSelect.value : '',
        featured: featuredOnly instanceof HTMLInputElement ? featuredOnly.checked : false,
      }
    })

    ensure(filters.pathname === '/projects/', `projects list should stay on canonical path, got ${filters.pathname}`)
    ensure(filters.q === 'toolbox', 'projects list URL replay did not restore query')
    ensure(filters.stage === 'active', 'projects list URL replay did not restore stage')
    ensure(filters.source === 'github', 'projects list URL replay did not restore source')
    ensure(filters.type === 'tooling', 'projects list URL replay did not restore type')
    ensure(filters.featured === true, 'projects list URL replay did not restore featured filter')

    const canonicalTitle = (await page.locator('.project-card .project-name').first().textContent())?.trim() || ''
    ensure(canonicalTitle.length > 0, 'projects list did not render card content')

    await page.goto(`${baseUrl}/projects/index.html?q=toolbox`, { waitUntil: 'domcontentloaded' })
    await ensureProjectsCatalogBootstrapped(page)
    await page.waitForFunction(() => window.location.pathname === '/projects/', { timeout: 8000 })
    await page.waitForSelector('[data-project-grid]:not([hidden]) .project-card', { timeout: 8000 })

    const replayTitle = (await page.locator('.project-card .project-name').first().textContent())?.trim() || ''
    ensure(replayTitle === canonicalTitle, '/projects/index.html did not replay same catalog rendering as /projects/')
  } finally {
    await context.close()
  }
}

async function testProjectsListEmptyState(browser, baseUrl) {
  const context = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'empty',
    detailMode: 'success',
    delayMs: 0,
    disableAppHydration: true,
  })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/projects/`, { waitUntil: 'domcontentloaded' })
    await ensureProjectsCatalogBootstrapped(page)
    try {
      await page.waitForSelector('[data-empty-state]:not([hidden])', { timeout: 8000 })
    } catch (error) {
      const debug = await readProjectsCatalogDebugState(page)
      throw new Error(`projects empty state did not render: ${JSON.stringify(debug)}; cause=${String(error)}`)
    }
  } finally {
    await context.close()
  }
}

async function testProjectsListErrorRetry(browser, baseUrl) {
  const state = {
    featuredMode: 'success',
    listMode: 'error',
    detailMode: 'success',
    delayMs: 0,
    disableAppHydration: true,
  }
  const context = await newContext(browser, state)

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/projects/`, { waitUntil: 'domcontentloaded' })
    await ensureProjectsCatalogBootstrapped(page)
    try {
      await page.waitForSelector('[data-error-state]:not([hidden])', { timeout: 8000 })
    } catch (error) {
      const debug = await readProjectsCatalogDebugState(page)
      throw new Error(`projects error state did not render: ${JSON.stringify(debug)}; cause=${String(error)}`)
    }

    state.listMode = 'success'
    await page.locator('#retry-fetch').click()
    await page.waitForSelector('[data-project-grid]:not([hidden]) .project-card', { timeout: 8000 })
  } finally {
    await context.close()
  }
}

async function testProjectDetailStatesAndReplay(browser, baseUrl) {
  const successState = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    delayMs: 700,
  }
  const context = await newContext(browser, successState)

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/projects/personal-toolbox/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-loading', { timeout: 5000 })
    await page.waitForSelector('.project-detail-layout', { timeout: 10000 })

    const canonicalTitle = (await page.locator('.project-detail-hero h1').textContent())?.trim() || ''
    ensure(canonicalTitle.length > 0, 'project detail did not render ready state')

    await page.goto(`${baseUrl}/projects/personal-toolbox/index.html`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.location.pathname === '/projects/personal-toolbox/', { timeout: 8000 })
    await page.waitForSelector('.project-detail-layout', { timeout: 8000 })
    const replayTitle = (await page.locator('.project-detail-hero h1').textContent())?.trim() || ''
    ensure(replayTitle === canonicalTitle, '/projects/$slug/index.html did not replay same rendering as canonical path')
  } finally {
    await context.close()
  }

  const notFoundContext = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'not-found',
    delayMs: 0,
  })
  try {
    const page = await notFoundContext.newPage()
    await page.goto(`${baseUrl}/projects/personal-toolbox/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-message', { timeout: 8000 })
  } finally {
    await notFoundContext.close()
  }

  const errorState = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'error',
    delayMs: 0,
  }
  const errorContext = await newContext(browser, errorState)
  try {
    const page = await errorContext.newPage()
    await page.goto(`${baseUrl}/projects/personal-toolbox/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-message button.project-detail-button.primary', { timeout: 8000 })

    errorState.detailMode = 'success'
    await page.locator('.project-detail-message button.project-detail-button.primary').click()
    await page.waitForSelector('.project-detail-layout', { timeout: 8000 })
  } finally {
    await errorContext.close()
  }
}

async function main() {
  if (!fs.existsSync(outputRoot)) {
    throw new Error('Missing ".output/public". Run `npm run build` first.')
  }

  const serverInfo = await createStaticServerWithFallback(outputRoot, preferredPort)
  const baseUrl = `http://127.0.0.1:${serverInfo.port}`

  let browser
  const checks = [
    { name: 'home-featured-contracts', run: () => testHomeFeaturedContracts(browser, baseUrl) },
    { name: 'projects-list-states-and-replay', run: () => testProjectsListStatesAndReplay(browser, baseUrl) },
    { name: 'projects-list-empty-state', run: () => testProjectsListEmptyState(browser, baseUrl) },
    { name: 'projects-list-error-retry', run: () => testProjectsListErrorRetry(browser, baseUrl) },
    { name: 'project-detail-states-and-replay', run: () => testProjectDetailStatesAndReplay(browser, baseUrl) },
  ]
  const failures = []

  try {
    try {
      browser = await chromium.launch({ headless: true, channel: 'msedge' })
    } catch {
      browser = await chromium.launch({ headless: true })
    }

    for (const check of checks) {
      try {
        await check.run()
        console.log(`[l3] pass ${check.name}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failures.push({ name: check.name, message })
        console.error(`[l3] fail ${check.name}: ${message}`)
      }
    }
  } finally {
    if (browser) {
      await browser.close()
    }
    await closeServer(serverInfo.server)
  }

  if (failures.length > 0) {
    console.error('[verify-dynamic-contracts] failed')
    for (const failure of failures) {
      console.error(`- ${failure.name}: ${failure.message}`)
    }
    process.exit(1)
  }

  console.log('[verify-dynamic-contracts] passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
