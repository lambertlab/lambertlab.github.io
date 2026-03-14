import type { AboutPageContentModel } from '~/content/contentModels'
import { pickLocalizedText, useUiLocale } from '~/lib/uiLocale'

interface AboutPageProps {
  content: AboutPageContentModel
}

export function AboutPage({ content }: AboutPageProps) {
  const { locale } = useUiLocale()

  return (
    <main id="main-content">
      <section className="hero">
        <p className="kicker">{pickLocalizedText(content.page.kicker, locale)}</p>
        <h1>{pickLocalizedText(content.page.title, locale)}</h1>
        <p>{pickLocalizedText(content.page.summary, locale)}</p>
      </section>

      <section className="about-grid" aria-label={locale === 'zh-CN' ? '关于详情' : 'About details'}>
        <article className="panel">
          <h2>{pickLocalizedText(content.article.focus.title, locale)}</h2>
          <p>{pickLocalizedText(content.article.focus.summary, locale)}</p>
          {content.article.focus.paragraphs.map((paragraph, index) => (
            <p key={`focus-${index}`}>{pickLocalizedText(paragraph, locale)}</p>
          ))}
          <div className="actions">
            {content.cta.focus
              .filter((cta) => cta.visible)
              .map((cta) => (
                <a key={cta.href} className={cta.tone === 'primary' ? 'btn primary' : 'btn'} href={cta.href}>
                  {pickLocalizedText(cta.label, locale)}
                </a>
              ))}
          </div>
        </article>

        <aside className="panel">
          <h2>{pickLocalizedText(content.article.workflow.title, locale)}</h2>
          <ul className="point-list">
            {content.article.workflow.items.map((item) => (
              <li key={item.title.en}>
                <strong>{pickLocalizedText(item.title, locale)}</strong>
                {pickLocalizedText(item.description, locale)}
              </li>
            ))}
          </ul>
          <div className="actions">
            {content.cta.workflow
              .filter((cta) => cta.visible)
              .map((cta) => (
                <a key={cta.href} className={cta.tone === 'primary' ? 'btn primary' : 'btn'} href={cta.href}>
                  {pickLocalizedText(cta.label, locale)}
                </a>
              ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
