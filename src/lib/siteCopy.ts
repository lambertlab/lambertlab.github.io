import type { LocalizedMetadata, LocalizedText } from '~/lib/uiLocale'

export const rootMetadata: LocalizedMetadata = {
  title: {
    'zh-CN': 'lambertlab | 系统与工具构建',
    en: 'lambertlab | Building systems and tools',
  },
  description: {
    'zh-CN': 'LambertLab，Technology 与 Life 并列的个人数字主站。',
    en: 'LambertLab, a personal digital home for technology and life.',
  },
}

export const notFoundMetadata: LocalizedMetadata = {
  title: {
    'zh-CN': '页面未找到 | lambertlab',
    en: 'Page Not Found | lambertlab',
  },
  description: {
    'zh-CN': '请求的页面不存在，或已经移动到新的路径。',
    en: 'The page you requested does not exist or has moved to a new path.',
  },
}

export const errorBoundaryMetadata: LocalizedMetadata = {
  title: {
    'zh-CN': '页面异常 | lambertlab',
    en: 'Page Error | lambertlab',
  },
  description: {
    'zh-CN': '当前页面遇到异常，可重试或返回首页继续浏览。',
    en: 'This page hit an error. You can retry or return home to continue browsing.',
  },
}

export const shellCopy = {
  skipLink: {
    'zh-CN': '跳到主要内容',
    en: 'Skip to main content',
  },
  nav: {
    projects: {
      'zh-CN': '项目',
      en: 'Project',
    },
    journal: {
      'zh-CN': '日志',
      en: 'Journal',
    },
    about: {
      'zh-CN': '关于',
      en: 'About',
    },
    contact: {
      'zh-CN': '\u4e0e\u6211\u8054\u7cfb',
      en: 'Get in touch',
    },
  },
  localeSwitch: {
    label: {
      'zh-CN': '界面语言',
      en: 'Interface language',
    },
    toggle: {
      'zh-CN': '切换到英文界面',
      en: 'Switch to Chinese interface',
    },
    zh: {
      'zh-CN': '中',
      en: '中',
    },
    en: {
      'zh-CN': 'EN',
      en: 'EN',
    },
  },
  theme: {
    label: {
      'zh-CN': '\u989c\u8272\u6a21\u5f0f',
      en: 'Color mode',
    },
    light: {
      'zh-CN': '\u4eae\u8272',
      en: 'Light',
    },
    dark: {
      'zh-CN': '\u6697\u8272',
      en: 'Dark',
    },
    toggleToLight: {
      'zh-CN': '\u5207\u6362\u5230\u4eae\u8272\u6a21\u5f0f',
      en: 'Switch to light mode',
    },
    toggleToDark: {
      'zh-CN': '\u5207\u6362\u5230\u6697\u8272\u6a21\u5f0f',
      en: 'Switch to dark mode',
    },
  },
  systemStatus: {
    loadingTitle: {
      'zh-CN': '功能可用性检查中',
      en: 'Checking availability',
    },
    loadingDescription: {
      'zh-CN': '正在获取系统健康摘要，请稍候...',
      en: 'Fetching the latest system health summary.',
    },
  },
  footer: {
    copy: {
      'zh-CN': '公开入口',
      en: 'Public entry points',
    },
    contact: {
      'zh-CN': '\u4e0e\u6211\u8054\u7cfb',
      en: 'Contact',
    },
    status: {
      'zh-CN': '状态',
      en: 'Status',
    },
  },
} as const satisfies Record<string, Record<string, LocalizedText> | LocalizedText>

export const legacyPageMetadata = {
  home: {
    title: {
      'zh-CN': 'lambertlab | 系统与工具构建',
      en: 'lambertlab | Building systems and tools',
    },
    description: {
      'zh-CN': 'LambertLab，Technology 与 Life 并列的个人数字主站。',
      en: 'LambertLab, a personal digital home for technology and life.',
    },
  },
  about: {
    title: {
      'zh-CN': '关于 | lambertlab',
      en: 'About | lambertlab',
    },
    description: {
      'zh-CN': '关于 LambertLab：个人背景、关注方向与工程原则。',
      en: 'About LambertLab: background, focus areas, and engineering principles.',
    },
  },
  contact: {
    title: {
      'zh-CN': '联系 | lambertlab',
      en: 'Contact | lambertlab',
    },
    description: {
      'zh-CN': 'LambertLab 联系方式与公开沟通入口。',
      en: 'Contact channels and public communication entry points for LambertLab.',
    },
  },
  projects: {
    title: {
      'zh-CN': '项目目录 | lambertlab',
      en: 'Projects | lambertlab',
    },
    description: {
      'zh-CN': 'LambertLab Projects 目录，支持按阶段、来源与类型筛选浏览。',
      en: 'LambertLab Projects directory with filters for stage, source, and type.',
    },
  },
  journal: {
    title: {
      'zh-CN': '日志 | lambertlab',
      en: 'Journal | lambertlab',
    },
    description: {
      'zh-CN': 'LambertLab Journal，记录工程写作与现场观察。',
      en: 'LambertLab Journal for engineering writing and field notes.',
    },
  },
  'project-personal-toolbox': {
    title: {
      'zh-CN': '个人工具箱 | lambertlab',
      en: 'Personal Toolbox | lambertlab',
    },
    description: {
      'zh-CN': 'Personal Toolbox 项目页面。',
      en: 'Project page for Personal Toolbox.',
    },
  },
  'project-ai-message-value-triage': {
    title: {
      'zh-CN': 'AI 消息价值分诊 | lambertlab',
      en: 'AI Message Value Triage | lambertlab',
    },
    description: {
      'zh-CN': 'AI Message Value Triage 项目页面。',
      en: 'Project page for AI Message Value Triage.',
    },
  },
  'journal-model-first-engineering': {
    title: {
      'zh-CN': '模型优先工程 | lambertlab',
      en: 'Model-First Engineering | lambertlab',
    },
    description: {
      'zh-CN': 'LambertLab Journal 文章：模型优先工程。',
      en: 'LambertLab Journal entry: Model-First Engineering.',
    },
  },
  'journal-ai-collaboration-checklist': {
    title: {
      'zh-CN': 'AI 协作检查清单 | lambertlab',
      en: 'AI Collaboration Checklist | lambertlab',
    },
    description: {
      'zh-CN': 'LambertLab Journal 文章：AI 协作检查清单。',
      en: 'LambertLab Journal entry: AI Collaboration Checklist.',
    },
  },
  'journal-operational-habits-that-stick': {
    title: {
      'zh-CN': '可持续的操作习惯 | lambertlab',
      en: 'Operational Habits That Stick | lambertlab',
    },
    description: {
      'zh-CN': 'LambertLab Journal 文章：可持续的操作习惯。',
      en: 'LambertLab Journal entry: Operational Habits That Stick.',
    },
  },
} satisfies Record<string, LocalizedMetadata>
