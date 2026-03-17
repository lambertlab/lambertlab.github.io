import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '~/components/content/ContactPage'
import { PublicCompatRouteAdapter } from '~/components/content/PublicCompatRouteAdapter'
import { contactPageContentModel, toContentPageMetadata } from '~/content/contentModels'
import { buildContentPageHead } from '~/lib/contentPageHead'

export const Route = createFileRoute('/contact/index.html')({
  head: () => buildContentPageHead(toContentPageMetadata(contactPageContentModel), ['/css/bento-pages.css', '/css/page-contact.css']),
  component: ContactHtmlPage,
})

function ContactHtmlPage() {
  return (
    <PublicCompatRouteAdapter>
      <ContactPage content={contactPageContentModel} />
    </PublicCompatRouteAdapter>
  )
}
