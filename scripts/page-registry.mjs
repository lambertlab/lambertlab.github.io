export const pageRegistry = [
  {
    id: 'home',
    canonicalPath: '/',
    prerenderPath: '/',
    outputFile: 'index.html',
  },
  {
    id: 'about',
    canonicalPath: '/about/',
    prerenderPath: '/about/',
    outputFile: 'about/index.html',
  },
  {
    id: 'contact',
    canonicalPath: '/contact/',
    prerenderPath: '/contact/',
    outputFile: 'contact/index.html',
  },
  {
    id: 'admin-root',
    canonicalPath: '/admin/',
    prerenderPath: '/admin/',
    outputFile: 'admin/index.html',
  },
  {
    id: 'admin-projects',
    canonicalPath: '/admin/projects/',
    prerenderPath: '/admin/projects/',
    outputFile: 'admin/projects/index.html',
  },
  {
    id: 'projects-catalog',
    canonicalPath: '/projects/',
    prerenderPath: '/projects/',
    outputFile: 'projects/index.html',
  },
  {
    id: 'project-personal-toolbox',
    canonicalPath: '/projects/personal-toolbox/',
    prerenderPath: '/projects/personal-toolbox/',
    outputFile: 'projects/personal-toolbox/index.html',
  },
  {
    id: 'project-ai-message-value-triage',
    canonicalPath: '/projects/ai-message-value-triage/',
    prerenderPath: '/projects/ai-message-value-triage/',
    outputFile: 'projects/ai-message-value-triage/index.html',
  },
  {
    id: 'project-personal-website',
    canonicalPath: '/projects/personal-website/',
    prerenderPath: '/projects/personal-website/',
    outputFile: 'projects/personal-website/index.html',
  },
  {
    id: 'journal',
    canonicalPath: '/journal/',
    prerenderPath: '/journal/',
    outputFile: 'journal/index.html',
  },
  {
    id: 'status',
    canonicalPath: '/status/',
    prerenderPath: '/status/',
    outputFile: 'status/index.html',
  },
  {
    id: 'journal-model-first-engineering',
    canonicalPath: '/journal/model-first-engineering/',
    prerenderPath: '/journal/model-first-engineering/',
    outputFile: 'journal/model-first-engineering/index.html',
  },
  {
    id: 'journal-ai-collaboration-checklist',
    canonicalPath: '/journal/ai-collaboration-checklist/',
    prerenderPath: '/journal/ai-collaboration-checklist/',
    outputFile: 'journal/ai-collaboration-checklist/index.html',
  },
  {
    id: 'journal-operational-habits-that-stick',
    canonicalPath: '/journal/operational-habits-that-stick/',
    prerenderPath: '/journal/operational-habits-that-stick/',
    outputFile: 'journal/operational-habits-that-stick/index.html',
  },
]

export const prerenderRoutePaths = pageRegistry.map((entry) => entry.prerenderPath)

export const prerenderOutputFiles = pageRegistry.map((entry) => entry.outputFile)
