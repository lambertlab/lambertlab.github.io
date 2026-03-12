import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

const prerenderPages = [
  '/',
  '/index.html',
  '/about/',
  '/about/index.html',
  '/contact/',
  '/contact/index.html',
  '/projects/',
  '/projects/index.html',
  '/projects/personal-toolbox/',
  '/projects/personal-toolbox/index.html',
  '/projects/ai-message-value-triage/',
  '/projects/ai-message-value-triage/index.html',
  '/projects/personal-website/',
  '/projects/personal-website/index.html',
  '/journal/',
  '/journal/index.html',
  '/status/',
  '/status/index.html',
  '/journal/model-first-engineering/',
  '/journal/model-first-engineering/index.html',
  '/journal/ai-collaboration-checklist/',
  '/journal/ai-collaboration-checklist/index.html',
  '/journal/operational-habits-that-stick/',
  '/journal/operational-habits-that-stick/index.html',
]

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      srcDirectory: 'src',
      pages: prerenderPages.map((path) => ({ path })),
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
      },
    }),
    viteReact(),
    nitro(),
  ],
})
