const featuredEntries = [
  {
    href: '/journal/model-first-engineering/',
    kicker: '2026.03 / Model-first',
    title: '面向数据工作流的模型先行工程方法',
    summary: '先定义模型与边界，再推进实现，降低系统复杂度与回归风险。把建模变成可协作、可验证、可迭代的团队工作。',
  },
  {
    href: '/journal/ai-collaboration-checklist/',
    kicker: '2026.02 / AI Review',
    title: '代码评审中的 AI 协作实用清单',
    summary: '清晰分工、证据化评审、减少“看起来正确”的风险。',
  },
  {
    href: '/journal/operational-habits-that-stick/',
    kicker: '2026.01 / Operations',
    title: '让团队持续交付的运营习惯',
    summary: '把偶发高产变为稳定产能，建立长期可执行节奏。',
  },
] as const

const quickPicks = [
  {
    href: '/journal/model-first-engineering/',
    title: '模型先行工程方法',
    date: '2026.03',
  },
  {
    href: '/journal/ai-collaboration-checklist/',
    title: 'AI 协作评审清单',
    date: '2026.02',
  },
  {
    href: '/journal/operational-habits-that-stick/',
    title: '持续交付运营习惯',
    date: '2026.01',
  },
] as const

const archiveEntries = [
  {
    href: '/journal/model-first-engineering/',
    kicker: 'Method',
    title: 'Model-first Engineering',
  },
  {
    href: '/journal/ai-collaboration-checklist/',
    kicker: 'Practice',
    title: 'AI Collaboration Checklist',
  },
  {
    href: '/journal/operational-habits-that-stick/',
    kicker: 'Operations',
    title: 'Operational Habits That Stick',
  },
] as const

const tags = ['model-first', 'ai-collaboration', 'delivery', 'engineering-notes'] as const

export function JournalIndexPage() {
  const [mainStory, ...secondaryStories] = featuredEntries

  return (
    <main id="main-content">
      <section className="hero">
        <p className="kicker">Journal / Field Notes</p>
        <h1>写作与洞察，服务于可复用的工程实践。</h1>
        <p>
          这里记录 LambertLab 的方法论演化过程，关注模型先行工程、AI 协作机制与长期交付习惯。风格沿用首页语言，但内容组织更偏阅读体验。
        </p>
      </section>

      <section className="journal-grid" aria-label="Journal content">
        <section className="panel panel-tech">
          <header className="panel-head">
            <div>
              <p className="kicker">Featured</p>
              <h2>Main Story</h2>
            </div>
            <span className="panel-icon" aria-hidden="true">
              ◧
            </span>
          </header>

          <a className="story-card" href={mainStory.href}>
            <p className="kicker">{mainStory.kicker}</p>
            <h3>{mainStory.title}</h3>
            <p>{mainStory.summary}</p>
          </a>

          <div className="story-row">
            {secondaryStories.map((entry) => (
              <a key={entry.href} className="story-card" href={entry.href}>
                <p className="kicker">{entry.kicker}</p>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
              </a>
            ))}
          </div>
        </section>

        <aside className="panel panel-life">
          <header className="panel-head">
            <div>
              <p className="kicker">Reading Queue</p>
              <h2>Quick Picks</h2>
            </div>
            <span className="panel-icon" aria-hidden="true">
              ◎
            </span>
          </header>

          <ul className="note-list">
            {quickPicks.map((entry) => (
              <li key={entry.href}>
                <a href={entry.href}>
                  <strong>{entry.title}</strong>
                  <span>{entry.date}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="tags" aria-label="topics">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>

          <a className="journal-foot" href="/contact/index.html">
            订阅更新与协作交流 →
          </a>
        </aside>
      </section>

      <section className="archive-row" aria-label="Journal archives">
        {archiveEntries.map((entry) => (
          <a key={entry.href} className="archive-chip" href={entry.href}>
            <span className="kicker">{entry.kicker}</span>
            <strong>{entry.title}</strong>
          </a>
        ))}
      </section>
    </main>
  )
}
