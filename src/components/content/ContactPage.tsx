import type { ContactPageContentModel } from '~/content/contentModels'
import { pickLocalizedText, useUiLocale } from '~/lib/uiLocale'

interface ContactPageProps {
  content: ContactPageContentModel
}

export function ContactPage({ content }: ContactPageProps) {
  const { locale } = useUiLocale()

  return (
    <div className="wrap">
      <main id="main-content">
        <section className="hero">
          <p className="kicker">{pickLocalizedText(content.page.kicker, locale)}</p>
          <h1>{pickLocalizedText(content.page.title, locale)}</h1>
          <p>{pickLocalizedText(content.page.summary, locale)}</p>
        </section>

        <section className="grid" aria-label={locale === 'zh-CN' ? '联系渠道' : 'Contact channels'}>
          {content.article.cards.map((card) => {
            const target = card.cta.href
            const externalTarget = target.startsWith('http')
            return (
              <article key={target} className="card span-2">
                <p className="mini">{pickLocalizedText(card.kicker, locale)}</p>
                <h3>{pickLocalizedText(card.title, locale)}</h3>
                <p>{pickLocalizedText(card.summary, locale)}</p>
                <div className="actions">
                  {card.cta.visible ? (
                    <a
                      className={card.cta.tone === 'primary' ? 'btn primary' : 'btn'}
                      href={target}
                      target={externalTarget ? '_blank' : undefined}
                      rel={externalTarget ? 'noreferrer' : undefined}
                    >
                      {pickLocalizedText(card.cta.label, locale)}
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
