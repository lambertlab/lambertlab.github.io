import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '~/components/home/HomePage'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { buildHomePageHead } from '~/components/home/homePageHead'

export const Route = createFileRoute('/index.html')({
  head: () => buildHomePageHead(),
  component: HomeHtmlPage,
})

function HomeHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <HomePage />
    </PublicCompatRouteAdapter>
  )
}
