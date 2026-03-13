import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '~/components/content/ContactPage'
import { buildContentPageHead } from '~/lib/contentPageHead'
import { legacyPageMetadata } from '~/lib/siteCopy'

export const Route = createFileRoute('/contact/index.html')({
  head: () => buildContentPageHead(legacyPageMetadata.contact, ['/css/bento-pages.css', '/css/page-contact.css']),
  component: ContactHtmlPage,
})

function ContactHtmlPage() {
  return <ContactPage />
}
