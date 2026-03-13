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
} satisfies Record<string, JournalDetailEntry>
