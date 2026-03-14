import type { LocalizedMetadata, LocalizedText, UiLocale } from '~/lib/uiLocale'

type ContentVisibility = 'public' | 'unlisted'

interface ContentMetaModel {
  slug: string
  updatedAt: string
  visibility: ContentVisibility
  languages: readonly UiLocale[]
}

interface ContentPageModel {
  kicker: LocalizedText
  title: LocalizedText
  subtitle: LocalizedText | null
  summary: LocalizedText
  seoDescription: LocalizedText
}

interface ContentArticleBlock {
  title: LocalizedText
  summary: LocalizedText
  paragraphs: LocalizedText[]
}

interface ContentChecklistItem {
  title: LocalizedText
  description: LocalizedText
}

interface ContentCtaModel {
  label: LocalizedText
  href: string
  visible: boolean
  tone?: 'primary'
}

interface JournalPreviewCard {
  href: string
  kicker: LocalizedText
  title: LocalizedText
  summary: LocalizedText
}

interface JournalQuickPick {
  href: string
  title: LocalizedText
  date: LocalizedText
}

interface JournalArchiveEntry {
  href: string
  kicker: LocalizedText
  title: LocalizedText
}

interface JournalDetailArticle {
  heading: LocalizedText
  paragraphs: LocalizedText[]
  tags: LocalizedText[]
}

function text(zhCN: string, en: string): LocalizedText {
  return {
    'zh-CN': zhCN,
    en,
  }
}

function assertNonEmpty(value: string, fieldPath: string) {
  if (value.trim().length === 0) {
    throw new Error(`[content-model] Required field is empty: ${fieldPath}`)
  }
}

function assertLocalizedValue(value: LocalizedText, fieldPath: string) {
  assertNonEmpty(value['zh-CN'], `${fieldPath}.zh-CN`)
  assertNonEmpty(value.en, `${fieldPath}.en`)
}

function assertCtaValue(value: ContentCtaModel, fieldPath: string) {
  assertLocalizedValue(value.label, `${fieldPath}.label`)
  assertNonEmpty(value.href, `${fieldPath}.href`)
}

interface AboutPageContentModel {
  page: ContentPageModel
  article: {
    focus: ContentArticleBlock
    workflow: {
      title: LocalizedText
      items: ContentChecklistItem[]
    }
  }
  cta: {
    focus: ContentCtaModel[]
    workflow: ContentCtaModel[]
  }
  meta: ContentMetaModel
}

export const aboutPageContentModel: AboutPageContentModel = {
  page: {
    kicker: text('关于 LambertLab', 'About LambertLab'),
    title: text('用系统思维，把复杂问题拆成可交付的工程路径。', 'Turn complexity into shippable engineering paths with systems thinking.'),
    subtitle: null,
    summary: text(
      '我是 Lambert，关注数据工作流、工程协作效率和 AI 在真实团队中的可用性。这个页面是我的工作方式说明书，也是合作前你可以快速判断“我们是否同频”的入口。',
      "I'm Lambert. I focus on data workflows, engineering collaboration efficiency, and practical AI in real teams. This page is my working style handbook and a quick way to evaluate fit before we collaborate.",
    ),
    seoDescription: text(
      '关于 LambertLab：个人背景、关注方向与工程原则。',
      'About LambertLab: background, focus areas, and engineering principles.',
    ),
  },
  article: {
    focus: {
      title: text('我关注什么', 'What I Focus On'),
      summary: text(
        '核心方向是“可验证的工程实践”：不仅能做出来，还要可复盘、可维护、可持续迭代。',
        'My core focus is verifiable engineering practice: not just shipping, but making outcomes reviewable, maintainable, and sustainable.',
      ),
      paragraphs: [
        text(
          '在项目里我更偏向搭建稳定闭环，包括需求澄清、结构设计、实现策略、验证机制和持续优化。',
          'In projects, I prioritize stable delivery loops: requirement clarity, structure design, implementation strategy, validation mechanisms, and continuous improvement.',
        ),
      ],
    },
    workflow: {
      title: text('我如何工作', 'How I Work'),
      items: [
        {
          title: text('模型先行', 'Model-first'),
          description: text('先定义边界和模型，再做实现，降低后期返工。', 'Define boundaries and models first, then implement to reduce rework later.'),
        },
        {
          title: text('证据驱动', 'Evidence-driven'),
          description: text('用可验证结果推进决策，而不是凭感觉争论。', 'Use verifiable outcomes to drive decisions instead of opinion-based debates.'),
        },
        {
          title: text('长期节奏', 'Long-term Rhythm'),
          description: text('用节奏管理和文档沉淀，确保长期可交付。', 'Build sustainable delivery through operating cadence and solid documentation.'),
        },
      ],
    },
  },
  cta: {
    focus: [
      {
        label: text('查看项目', 'View Projects'),
        href: '/projects/',
        visible: true,
      },
      {
        label: text('阅读日志', 'Read Journal'),
        href: '/journal/index.html',
        visible: true,
      },
    ],
    workflow: [
      {
        label: text('联系我', 'Get in touch'),
        href: '/contact/index.html',
        visible: true,
        tone: 'primary',
      },
      {
        label: text('返回首页', 'Back Home'),
        href: '/index.html',
        visible: true,
      },
    ],
  },
  meta: {
    slug: '/about/',
    updatedAt: '2026-03-14',
    visibility: 'public',
    languages: ['zh-CN', 'en'],
  },
}

interface ContactCardModel {
  kicker: LocalizedText
  title: LocalizedText
  summary: LocalizedText
  cta: ContentCtaModel
}

interface ContactPageContentModel {
  page: ContentPageModel
  article: {
    cards: ContactCardModel[]
  }
  cta: {
    backToHome: ContentCtaModel
  }
  meta: ContentMetaModel
}

export const contactPageContentModel: ContactPageContentModel = {
  page: {
    kicker: text('联系', 'Contact'),
    title: text('欢迎交流', "Let's connect"),
    subtitle: null,
    summary: text(
      '如果你正在建设数据基础设施、产品化 AI 工具，或以协作为核心的工程流程，欢迎附上背景信息发来简短消息。',
      'If you are building data infrastructure, productized AI tools, or collaboration-first engineering workflows, feel free to send a short message with your context.',
    ),
    seoDescription: text('LambertLab 联系方式与公开沟通入口。', 'Contact channels and public communication entry points for LambertLab.'),
  },
  article: {
    cards: [
      {
        kicker: text('主要渠道', 'Primary'),
        title: text('GitHub', 'GitHub'),
        summary: text('查看项目、仓库和最近更新。', 'Browse projects, repositories, and recent updates.'),
        cta: {
          label: text('打开 GitHub', 'Open GitHub'),
          href: 'https://github.com/lambertlab',
          visible: true,
          tone: 'primary',
        },
      },
      {
        kicker: text('邮箱', 'Email'),
        title: text('邮箱', 'Email'),
        summary: text('适合项目合作、技术咨询和长期协作沟通。', 'Best for project collaboration, technical consulting, and long-term partnership discussions.'),
        cta: {
          label: text('发送邮件', 'Send Email'),
          href: 'mailto:you@example.com',
          visible: true,
          tone: 'primary',
        },
      },
      {
        kicker: text('返回', 'Back'),
        title: text('返回首页', 'Back Home'),
        summary: text('继续浏览首页中的项目与洞察。', 'Return to the homepage to continue exploring projects and insights.'),
        cta: {
          label: text('回到首页', 'Back Home'),
          href: '/index.html',
          visible: true,
        },
      },
    ],
  },
  cta: {
    backToHome: {
      label: text('回到首页', 'Back Home'),
      href: '/index.html',
      visible: false,
    },
  },
  meta: {
    slug: '/contact/',
    updatedAt: '2026-03-14',
    visibility: 'public',
    languages: ['zh-CN', 'en'],
  },
}

interface JournalIndexContentModel {
  page: ContentPageModel
  article: {
    featured: [JournalPreviewCard, ...JournalPreviewCard[]]
    quickPicks: JournalQuickPick[]
    archive: JournalArchiveEntry[]
    tags: LocalizedText[]
  }
  cta: {
    subscribe: ContentCtaModel
  }
  meta: ContentMetaModel
}

export const journalIndexContentModel: JournalIndexContentModel = {
  page: {
    kicker: text('日志 / 现场笔记', 'Journal / Field Notes'),
    title: text('写作与洞察，服务于可复用的工程实践。', 'Writing and insights for reusable engineering practice.'),
    subtitle: null,
    summary: text(
      '这里记录 LambertLab 的方法论演化过程，关注模型先行工程、AI 协作机制与长期交付习惯。风格沿用首页语言，但内容组织更偏阅读体验。',
      'This is where LambertLab tracks method evolution across model-first engineering, AI collaboration mechanisms, and long-term delivery habits.',
    ),
    seoDescription: text('LambertLab Journal，记录工程写作与现场观察。', 'LambertLab Journal for engineering writing and field notes.'),
  },
  article: {
    featured: [
      {
        href: '/journal/model-first-engineering/',
        kicker: text('2026.03 / 模型先行', '2026.03 / Model-first'),
        title: text('面向数据工作流的模型先行工程方法', 'Model-first engineering for data workflows'),
        summary: text(
          '先定义模型与边界，再推进实现，降低系统复杂度与回归风险。把建模变成可协作、可验证、可迭代的团队工作。',
          'Define models and boundaries before implementation to reduce complexity and regression risk. Make modeling collaborative, verifiable, and iterative.',
        ),
      },
      {
        href: '/journal/ai-collaboration-checklist/',
        kicker: text('2026.02 / AI 评审', '2026.02 / AI Review'),
        title: text('代码评审中的 AI 协作实用清单', 'Practical AI collaboration checklist for code reviews'),
        summary: text(
          '清晰分工、证据化评审、减少“看起来正确”的风险。',
          'Clarify roles, require evidence-based review, and reduce the risk of answers that only look correct.',
        ),
      },
      {
        href: '/journal/operational-habits-that-stick/',
        kicker: text('2026.01 / 运营', '2026.01 / Operations'),
        title: text('让团队持续交付的运营习惯', 'Operational habits for consistent delivery'),
        summary: text(
          '把偶发高产变为稳定产能，建立长期可执行节奏。',
          'Turn occasional bursts into sustainable output by building an operating rhythm the team can keep.',
        ),
      },
    ],
    quickPicks: [
      {
        href: '/journal/model-first-engineering/',
        title: text('模型先行工程方法', 'Model-first engineering'),
        date: text('2026.03', '2026.03'),
      },
      {
        href: '/journal/ai-collaboration-checklist/',
        title: text('AI 协作评审清单', 'AI collaboration review checklist'),
        date: text('2026.02', '2026.02'),
      },
      {
        href: '/journal/operational-habits-that-stick/',
        title: text('持续交付运营习惯', 'Operational habits that stick'),
        date: text('2026.01', '2026.01'),
      },
    ],
    archive: [
      {
        href: '/journal/model-first-engineering/',
        kicker: text('方法', 'Method'),
        title: text('模型先行工程', 'Model-first Engineering'),
      },
      {
        href: '/journal/ai-collaboration-checklist/',
        kicker: text('实践', 'Practice'),
        title: text('AI 协作检查清单', 'AI Collaboration Checklist'),
      },
      {
        href: '/journal/operational-habits-that-stick/',
        kicker: text('运营', 'Operations'),
        title: text('可持续的运营习惯', 'Operational Habits That Stick'),
      },
    ],
    tags: [
      text('模型先行', 'model-first'),
      text('AI 协作', 'ai-collaboration'),
      text('持续交付', 'delivery'),
      text('工程笔记', 'engineering-notes'),
    ],
  },
  cta: {
    subscribe: {
      label: text('订阅更新与协作交流 →', 'Subscribe for updates and collaboration →'),
      href: '/contact/index.html',
      visible: true,
    },
  },
  meta: {
    slug: '/journal/',
    updatedAt: '2026-03-14',
    visibility: 'public',
    languages: ['zh-CN', 'en'],
  },
}

export type JournalDetailSlug =
  | 'model-first-engineering'
  | 'ai-collaboration-checklist'
  | 'operational-habits-that-stick'

interface JournalDetailContentModel {
  page: ContentPageModel
  article: JournalDetailArticle
  cta: {
    actions: ContentCtaModel[]
  }
  meta: ContentMetaModel
}

export const journalDetailContentBySlug: Record<JournalDetailSlug, JournalDetailContentModel> = {
  'model-first-engineering': {
    page: {
      kicker: text('洞察 · 2026.03', 'Insight · 2026.03'),
      title: text('面向数据工作流的模型先行工程方法', 'Model-first engineering for data workflows'),
      subtitle: null,
      summary: text(
        '先用模型抽象系统边界与核心流，再进入实现阶段，可显著降低复杂系统中的隐性耦合和回归风险。',
        'Abstract boundaries and core flows with models before implementation to reduce hidden coupling and regression risk in complex systems.',
      ),
      seoDescription: text('LambertLab Journal 文章：模型优先工程。', 'LambertLab Journal entry: Model-First Engineering.'),
    },
    article: {
      heading: text('核心观点', 'Core Ideas'),
      paragraphs: [
        text(
          '模型先行不是“先画图再编码”的形式主义，而是把系统行为提前结构化。通过提前定义实体关系、状态转移和失败路径，团队能在进入实现前对关键风险达成一致。',
          "Model-first is not formalism. It structures system behavior early. By defining entities, state transitions, and failure paths upfront, teams align on risks before implementation.",
        ),
        text(
          '在数据工作流场景，这种方法尤其有效。因为问题通常不在单个函数，而在多个环节叠加产生的延迟、丢失和不可追踪性。',
          'This works especially well in data workflows, where failures usually come from compounded handoff delays, losses, and poor traceability.',
        ),
        text(
          '建议将模型与测试策略一起设计，并在迭代中持续修订，让模型成为长期维护资产，而不是一次性文档。',
          'Design models alongside testing strategy and revise them in each iteration, so they become long-term maintenance assets instead of one-off documents.',
        ),
      ],
      tags: [text('模型先行', 'model-first'), text('数据工作流', 'data-workflow')],
    },
    cta: {
      actions: [
        {
          label: text('返回洞察目录', 'Back to Journal'),
          href: '/journal/index.html',
          visible: true,
        },
        {
          label: text('返回首页', 'Back Home'),
          href: '/index.html',
          visible: true,
          tone: 'primary',
        },
      ],
    },
    meta: {
      slug: '/journal/model-first-engineering/',
      updatedAt: '2026-03-01',
      visibility: 'public',
      languages: ['zh-CN', 'en'],
    },
  },
  'ai-collaboration-checklist': {
    page: {
      kicker: text('洞察 · 2026.02', 'Insight · 2026.02'),
      title: text('代码评审中的 AI 协作实用清单', 'Practical AI collaboration checklist in code review'),
      subtitle: null,
      summary: text(
        '在评审中引入 AI 时，关键不在“它能写多少代码”，而在“它输出能否被验证、解释和维护”。',
        "When introducing AI into reviews, the key isn't how much code it writes, but whether the output can be verified, explained, and maintained.",
      ),
      seoDescription: text('LambertLab Journal 文章：AI 协作检查清单。', 'LambertLab Journal entry: AI Collaboration Checklist.'),
    },
    article: {
      heading: text('实用清单', 'Practical Checklist'),
      paragraphs: [
        text(
          '第一，明确 AI 在评审中的角色：是补全上下文、辅助发现风险，还是给出替代实现建议。不同角色应有不同验收标准。',
          'First, define AI roles in review: context completion, risk discovery, or alternative implementation proposals. Each role needs different acceptance criteria.',
        ),
        text(
          '第二，所有关键结论都应能被人工复现实证。对性能、并发、边界条件等高风险点，必须通过测试和运行数据验证，而不是依赖文本判断。',
          'Second, all key conclusions should be reproducible by humans. High-risk points like performance, concurrency, and edge cases must be validated by tests and runtime data.',
        ),
        text(
          '第三，把“AI 参与痕迹”沉淀进评审记录，便于后续追踪和经验复用。长期看，这比单次效率提升更有价值。',
          "Third, keep a clear trail of AI participation in review records for follow-up and reuse. Over time, this is more valuable than one-off speed gains.",
        ),
      ],
      tags: [text('AI 协作', 'ai-collaboration'), text('代码评审', 'code-review')],
    },
    cta: {
      actions: [
        {
          label: text('返回洞察目录', 'Back to Journal'),
          href: '/journal/index.html',
          visible: true,
        },
        {
          label: text('返回首页', 'Back Home'),
          href: '/index.html',
          visible: true,
          tone: 'primary',
        },
      ],
    },
    meta: {
      slug: '/journal/ai-collaboration-checklist/',
      updatedAt: '2026-02-01',
      visibility: 'public',
      languages: ['zh-CN', 'en'],
    },
  },
  'operational-habits-that-stick': {
    page: {
      kicker: text('洞察 · 2026.01', 'Insight · 2026.01'),
      title: text('让团队持续交付的运营习惯', 'Operational habits that sustain team delivery'),
      subtitle: null,
      summary: text(
        '持续交付的核心并非“冲刺更快”，而是建立稳定节奏，让团队能长期输出可验证的结果。',
        'The core of sustainable delivery is not sprinting faster, but building a stable rhythm for long-term, verifiable outcomes.',
      ),
      seoDescription: text('LambertLab Journal 文章：可持续的操作习惯。', 'LambertLab Journal entry: Operational Habits That Stick.'),
    },
    article: {
      heading: text('关键实践', 'Key Practices'),
      paragraphs: [
        text(
          '先定义稳定节奏：固定计划窗口、评审窗口和回顾窗口，减少临时决策造成的上下文混乱。',
          'Start with a stable cadence: fixed planning, review, and retrospective windows to reduce context disruption from ad-hoc decisions.',
        ),
        text(
          '再建立最小闭环：每次迭代都包含目标、验证和反馈，不把问题长期滚动积压到未来版本。',
          'Then build a minimum loop in each iteration: goals, validation, and feedback, instead of carrying unresolved issues forever.',
        ),
        text(
          '最后是透明化协作状态：让关键指标和风险可见，团队才可能在同一事实基础上做取舍。',
          'Finally, make collaboration status transparent. Teams can only make sound trade-offs when metrics and risks are visible to everyone.',
        ),
      ],
      tags: [text('运营节奏', 'operational-rhythm'), text('持续交付', 'continuous-delivery')],
    },
    cta: {
      actions: [
        {
          label: text('返回洞察目录', 'Back to Journal'),
          href: '/journal/index.html',
          visible: true,
        },
        {
          label: text('返回首页', 'Back Home'),
          href: '/index.html',
          visible: true,
          tone: 'primary',
        },
      ],
    },
    meta: {
      slug: '/journal/operational-habits-that-stick/',
      updatedAt: '2026-01-01',
      visibility: 'public',
      languages: ['zh-CN', 'en'],
    },
  },
}

export function toContentPageMetadata(content: { page: Pick<ContentPageModel, 'title' | 'seoDescription'> }): LocalizedMetadata {
  return {
    title: content.page.title,
    description: content.page.seoDescription,
  }
}

function validateAboutModel(model: AboutPageContentModel) {
  assertLocalizedValue(model.page.kicker, 'about.page.kicker')
  assertLocalizedValue(model.page.title, 'about.page.title')
  assertLocalizedValue(model.page.summary, 'about.page.summary')
  assertLocalizedValue(model.page.seoDescription, 'about.page.seoDescription')
  assertLocalizedValue(model.article.focus.title, 'about.article.focus.title')
  assertLocalizedValue(model.article.focus.summary, 'about.article.focus.summary')
  model.article.focus.paragraphs.forEach((paragraph, index) => {
    assertLocalizedValue(paragraph, `about.article.focus.paragraphs[${index}]`)
  })
  assertLocalizedValue(model.article.workflow.title, 'about.article.workflow.title')
  model.article.workflow.items.forEach((item, index) => {
    assertLocalizedValue(item.title, `about.article.workflow.items[${index}].title`)
    assertLocalizedValue(item.description, `about.article.workflow.items[${index}].description`)
  })
  model.cta.focus.forEach((cta, index) => assertCtaValue(cta, `about.cta.focus[${index}]`))
  model.cta.workflow.forEach((cta, index) => assertCtaValue(cta, `about.cta.workflow[${index}]`))
}

function validateContactModel(model: ContactPageContentModel) {
  assertLocalizedValue(model.page.kicker, 'contact.page.kicker')
  assertLocalizedValue(model.page.title, 'contact.page.title')
  assertLocalizedValue(model.page.summary, 'contact.page.summary')
  assertLocalizedValue(model.page.seoDescription, 'contact.page.seoDescription')
  model.article.cards.forEach((card, index) => {
    assertLocalizedValue(card.kicker, `contact.article.cards[${index}].kicker`)
    assertLocalizedValue(card.title, `contact.article.cards[${index}].title`)
    assertLocalizedValue(card.summary, `contact.article.cards[${index}].summary`)
    assertCtaValue(card.cta, `contact.article.cards[${index}].cta`)
  })
}

function validateJournalIndexModel(model: JournalIndexContentModel) {
  assertLocalizedValue(model.page.kicker, 'journalIndex.page.kicker')
  assertLocalizedValue(model.page.title, 'journalIndex.page.title')
  assertLocalizedValue(model.page.summary, 'journalIndex.page.summary')
  assertLocalizedValue(model.page.seoDescription, 'journalIndex.page.seoDescription')
  model.article.featured.forEach((entry, index) => {
    assertNonEmpty(entry.href, `journalIndex.article.featured[${index}].href`)
    assertLocalizedValue(entry.kicker, `journalIndex.article.featured[${index}].kicker`)
    assertLocalizedValue(entry.title, `journalIndex.article.featured[${index}].title`)
    assertLocalizedValue(entry.summary, `journalIndex.article.featured[${index}].summary`)
  })
  model.article.quickPicks.forEach((entry, index) => {
    assertNonEmpty(entry.href, `journalIndex.article.quickPicks[${index}].href`)
    assertLocalizedValue(entry.title, `journalIndex.article.quickPicks[${index}].title`)
    assertLocalizedValue(entry.date, `journalIndex.article.quickPicks[${index}].date`)
  })
  model.article.archive.forEach((entry, index) => {
    assertNonEmpty(entry.href, `journalIndex.article.archive[${index}].href`)
    assertLocalizedValue(entry.kicker, `journalIndex.article.archive[${index}].kicker`)
    assertLocalizedValue(entry.title, `journalIndex.article.archive[${index}].title`)
  })
  model.article.tags.forEach((tag, index) => assertLocalizedValue(tag, `journalIndex.article.tags[${index}]`))
  assertCtaValue(model.cta.subscribe, 'journalIndex.cta.subscribe')
}

function validateJournalDetailModel(slug: JournalDetailSlug, model: JournalDetailContentModel) {
  assertLocalizedValue(model.page.kicker, `${slug}.page.kicker`)
  assertLocalizedValue(model.page.title, `${slug}.page.title`)
  assertLocalizedValue(model.page.summary, `${slug}.page.summary`)
  assertLocalizedValue(model.page.seoDescription, `${slug}.page.seoDescription`)
  assertLocalizedValue(model.article.heading, `${slug}.article.heading`)
  model.article.paragraphs.forEach((paragraph, index) => {
    assertLocalizedValue(paragraph, `${slug}.article.paragraphs[${index}]`)
  })
  model.article.tags.forEach((tag, index) => {
    assertLocalizedValue(tag, `${slug}.article.tags[${index}]`)
  })
  model.cta.actions.forEach((cta, index) => assertCtaValue(cta, `${slug}.cta.actions[${index}]`))
}

validateAboutModel(aboutPageContentModel)
validateContactModel(contactPageContentModel)
validateJournalIndexModel(journalIndexContentModel);
(Object.keys(journalDetailContentBySlug) as JournalDetailSlug[]).forEach((slug) => {
  validateJournalDetailModel(slug, journalDetailContentBySlug[slug])
})

export type { AboutPageContentModel, ContactPageContentModel, JournalIndexContentModel, JournalDetailContentModel, ContentCtaModel }
