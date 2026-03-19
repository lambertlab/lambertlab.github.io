import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '~/components/home/HomePage'
import { buildHomePageHead } from '~/components/home/homePageHead'
import { preloadHomePageData } from '~/lib/pageDataCache'

export const Route = createFileRoute('/')({
  head: () => buildHomePageHead(),
  loader: () => preloadHomePageData(),
  component: HomePage,
})
