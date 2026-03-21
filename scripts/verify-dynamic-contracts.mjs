import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { createGateCollector } from './gate-layering.mjs'

const outputRoot = path.resolve('.output/public')
const preferredPort = 4202

const homeRoutes = { canonical: '/', legacyHtml: '/index.html' }
const projectsCatalogRoutes = { canonical: '/projects/', legacyHtml: '/projects/index.html' }
const projectDetailRoutes = { canonical: '/projects/personal-toolbox/', legacyHtml: '/projects/personal-toolbox/index.html' }

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

function createMockHomeLifeCards() {
  return [
    {
      accent: 'Reading',
      title: 'Database Life Card',
      description: 'Loaded from the live /home-content contract.',
      href: '/journal/',
      external: false,
    },
    {
      accent: 'Routine',
      title: 'Live Habit Review',
      description: 'The homepage life panel now renders database-backed cards only.',
      href: '',
      external: false,
    },
  ]
}

function createMockProjects() {
  return [
    {
      slug: 'personal-toolbox',
      canonical_path: '/projects/personal-toolbox/',
      name: 'Personal Toolbox',
      summary: 'A compact personal tooling workspace for recurring execution loops.',
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
      slug: 'ai-message-value-triage',
      canonical_path: '/projects/ai-message-value-triage/',
      name: 'AI Message Value Triage',
      summary: 'Evaluate message quality with reusable triage heuristics.',
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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeAdminLinkValue(value) {
  if (typeof value !== 'string') {
    return null
  }

  const text = value.trim()
  return text || null
}

function createMockAdminRepositories() {
  return [
    {
      id: 'repo-1',
      repo_full_name: 'lambertlab/personal-toolbox',
      repo_owner: 'lambertlab',
      repo_name: 'personal-toolbox',
      repo_url: 'https://github.com/lambertlab/personal-toolbox',
      github_username: 'lambertlab',
      description: 'A compact personal tooling workspace for recurring execution loops.',
      language: 'TypeScript',
      stargazers_count: 42,
      forks_count: 7,
      open_issues_count: 1,
      visibility: 'public',
      archived: false,
      fork: false,
      source: 'github',
      is_active: true,
      mapped_projects_count: 1,
      pushed_at: '2026-03-12T00:00:00Z',
      repo_created_at: '2026-01-01T00:00:00Z',
      repo_updated_at: '2026-03-12T00:00:00Z',
      synced_at: '2026-03-12T00:00:00Z',
      updated_at: '2026-03-12T00:00:00Z',
    },
  ]
}

function createAdminLinkedRepository(repository, options = {}) {
  return {
    id: options.id || `binding-${repository.id}`,
    repo_full_name: repository.repo_full_name,
    repo_name: repository.repo_name,
    repo_url: repository.repo_url,
    visibility: repository.visibility,
    is_primary: options.is_primary === true,
    source: options.source || repository.source || 'manual',
    description: repository.description || '',
    language: repository.language || '',
    stargazers_count: repository.stargazers_count || 0,
    forks_count: repository.forks_count || 0,
  }
}

function getAdminPrimaryRepository(project) {
  return project.repositories.find((repository) => repository.is_primary) || null
}

function resolveAdminProjectSourceRefs(project) {
  const primaryRepository = getAdminPrimaryRepository(project)
  return {
    repo_full_name: primaryRepository?.repo_full_name || null,
    repo_url: primaryRepository?.repo_url || null,
    visibility: primaryRepository?.visibility || null,
  }
}

function resolveAdminProjectLinks(project) {
  const primaryRepository = getAdminPrimaryRepository(project)
  const primaryRepoUrl = String(primaryRepository?.repo_url || '').trim()
  const storedLinks = {
    primary: normalizeAdminLinkValue(project.stored_links?.primary),
    repo: normalizeAdminLinkValue(project.stored_links?.repo),
    demo: normalizeAdminLinkValue(project.stored_links?.demo),
    docs: normalizeAdminLinkValue(project.stored_links?.docs),
    notes: normalizeAdminLinkValue(project.stored_links?.notes),
  }

  return {
    primary: storedLinks.primary || primaryRepoUrl || `/projects/${encodeURIComponent(project.slug)}/`,
    repo: storedLinks.repo || primaryRepoUrl || null,
    demo: storedLinks.demo,
    docs: storedLinks.docs,
    notes: storedLinks.notes,
  }
}

function serializeAdminProject(project) {
  const payload = cloneJson(project)
  payload.links = resolveAdminProjectLinks(project)
  payload.stored_links = {
    primary: normalizeAdminLinkValue(project.stored_links?.primary),
    repo: normalizeAdminLinkValue(project.stored_links?.repo),
    demo: normalizeAdminLinkValue(project.stored_links?.demo),
    docs: normalizeAdminLinkValue(project.stored_links?.docs),
    notes: normalizeAdminLinkValue(project.stored_links?.notes),
  }
  payload.source_refs = resolveAdminProjectSourceRefs(project)
  return payload
}

function serializeAdminProjects(admin) {
  return admin.projects.map((project) => serializeAdminProject(project))
}

function createMockAdminProjects(repositories) {
  const primaryRepository = repositories[0]
  return [
    {
      id: 'project-1',
      slug: 'personal-toolbox',
      name: 'Personal Toolbox',
      summary: 'A compact personal tooling workspace for recurring execution loops.',
      overview: 'This project consolidates helpers, repeatable commands, and lightweight automation.',
      status_note: 'Actively iterating.',
      stage: 'active',
      project_type: 'tooling',
      visibility: 'public',
      is_featured: true,
      featured_rank: 1,
      sort_order: 1,
      stored_links: {
        primary: null,
        repo: null,
        demo: null,
        docs: null,
        notes: null,
      },
      source_refs: {
        repo_full_name: primaryRepository.repo_full_name,
        repo_url: primaryRepository.repo_url,
        visibility: primaryRepository.visibility,
      },
      repositories: [createAdminLinkedRepository(primaryRepository, { id: 'binding-1', is_primary: true })],
      synced_at: '2026-03-12T00:00:00Z',
      updated_at: '2026-03-12T00:00:00Z',
    },
  ]
}

function createMockAdminState() {
  const repositories = createMockAdminRepositories()
  const projects = createMockAdminProjects(repositories)
  return {
    token: 'test-admin-token',
    repositories,
    projects,
    syncJobs: [],
    logs: [],
    lastLinksPayload: null,
    lastSyncJobPayload: null,
  }
}

function createAdminSyncJobRecord({ jobId, mode, projectId = null, githubUsername = null, result, state = 'success' }) {
  const timestamp = '2026-03-21T00:00:00Z'
  const normalizedResult = cloneJson(result || null)

  return {
    job_id: String(jobId),
    mode,
    project_id: projectId,
    github_username: githubUsername,
    state,
    retry_of_job_id: null,
    created_at: timestamp,
    updated_at: timestamp,
    started_at: timestamp,
    finished_at: timestamp,
    result: normalizedResult,
    error_code: null,
    error_message: null,
    error_details: null,
    error: {
      code: null,
      message: null,
      details: null,
    },
    steps: [
      {
        step: 'queued',
        status: 'pending',
        message: 'Sync job queued.',
        details: null,
        created_at: timestamp,
      },
      {
        step: 'run_completed',
        status: state,
        message: 'Sync job completed.',
        details: null,
        created_at: timestamp,
      },
    ],
  }
}

function appendAdminSyncJob(admin, input) {
  const nextJobId = String(700 + admin.syncJobs.length + 1)
  let job

  if (input?.mode === 'project') {
    const projectId = String(input.project_id || '')
    job = createAdminSyncJobRecord({
      jobId: nextJobId,
      mode: 'project',
      projectId,
      result: {
        project_id: projectId,
        synced: 1,
        failed: 0,
        synced_at: '2026-03-21T00:00:00Z',
      },
    })
  } else {
    job = createAdminSyncJobRecord({
      jobId: nextJobId,
      mode: 'github_user',
      githubUsername: String(input?.github_username || 'lambertlab').trim().toLowerCase() || 'lambertlab',
      result: {
        fetched: 1,
        created: 1,
        updated: 0,
        deactivated: 0,
        synced: 1,
        synced_at: '2026-03-21T00:00:00Z',
      },
    })
  }

  admin.syncJobs = [job, ...admin.syncJobs]
  admin.lastSyncJobPayload = cloneJson(input || null)
  return job
}

function parseJsonBody(request) {
  const body = request.postData() || ''
  if (!body) {
    return null
  }

  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

function findAdminProject(admin, projectId) {
  return admin.projects.find((project) => project.id === projectId) || null
}

function createAdminError(status, code, message) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      detail: {
        code,
        message,
      },
    }),
  }
}

function mergeAdminProjectPatch(project, patch) {
  const fields = [
    'name',
    'summary',
    'overview',
    'status_note',
    'stage',
    'project_type',
    'visibility',
    'is_featured',
    'featured_rank',
    'sort_order',
  ]

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      project[field] = patch[field]
    }
  }

  project.updated_at = '2026-03-21T00:00:00Z'
}

function replaceAdminProjectRepositoriesInState(admin, project, bindings) {
  const nextRepositories = bindings.map((binding, index) => {
    const matched = admin.repositories.find((repository) => repository.repo_full_name === binding.repo_full_name)
    const fallback = {
      id: `mock-${binding.repo_full_name}`,
      repo_full_name: binding.repo_full_name,
      repo_name: binding.repo_full_name.split('/').pop() || binding.repo_full_name,
      repo_url: binding.repo_url,
      visibility: 'public',
      source: binding.source || 'manual',
      description: '',
      language: '',
      stargazers_count: 0,
      forks_count: 0,
    }
    return createAdminLinkedRepository(matched || fallback, {
      id: `binding-${project.id}-${index + 1}`,
      is_primary: binding.is_primary === true,
      source: binding.source || matched?.source || 'manual',
    })
  })

  project.repositories = nextRepositories
  project.source_refs = resolveAdminProjectSourceRefs(project)
  project.updated_at = '2026-03-21T00:00:00Z'
}

function replaceAdminProjectLinksInState(admin, project, links) {
  project.stored_links = {
    primary: normalizeAdminLinkValue(links?.primary),
    repo: normalizeAdminLinkValue(links?.repo),
    demo: normalizeAdminLinkValue(links?.demo),
    docs: normalizeAdminLinkValue(links?.docs),
    notes: normalizeAdminLinkValue(links?.notes),
  }
  project.updated_at = '2026-03-21T00:00:00Z'
  admin.lastLinksPayload = cloneJson(project.stored_links)
}
async function installRoutes(context, state) {
  const projects = createMockProjects()
  const admin = state.admin || createMockAdminState()

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

    if (pathname.startsWith('/admin')) {
      if (state.delayMs > 0) {
        await wait(state.delayMs)
      }

      const token = request.headers()['x-admin-token'] || ''
      const requireAuthorized = pathname !== '/admin/auth/verify'
      if (requireAuthorized && token !== admin.token) {
        await route.fulfill(createAdminError(401, 'unauthorized', 'unauthorized'))
        return
      }

      if (pathname === '/admin/auth/verify') {
        if (token !== admin.token) {
          await route.fulfill(createAdminError(401, 'unauthorized', 'unauthorized'))
          return
        }

        await route.fulfill({ status: 204, body: '' })
        return
      }

      if (pathname === '/admin/projects' && request.method() === 'GET') {
        const list = serializeAdminProjects(admin)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            projects: list,
            total: list.length,
            page: 1,
            page_size: list.length || 1,
          }),
        })
        return
      }

      if (pathname === '/admin/repositories' && request.method() === 'GET') {
        const repositories = cloneJson(admin.repositories)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            repositories,
            total: repositories.length,
            page: 1,
            page_size: repositories.length || 1,
          }),
        })
        return
      }

      const detailMatch = pathname.match(/^\/admin\/projects\/([^/]+)$/)
      if (detailMatch) {
        const project = findAdminProject(admin, detailMatch[1])
        if (!project) {
          await route.fulfill(createAdminError(404, 'project_not_found', 'Project not found.'))
          return
        }

        if (request.method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ project: serializeAdminProject(project) }),
          })
          return
        }

        if (request.method() === 'PATCH') {
          const body = parseJsonBody(request) || {}
          mergeAdminProjectPatch(project, body)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ project: serializeAdminProject(project) }),
          })
          return
        }
      }

      const repositoriesMatch = pathname.match(/^\/admin\/projects\/([^/]+)\/repositories$/)
      if (repositoriesMatch && request.method() === 'PUT') {
        const project = findAdminProject(admin, repositoriesMatch[1])
        if (!project) {
          await route.fulfill(createAdminError(404, 'project_not_found', 'Project not found.'))
          return
        }

        const body = parseJsonBody(request) || {}
        const bindings = Array.isArray(body.repositories) ? body.repositories : []
        replaceAdminProjectRepositoriesInState(admin, project, bindings)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ project: serializeAdminProject(project) }),
        })
        return
      }

      const linksMatch = pathname.match(/^\/admin\/projects\/([^/]+)\/links$/)
      if (linksMatch && request.method() === 'PUT') {
        const project = findAdminProject(admin, linksMatch[1])
        if (!project) {
          await route.fulfill(createAdminError(404, 'project_not_found', 'Project not found.'))
          return
        }

        const body = parseJsonBody(request) || {}
        replaceAdminProjectLinksInState(admin, project, body.links || {})
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ project: serializeAdminProject(project) }),
        })
        return
      }

      if (pathname === '/admin/logs' && request.method() === 'GET') {
        const logs = cloneJson(admin.logs)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            logs,
            total: logs.length,
            page: 1,
            page_size: logs.length || 1,
          }),
        })
        return
      }

      if (pathname === '/admin/sync/jobs' && request.method() === 'GET') {
        const jobs = cloneJson(admin.syncJobs)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            jobs,
            total: jobs.length,
            page: 1,
            page_size: jobs.length || 1,
          }),
        })
        return
      }

      if (pathname === '/admin/sync/jobs' && request.method() === 'POST') {
        const body = parseJsonBody(request) || {}
        const createdJob = appendAdminSyncJob(admin, body)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            job_id: createdJob.job_id,
            state: createdJob.state,
            created_at: createdJob.created_at,
            job: createdJob,
          }),
        })
        return
      }

      const syncJobDetailMatch = pathname.match(/^\/admin\/sync\/jobs\/([^/]+)$/)
      if (syncJobDetailMatch && request.method() === 'GET') {
        const job = admin.syncJobs.find((entry) => entry.job_id === syncJobDetailMatch[1]) || null
        if (!job) {
          await route.fulfill(createAdminError(404, 'sync_job_not_found', 'Sync job not found.'))
          return
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            job,
          }),
        })
        return
      }
    }

    if (pathname === '/home-content') {
      if (state.homeContentMode === 'error') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'home-content unavailable' }),
        })
        return
      }

      const lifeCards = state.homeContentMode === 'empty' ? [] : createMockHomeLifeCards()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          source: 'database',
          fetched_at: '2026-03-12T00:00:00Z',
          technology: [],
          life: lifeCards,
        }),
      })
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

    if (state.detailMode === 'degraded') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          project: {
            ...project,
            summary: '',
            overview: '',
            status_note: null,
            highlights: [],
            links: {
              primary: null,
              repo: null,
              demo: null,
              docs: null,
              notes: null,
            },
          },
        }),
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

async function testHomeFeaturedCanonicalContracts(browser, baseUrl) {
  const context = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    delayMs: 500,
  })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}${homeRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-home-featured-slot="0"][aria-busy="true"]', { timeout: 5000 })
    await page.waitForSelector('[data-home-featured-slot="0"][data-featured-state="ready"]', { timeout: 5000 })

    const title = (await page.locator('[data-home-featured-slot="0"] [data-project-name]').textContent())?.trim() || ''
    ensure(title.length > 0 && !/loading/i.test(title), 'home featured slot did not reach ready state')
  } finally {
    await context.close()
  }
}
async function testHomeLifeCardsDatabaseContracts(browser, baseUrl) {
  const successContext = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    homeContentMode: 'success',
    delayMs: 500,
  })

  try {
    const page = await successContext.newPage()
    await page.goto(`${baseUrl}${homeRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-home-life-slot="0"][aria-busy="true"]', { timeout: 5000 })
    await page.waitForSelector('[data-home-life-slot="0"][data-life-state="ready"]', { timeout: 5000 })

    const title = (await page.locator('[data-home-life-slot="0"] [data-life-card-title]').textContent())?.trim() || ''
    ensure(title === 'Database Life Card', `home life panel did not render database content, got ${title}`)

    const legacyCardCount = await page.locator('text=Atomic Habits').count()
    ensure(legacyCardCount === 0, 'home life panel still renders legacy static cards')
  } finally {
    await successContext.close()
  }

  const emptyContext = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    homeContentMode: 'empty',
    delayMs: 0,
  })

  try {
    const page = await emptyContext.newPage()
    await page.goto(`${baseUrl}${homeRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-home-life-slot="0"][data-life-state="empty"]', { timeout: 8000 })
  } finally {
    await emptyContext.close()
  }

  const errorState = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    homeContentMode: 'error',
    delayMs: 0,
  }
  const errorContext = await newContext(browser, errorState)

  try {
    const page = await errorContext.newPage()
    await page.goto(`${baseUrl}${homeRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-home-life-slot="0"][data-life-state="error"]', { timeout: 8000 })

    errorState.homeContentMode = 'success'
    await page.locator('#retry-home-life').click()
    await page.waitForSelector('[data-home-life-slot="0"][data-life-state="ready"]', { timeout: 8000 })
  } finally {
    await errorContext.close()
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

async function ensureProjectsCatalogReady(page) {
  await page.waitForSelector('[data-project-catalog]', { timeout: 8000 })
}

async function testHomeLegacyHtmlRedirect(browser, baseUrl) {
  const context = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    homeContentMode: 'success',
    delayMs: 0,
  })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}${homeRoutes.legacyHtml}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction((expectedPath) => window.location.pathname === expectedPath, homeRoutes.canonical, { timeout: 8000 })
    await page.waitForSelector('[data-home-featured-projects]', { timeout: 8000 })
  } finally {
    await context.close()
  }
}

async function testProjectsListCanonicalStatesWithLegacyHtmlRedirect(browser, baseUrl) {

  const state = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    delayMs: 700,
  }
  const context = await newContext(browser, state)

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}${projectsCatalogRoutes.canonical}?q=toolbox&stage=active&source=github&type=tooling&featured=1&sort=name`, {
      waitUntil: 'domcontentloaded',
    })
    await ensureProjectsCatalogReady(page)

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

    ensure(filters.pathname === projectsCatalogRoutes.canonical, `projects list should stay on canonical path, got ${filters.pathname}`)
    ensure(filters.q === 'toolbox', 'projects list URL replay did not restore query')
    ensure(filters.stage === 'active', 'projects list URL replay did not restore stage')
    ensure(filters.source === 'github', 'projects list URL replay did not restore source')
    ensure(filters.type === 'tooling', 'projects list URL replay did not restore type')
    ensure(filters.featured === true, 'projects list URL replay did not restore featured filter')

    const canonicalTitle = (await page.locator('.project-card .project-name').first().textContent())?.trim() || ''
    ensure(canonicalTitle.length > 0, 'projects list did not render card content')

    await page.goto(`${baseUrl}${projectsCatalogRoutes.legacyHtml}?q=toolbox`, { waitUntil: 'domcontentloaded' })
    await ensureProjectsCatalogReady(page)
    await page.waitForFunction((expectedPath) => window.location.pathname === expectedPath, projectsCatalogRoutes.canonical, { timeout: 8000 })
    await page.waitForSelector('[data-project-grid]:not([hidden]) .project-card', { timeout: 8000 })

    const replayTitle = (await page.locator('.project-card .project-name').first().textContent())?.trim() || ''
    ensure(
      replayTitle === canonicalTitle,
      `${projectsCatalogRoutes.legacyHtml} did not replay same catalog rendering as ${projectsCatalogRoutes.canonical}`,
    )
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
  })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/projects/`, { waitUntil: 'domcontentloaded' })
    await ensureProjectsCatalogReady(page)
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
  }
  const context = await newContext(browser, state)

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/projects/`, { waitUntil: 'domcontentloaded' })
    await ensureProjectsCatalogReady(page)
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

async function testProjectDetailCanonicalStatesWithLegacyHtmlRedirect(browser, baseUrl) {
  const successState = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    delayMs: 700,
  }
  const context = await newContext(browser, successState)

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}${projectDetailRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-loading', { timeout: 5000 })
    await page.waitForSelector('.project-detail-layout', { timeout: 10000 })

    const canonicalTitle = (await page.locator('.project-detail-hero h1').textContent())?.trim() || ''
    ensure(canonicalTitle.length > 0, 'project detail did not render ready state')

    await page.goto(`${baseUrl}${projectDetailRoutes.legacyHtml}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction((expectedPath) => window.location.pathname === expectedPath, projectDetailRoutes.canonical, { timeout: 8000 })
    await page.waitForSelector('.project-detail-layout', { timeout: 8000 })
    const replayTitle = (await page.locator('.project-detail-hero h1').textContent())?.trim() || ''
    ensure(
      replayTitle === canonicalTitle,
      `${projectDetailRoutes.legacyHtml} did not replay same rendering as canonical path ${projectDetailRoutes.canonical}`,
    )
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
    await page.goto(`${baseUrl}${projectDetailRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-message', { timeout: 8000 })
  } finally {
    await notFoundContext.close()
  }

  const degradedContext = await newContext(browser, {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'degraded',
    delayMs: 0,
  })
  try {
    const page = await degradedContext.newPage()
    await page.goto(`${baseUrl}${projectDetailRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-degraded[data-detail-state="degraded"]', { timeout: 8000 })
    await page.waitForSelector('.project-detail-layout', { timeout: 8000 })

    const degradedItems = await page.locator('.project-detail-degraded-list li').count()
    ensure(degradedItems > 0, 'project detail degraded mode did not show missing field hints')
  } finally {
    await degradedContext.close()
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
    await page.goto(`${baseUrl}${projectDetailRoutes.canonical}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.project-detail-message button.project-detail-button.primary', { timeout: 8000 })

    errorState.detailMode = 'success'
    await page.locator('.project-detail-message button.project-detail-button.primary').click()
    await page.waitForSelector('.project-detail-layout', { timeout: 8000 })
  } finally {
    await errorContext.close()
  }
}
async function readAdminLinksDebugState(page) {
  return await page.evaluate(() => {
    const readInputByLabel = (labelText) => {
      const labels = Array.from(document.querySelectorAll('label'))
      const label = labels.find((node) => node.textContent?.includes(labelText))
      const input = label?.querySelector('input')
      return input instanceof HTMLInputElement ? input.value.trim() : ''
    }

    const cards = Array.from(document.querySelectorAll('.admin-project-link-semantics')).map((node) => ({
      title: node.querySelector('.admin-project-link-semantics__title')?.textContent?.trim() || '',
      badge: node.querySelector('.admin-project-link-semantics__badge')?.textContent?.trim() || '',
      href: node.querySelector('.admin-project-link-semantics__url a')?.getAttribute('href') || '',
      message: node.querySelector('.admin-field-note')?.textContent?.trim() || '',
    }))

    return {
      pathname: window.location.pathname,
      primaryInput: readInputByLabel('Primary Link'),
      repoInput: readInputByLabel('Repo Link'),
      demoInput: readInputByLabel('Demo Link'),
      docsInput: readInputByLabel('Docs Link'),
      notesInput: readInputByLabel('Notes Link'),
      primaryPreview: cards.find((card) => card.title.includes('Primary')) || null,
      repoPreview: cards.find((card) => card.title.includes('Repo')) || null,
      saveFeedback: document.querySelector('.admin-project-modal__footer-feedback')?.textContent?.trim() || '',
    }
  })
}

function findAdminLinksField(page, labelText) {
  return page.locator('.admin-project-links-editor__field').filter({ hasText: labelText }).first()
}

async function testAdminProjectsLinksEditorSmoke(browser, baseUrl) {
  const state = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    homeContentMode: 'success',
    delayMs: 0,
    admin: createMockAdminState(),
  }
  const context = await newContext(browser, state)
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value)
  }, { key: 'll-admin-token-v1', value: state.admin.token })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/admin/projects/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.admin-project-list-item', { timeout: 8000 })
    await page.locator('.admin-project-list-item__actions .admin-secondary-button').nth(1).click()
    await page.waitForSelector('.admin-project-links-editor', { timeout: 8000 })

    const customPrimary = 'https://example.com/admin/custom-primary'
    const customRepo = 'https://example.com/admin/custom-repo'
    const customDemo = 'https://example.com/admin/custom-demo'
    const customDocs = 'https://example.com/admin/custom-docs'
    const customNotes = 'https://example.com/admin/custom-notes'
    const fallbackRepoUrl = state.admin.repositories[0].repo_url

    await findAdminLinksField(page, 'Primary Link').locator('input').fill(customPrimary)
    await findAdminLinksField(page, 'Repo Link').locator('input').fill(customRepo)
    await findAdminLinksField(page, 'Demo Link').locator('input').fill(customDemo)
    await findAdminLinksField(page, 'Docs Link').locator('input').fill(customDocs)
    await findAdminLinksField(page, 'Notes Link').locator('input').fill(customNotes)

    await page.waitForFunction(({ expectedPrimary, expectedRepo }) => {
      const cards = Array.from(document.querySelectorAll('.admin-project-link-semantics'))
      const primaryCard = cards.find((node) => node.textContent?.includes('Primary'))
      const repoCard = cards.find((node) => node.textContent?.includes('Repo'))
      const primaryHref = primaryCard?.querySelector('.admin-project-link-semantics__url a')?.getAttribute('href') || ''
      const repoHref = repoCard?.querySelector('.admin-project-link-semantics__url a')?.getAttribute('href') || ''
      return primaryHref === expectedPrimary && repoHref === expectedRepo
    }, { expectedPrimary: customPrimary, expectedRepo: customRepo }, { timeout: 8000 })

    await page.locator('form.admin-project-modal__content button[type="submit"]').click()
    await page.waitForFunction(() => {
      const text = document.querySelector('.admin-project-modal__footer-feedback')?.textContent || ''
      return text.includes('Saved') || text.includes('保存成功') || text.includes('保存成功。')
    }, null, { timeout: 8000 })

    ensure(state.admin.lastLinksPayload?.primary === customPrimary, `admin links payload primary mismatch: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.repo === customRepo, `admin links payload repo mismatch: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.demo === customDemo, `admin links payload demo mismatch: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.docs === customDocs, `admin links payload docs mismatch: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.notes === customNotes, `admin links payload notes mismatch: ${JSON.stringify(state.admin.lastLinksPayload)}`)

    const savedDebug = await readAdminLinksDebugState(page)
    ensure(savedDebug.primaryPreview?.href === customPrimary, `admin primary preview did not persist explicit value: ${JSON.stringify(savedDebug)}`)
    ensure(savedDebug.repoPreview?.href === customRepo, `admin repo preview did not persist explicit value: ${JSON.stringify(savedDebug)}`)
    ensure(savedDebug.demoInput === customDemo, `admin demo input did not persist after save: ${JSON.stringify(savedDebug)}`)
    ensure(savedDebug.docsInput === customDocs, `admin docs input did not persist after save: ${JSON.stringify(savedDebug)}`)
    ensure(savedDebug.notesInput === customNotes, `admin notes input did not persist after save: ${JSON.stringify(savedDebug)}`)

    await findAdminLinksField(page, 'Primary Link').getByRole('button').click()
    await findAdminLinksField(page, 'Repo Link').getByRole('button').click()

    await page.waitForFunction((expectedRepo) => {
      const cards = Array.from(document.querySelectorAll('.admin-project-link-semantics'))
      const primaryCard = cards.find((node) => node.textContent?.includes('Primary'))
      const repoCard = cards.find((node) => node.textContent?.includes('Repo'))
      const primaryHref = primaryCard?.querySelector('.admin-project-link-semantics__url a')?.getAttribute('href') || ''
      const repoHref = repoCard?.querySelector('.admin-project-link-semantics__url a')?.getAttribute('href') || ''
      return primaryHref === expectedRepo && repoHref === expectedRepo
    }, fallbackRepoUrl, { timeout: 8000 })

    await page.locator('form.admin-project-modal__content button[type="submit"]').click()
    await page.waitForFunction(() => {
      const text = document.querySelector('.admin-project-modal__footer-feedback')?.textContent || ''
      return text.includes('Saved') || text.includes('保存成功') || text.includes('保存成功。')
    }, null, { timeout: 8000 })

    ensure(state.admin.lastLinksPayload?.primary === null, `admin links payload primary should clear to null: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.repo === null, `admin links payload repo should clear to null: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.demo === customDemo, `admin links payload demo should remain explicit: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.docs === customDocs, `admin links payload docs should remain explicit: ${JSON.stringify(state.admin.lastLinksPayload)}`)
    ensure(state.admin.lastLinksPayload?.notes === customNotes, `admin links payload notes should remain explicit: ${JSON.stringify(state.admin.lastLinksPayload)}`)

    const fallbackDebug = await readAdminLinksDebugState(page)
    ensure(fallbackDebug.primaryPreview?.href === fallbackRepoUrl, `admin primary preview did not fall back to primary repository: ${JSON.stringify(fallbackDebug)}`)
    ensure(fallbackDebug.repoPreview?.href === fallbackRepoUrl, `admin repo preview did not fall back to primary repository: ${JSON.stringify(fallbackDebug)}`)
    ensure(/Primary-derived|主仓派生/.test(fallbackDebug.primaryPreview?.badge || ''), `admin primary badge did not show primary-derived fallback: ${JSON.stringify(fallbackDebug)}`)
    ensure(/Primary-derived|主仓派生/.test(fallbackDebug.repoPreview?.badge || ''), `admin repo badge did not show primary-derived fallback: ${JSON.stringify(fallbackDebug)}`)
  } finally {
    await context.close()
  }
}

async function readAdminSyncDebugState(page) {
  return await page.evaluate(() => ({
    feedback: document.querySelector('.admin-surface-feedback .admin-feedback')?.textContent?.trim() || '',
    summaries: Array.from(document.querySelectorAll('[data-admin-sync-summary]')).map((node) => node.textContent?.trim() || ''),
  }))
}

async function testAdminProjectSyncJobEntrySmoke(browser, baseUrl) {
  const state = {
    featuredMode: 'success',
    listMode: 'success',
    detailMode: 'success',
    homeContentMode: 'success',
    delayMs: 0,
    admin: createMockAdminState(),
  }
  const context = await newContext(browser, state)
  await context.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value)
  }, { key: 'll-admin-token-v1', value: state.admin.token })

  try {
    const page = await context.newPage()
    await page.goto(`${baseUrl}/admin/projects/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.admin-project-list-item', { timeout: 8000 })
    await page.locator('[data-admin-project-sync-button]').first().click()

    await page.waitForFunction(() => {
      const text = document.querySelector('.admin-surface-feedback .admin-feedback')?.textContent || ''
      return /任务 #|job #/i.test(text)
    }, null, { timeout: 8000 })

    ensure(state.admin.lastSyncJobPayload?.mode === 'project', `project sync should use job mode=project: ${JSON.stringify(state.admin.lastSyncJobPayload)}`)
    ensure(state.admin.lastSyncJobPayload?.project_id === 'project-1', `project sync payload should carry selected project_id: ${JSON.stringify(state.admin.lastSyncJobPayload)}`)

    const projectDebug = await readAdminSyncDebugState(page)
    ensure(/同步=1|Synced=1/.test(projectDebug.feedback), `project sync feedback should include synced count: ${JSON.stringify(projectDebug)}`)
    ensure(/失败=0|Failed=0/.test(projectDebug.feedback), `project sync feedback should include failed count: ${JSON.stringify(projectDebug)}`)

    await page.locator('a[href="/admin/logs"]').first().click()
    await page.waitForFunction(() => window.location.pathname === '/admin/logs', null, { timeout: 8000 })
    await page.waitForSelector('[data-admin-sync-summary]', { timeout: 8000 })

    const logsDebug = await readAdminSyncDebugState(page)
    ensure(
      logsDebug.summaries.some((text) => /同步=1|Synced=1/.test(text) && /失败=0|Failed=0/.test(text)),
      `logs sync summary should render project-mode result: ${JSON.stringify(logsDebug)}`,
    )
  } finally {
    await context.close()
  }
}

async function main() {
  if (!fs.existsSync(outputRoot)) {
    throw new Error('Missing ".output/public". Run `npm run build` first.')
  }

  const gate = createGateCollector('verify-dynamic-contracts')
  const serverInfo = await createStaticServerWithFallback(outputRoot, preferredPort)
  const baseUrl = `http://127.0.0.1:${serverInfo.port}`

  let browser
  const checks = [
    { name: 'home-featured-canonical-contracts', run: () => testHomeFeaturedCanonicalContracts(browser, baseUrl) },
    { name: 'home-legacy-index-html-redirect', run: () => testHomeLegacyHtmlRedirect(browser, baseUrl) },
    { name: 'home-life-database-contracts', run: () => testHomeLifeCardsDatabaseContracts(browser, baseUrl) },
    { name: 'projects-list-canonical-states-with-legacy-html-redirect', run: () => testProjectsListCanonicalStatesWithLegacyHtmlRedirect(browser, baseUrl) },
    { name: 'projects-list-empty-state', run: () => testProjectsListEmptyState(browser, baseUrl) },
    { name: 'projects-list-error-retry', run: () => testProjectsListErrorRetry(browser, baseUrl) },
    { name: 'admin-projects-links-editor-smoke', run: () => testAdminProjectsLinksEditorSmoke(browser, baseUrl) },
    { name: 'admin-project-sync-job-entry-smoke', run: () => testAdminProjectSyncJobEntrySmoke(browser, baseUrl) },
    { name: 'project-detail-canonical-states-with-legacy-html-redirect', run: () => testProjectDetailCanonicalStatesWithLegacyHtmlRedirect(browser, baseUrl) },
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
        gate.addInfo({
          code: 'dynamic.check-pass',
          message: `Check passed: ${check.name}`,
          location: check.name,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failures.push({ name: check.name, message })
        console.error(`[l3] fail ${check.name}: ${message}`)
        gate.addBlocking({
          code: 'dynamic.check-failed',
          message,
          location: check.name,
        })
      }
    }
  } finally {
    if (browser) {
      await browser.close()
    }
    await closeServer(serverInfo.server)
  }

  gate.addInfo({
    code: 'dynamic.check-summary',
    message: `Executed ${checks.length} dynamic contract checks.`,
  })
  gate.printSummary()

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
