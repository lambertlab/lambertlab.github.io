import type { JournalIndexContentModel } from '~/content/contentModels'
import { pickLocalizedText, useUiLocale } from '~/lib/uiLocale'

interface JournalIndexPageProps {
  content: JournalIndexContentModel
}

export function JournalIndexPage({ content }: JournalIndexPageProps) {
  const { locale } = useUiLocale()
  const [mainStory, ...secondaryStories] = content.article.featured

  return (
    <main id="main-content">
      <section className="hero">
        <p className="kicker">{pickLocalizedText(content.page.kicker, locale)}</p>
        <h1>{pickLocalizedText(content.page.title, locale)}</h1>
        <p>{pickLocalizedText(content.page.summary, locale)}</p>
      </section>

      <section className="journal-grid" aria-label={locale === 'zh-CN' ? '日志内容' : 'Journal content'}>
        <section className="panel panel-tech">
          <header className="panel-head">
            <div>
              <p className="kicker">{locale === 'zh-CN' ? '精选' : 'Featured'}</p>
              <h2>{locale === 'zh-CN' ? '主线文章' : 'Main Story'}</h2>
            </div>
            <span className="panel-icon" aria-hidden="true">
              ◧
            </span>
          </header>

          <a className="story-card" href={mainStory.href}>
            <p className="kicker">{pickLocalizedText(mainStory.kicker, locale)}</p>
            <h3>{pickLocalizedText(mainStory.title, locale)}</h3>
            <p>{pickLocalizedText(mainStory.summary, locale)}</p>
          </a>

          <div className="story-row">
            {secondaryStories.map((entry) => (
              <a key={entry.href} className="story-card" href={entry.href}>
                <p className="kicker">{pickLocalizedText(entry.kicker, locale)}</p>
                <h3>{pickLocalizedText(entry.title, locale)}</h3>
                <p>{pickLocalizedText(entry.summary, locale)}</p>
              </a>
            ))}
          </div>
        </section>

        <aside className="panel panel-life">
          <header className="panel-head">
            <div>
              <p className="kicker">{locale === 'zh-CN' ? '阅读队列' : 'Reading Queue'}</p>
              <h2>{locale === 'zh-CN' ? '快速浏览' : 'Quick Picks'}</h2>
            </div>
            <span className="panel-icon" aria-hidden="true">
              ◎
            </span>
          </header>

          <ul className="note-list">
            {content.article.quickPicks.map((entry) => (
              <li key={entry.href}>
                <a href={entry.href}>
                  <strong>{pickLocalizedText(entry.title, locale)}</strong>
                  <span>{pickLocalizedText(entry.date, locale)}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="tags" aria-label={locale === 'zh-CN' ? '主题标签' : 'Topics'}>
            {content.article.tags.map((tag) => (
              <span key={tag.en} className="tag">
                {pickLocalizedText(tag, locale)}
              </span>
            ))}
          </div>

          {content.cta.subscribe.visible ? (
            <a className="journal-foot" href={content.cta.subscribe.href}>
              {pickLocalizedText(content.cta.subscribe.label, locale)}
            </a>
          ) : null}
        </aside>
      </section>

      <section className="archive-row" aria-label={locale === 'zh-CN' ? '日志归档' : 'Journal archives'}>
        {content.article.archive.map((entry) => (
          <a key={entry.href} className="archive-chip" href={entry.href}>
            <span className="kicker">{pickLocalizedText(entry.kicker, locale)}</span>
            <strong>{pickLocalizedText(entry.title, locale)}</strong>
          </a>
        ))}
      </section>
    </main>
  )
}
