import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '~/components/content/AboutPage'
import { aboutPageContentModel, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/about/')({
  head: () => buildContentPageHead(toContentPageMetadata(aboutPageContentModel), ['/css/page-about.css']),
  component: AboutRoutePage,
})

function AboutRoutePage() {
  return <AboutPage content={aboutPageContentModel} />
}
