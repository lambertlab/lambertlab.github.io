export interface JournalDetailAction {
  href: string
  label: string
  tone?: 'primary'
}

export interface JournalDetailEntry {
  kicker: string
  title: string
  summary: string
  articleHeading: string
  paragraphs: string[]
  actions: JournalDetailAction[]
}

interface JournalDetailTemplateProps {
  entry: JournalDetailEntry
}

export function JournalDetailTemplate({ entry }: JournalDetailTemplateProps) {
  return (
    <div className="wrap">
      <main id="main-content">
        <section className="hero">
          <p className="kicker">{entry.kicker}</p>
          <h1>{entry.title}</h1>
          <p>{entry.summary}</p>
        </section>

        <article className="article">
          <h2>{entry.articleHeading}</h2>
          {entry.paragraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
          ))}
          <div className="actions">
            {entry.actions.map((action) => (
              <a key={action.href} className={action.tone === 'primary' ? 'btn primary' : 'btn'} href={action.href}>
                {action.label}
              </a>
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}
