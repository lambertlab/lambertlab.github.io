export function AboutPage() {
  return (
    <main id="main-content">
      <section className="hero">
        <p className="kicker">About LambertLab</p>
        <h1>用系统思维，把复杂问题拆成可交付的工程路径。</h1>
        <p>
          我是 Lambert，关注数据工作流、工程协作效率和 AI 在真实团队中的可用性。这个页面是我的工作方式说明书，也是合作前你可以快速判断“我们是否同频”的入口。
        </p>
      </section>

      <section className="about-grid" aria-label="About details">
        <article className="panel">
          <h2>What I Focus On</h2>
          <p>核心方向是“可验证的工程实践”：不仅能做出来，还要可复盘、可维护、可持续迭代。</p>
          <p>在项目里我更偏向搭建稳定闭环，包括需求澄清、结构设计、实现策略、验证机制和持续优化。</p>
          <div className="actions">
            <a className="btn" href="/projects/">
              View Projects
            </a>
            <a className="btn" href="/journal/index.html">
              Read Journal
            </a>
          </div>
        </article>

        <aside className="panel">
          <h2>How I Work</h2>
          <ul className="point-list">
            <li>
              <strong>Model-first</strong>
              先定义边界和模型，再做实现，降低后期返工。
            </li>
            <li>
              <strong>Evidence-driven</strong>
              用可验证结果推进决策，而不是凭感觉争论。
            </li>
            <li>
              <strong>Long-term Rhythm</strong>
              用节奏管理和文档沉淀，确保长期可交付。
            </li>
          </ul>
          <div className="actions">
            <a className="btn primary" href="/contact/index.html">
              Get in touch
            </a>
            <a className="btn" href="/index.html">
              Back Home
            </a>
          </div>
        </aside>
      </section>
    </main>
  )
}
