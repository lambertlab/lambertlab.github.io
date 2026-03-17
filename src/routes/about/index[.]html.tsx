import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '~/components/content/AboutPage'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { aboutPageContentModel, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/about/index.html')({
  head: () => buildContentPageHead(toContentPageMetadata(aboutPageContentModel), ['/css/page-about.css']),
  component: AboutHtmlPage,
})

function AboutHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <AboutPage content={aboutPageContentModel} />
    </PublicCompatRouteAdapter>
  )
}
