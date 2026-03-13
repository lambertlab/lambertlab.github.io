export function ContactPage() {
  return (
    <div className="wrap">
      <main id="main-content">
        <section className="hero">
          <p className="kicker">Contact</p>
          <h1>欢迎交流</h1>
          <p>如果你正在建设数据基础设施、产品化 AI 工具，或以协作为核心的工程流程，欢迎附上背景信息发来简短消息。</p>
        </section>

        <section className="grid" aria-label="联系渠道">
          <article className="card span-2">
            <p className="mini">Primary</p>
            <h3>GitHub</h3>
            <p>查看项目、仓库和最近更新。</p>
            <div className="actions">
              <a className="btn primary" href="https://github.com/lambertlab" target="_blank" rel="noreferrer">
                打开 GitHub
              </a>
            </div>
          </article>

          <article className="card span-2">
            <p className="mini">Email</p>
            <h3>邮箱</h3>
            <p>适合项目合作、技术咨询和长期协作沟通。</p>
            <div className="actions">
              <a className="btn primary" href="mailto:you@example.com">
                发送邮件
              </a>
            </div>
          </article>

          <article className="card span-2">
            <p className="mini">Back</p>
            <h3>返回首页</h3>
            <p>继续浏览首页中的项目与洞察。</p>
            <div className="actions">
              <a className="btn" href="/index.html">
                回到首页
              </a>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
