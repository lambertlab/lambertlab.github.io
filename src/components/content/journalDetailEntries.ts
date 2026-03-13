import type { JournalDetailEntry } from '~/components/content/JournalDetailTemplate'

export const journalDetailEntries = {
  'model-first-engineering': {
    kicker: 'Insight · 2026.03',
    title: '面向数据工作流的模型先行工程方法',
    summary: '先用模型抽象系统边界与核心流，再进入实现阶段，可显著降低复杂系统中的隐性耦合和回归风险。',
    articleHeading: '核心观点',
    paragraphs: [
      '模型先行不是“先画图再编码”的形式主义，而是把系统行为提前结构化。通过提前定义实体关系、状态转移和失败路径，团队能在进入实现前对关键风险达成一致。',
      '在数据工作流场景，这种方法尤其有效。因为问题通常不在单个函数，而在多个环节叠加产生的延迟、丢失和不可追踪性。',
      '建议将模型与测试策略一起设计，并在迭代中持续修订，让模型成为长期维护资产，而不是一次性文档。',
    ],
    actions: [
      {
        href: '/journal/index.html',
        label: '返回洞察目录',
      },
      {
        href: '/index.html',
        label: '返回首页',
        tone: 'primary',
      },
    ],
  },
  'ai-collaboration-checklist': {
    kicker: 'Insight · 2026.02',
    title: '代码评审中的 AI 协作实用清单',
    summary: '在评审中引入 AI 时，关键不在“它能写多少代码”，而在“它输出能否被验证、解释和维护”。',
    articleHeading: '实用清单',
    paragraphs: [
      '第一，明确 AI 在评审中的角色：是补全上下文、辅助发现风险，还是给出替代实现建议。不同角色应有不同验收标准。',
      '第二，所有关键结论都应能被人工复现实证。对性能、并发、边界条件等高风险点，必须通过测试和运行数据验证，而不是依赖文本判断。',
      '第三，把“AI 参与痕迹”沉淀进评审记录，便于后续追踪和经验复用。长期看，这比单次效率提升更有价值。',
    ],
    actions: [
      {
        href: '/journal/index.html',
        label: '返回洞察目录',
      },
      {
        href: '/index.html',
        label: '返回首页',
        tone: 'primary',
      },
    ],
  },
  'operational-habits-that-stick': {
    kicker: 'Insight · 2026.01',
    title: '让团队持续交付的运营习惯',
    summary: '持续交付的核心并非“冲刺更快”，而是建立稳定节奏，让团队能长期输出可验证的结果。',
    articleHeading: '关键实践',
    paragraphs: [
      '先定义稳定节奏：固定计划窗口、评审窗口和回顾窗口，减少临时决策造成的上下文混乱。',
      '再建立最小闭环：每次迭代都包含目标、验证和反馈，不把问题长期滚动积压到未来版本。',
      '最后是透明化协作状态：让关键指标和风险可见，团队才可能在同一事实基础上做取舍。',
    ],
    actions: [
      {
        href: '/journal/index.html',
        label: '返回洞察目录',
      },
      {
        href: '/index.html',
        label: '返回首页',
        tone: 'primary',
      },
    ],
  },
} satisfies Record<string, JournalDetailEntry>
