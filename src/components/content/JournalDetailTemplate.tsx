import type { JournalDetailContentModel } from '~/content/contentModels'
import { pickLocalizedText, useUiLocale } from '~/lib/uiLocale'

interface JournalDetailTemplateProps {
  content: JournalDetailContentModel
}

export function JournalDetailTemplate({ content }: JournalDetailTemplateProps) {
  const { locale } = useUiLocale()

  return (
    <div className="wrap">
      <main id="main-content">
        <section className="hero">
          <p className="kicker">{pickLocalizedText(content.page.kicker, locale)}</p>
          <h1>{pickLocalizedText(content.page.title, locale)}</h1>
          <p>{pickLocalizedText(content.page.summary, locale)}</p>
        </section>

        <article className="article">
          <h2>{pickLocalizedText(content.article.heading, locale)}</h2>
          {content.article.paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.en.slice(0, 12)}`}>{pickLocalizedText(paragraph, locale)}</p>
          ))}
          <div className="actions">
            {content.cta.actions
              .filter((action) => action.visible)
              .map((action) => (
              <a key={action.href} className={action.tone === 'primary' ? 'btn primary' : 'btn'} href={action.href}>
                {pickLocalizedText(action.label, locale)}
              </a>
              ))}
          </div>
        </article>
      </main>
    </div>
  )
}
