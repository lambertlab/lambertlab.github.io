import { createFileRoute } from '@tanstack/react-router'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { HomePage } from '~/components/home/HomePage'
import { buildHomePageHead } from '~/components/home/homePageHead'
import { preloadHomePageData } from '~/lib/pageDataCache'

export const Route = createFileRoute('/index.html')({
  head: () => buildHomePageHead(),
  loader: () => preloadHomePageData(),
  component: HomeHtmlPage,
})

function HomeHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <HomePage />
    </PublicCompatRouteAdapter>
  )
}
