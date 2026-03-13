import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '~/components/content/AboutPage'
import { buildContentPageHead } from '~/lib/contentPageHead'
import { legacyPageMetadata } from '~/lib/siteCopy'

export const Route = createFileRoute('/about/index.html')({
  head: () => buildContentPageHead(legacyPageMetadata.about, ['/css/page-about.css']),
  component: AboutHtmlPage,
})

function AboutHtmlPage() {
  return <AboutPage />
}
