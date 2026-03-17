# 内容页承载收敛与 DOM 契约显式化（P4）

更新时间：2026-03-13

## 历史态声明（P5.3 收口后）
1. 本文档用于记录 2026-03-13 的阶段性现状与迁移判断。
2. 文中涉及 `LegacyPageView`、`src/legacy/pages.ts`、`src/legacy/parseLegacyHtml.ts`、`src/legacy-html/**` 的描述均为历史记录，不是当前运行路径。
3. 当前运行态请以 P5.3 文档为准：`docs/archive/frontend-governance-p5.3-editorial-workflow-and-legacy-sunset.md`。

## 1. 文档目的
- 固化 `about`、`contact`、`journal` 首页与文章详情的当前承载分类。
- 冻结当前真实被壳层脚本、门禁和关键样式依赖的 DOM 契约最小集合。
- 为下一轮内容页实施拆批提供可直接执行的优先级、DoD 和验证口径。

## 2. 输入与边界
- 输入文档：
  - `../../control-plane/任务/前端实施单-前端治理待办P4-内容页承载收敛与DOM契约显式化落地.md`
  - `../../control-plane/功能规格/功能-前端治理待办P4-内容页承载收敛与DOM契约显式化.md`
  - `../../control-plane/接口协议/前端治理协议-内容页承载收敛与DOM契约显式化-v1.md`
  - `../../control-plane/任务/功能-前端治理待办P4-内容页承载收敛与DOM契约显式化.md`
  - `../../control-plane/任务/前端-功能-前端治理待办P4-内容页承载收敛与DOM契约显式化.md`
  - `../../control-plane/架构/前端治理待办-legacy-html与视觉回归门禁-2026-03-13.md`
- 盘点来源：
  - `src/routes/**`
  - `src/legacy/pages.ts`
  - `src/legacy/parseLegacyHtml.ts`
  - `src/components/LegacyPageView.tsx`
  - `src/legacy-html/**`
  - `scripts/verify-prerender-parity.mjs`
  - `scripts/visual-shell-smoke.mjs`
  - `public/js/main.js`
- 范围约束：
  - 本轮只做文档化冻结，不进入页面重写。
  - 本轮不新增后端接口，不把内容承载问题转嫁为 CMS 或内容平台议题。

## 3. 当前承载判断
### 3.1 统一事实
1. `about`、`contact`、`journal` 首页和文章详情当前都通过 `src/routes/** -> LegacyPageView -> legacyPages.*` 承载。
2. `src/legacy/parseLegacyHtml.ts` 会剥离 legacy HTML 自带的 `header`、`footer` 和内联 `script`，因此当前上线页的共享壳层真值已经是 React Root Shell，而不是 legacy 页面自带壳层。
3. 本轮范围内页面没有新增 API 驱动区块，也没有内容页专属运行时补丁；它们不属于 `mixed-runtime`。

### 3.2 页面级分类清单
| 页面 | 当前路由真值 | 当前分类 | 保留理由 | 退出条件 | 迁移优先级 |
| --- | --- | --- | --- | --- | --- |
| `/about/`、`/about/index.html` | `src/routes/about/* -> legacyPages.about` | `legacy-wrapped` | 文案稳定、无动态数据、目前只有共享壳层和样式契约在生效，继续保留不会制造新的动态风险 | 产出组件版 About 模板；`LegacyPageView` 不再引用 `legacyPages.about`；`/about/` 与 `/about/index.html` 继续同内容 | P4.2 |
| `/contact/`、`/contact/index.html` | `src/routes/contact/* -> components/content/ContactPage.tsx` | `component-native` | P4.1 已完成首轮模板化，当前保留目标是稳定组件真值与兼容路径一致性 | 后续若引入内容模型，仍必须复用同一组件真值，不得回退到 raw HTML 注入 | 已完成 |
| `/journal/`、`/journal/index.html` | `src/routes/journal/* -> components/content/JournalIndexPage.tsx` | `component-native` | P4.1 已完成首轮模板化，当前保留目标是稳定目录模板与详情入口路径口径 | 后续若接入内容模型，仍必须复用同一目录模板，不得回退到 raw HTML 注入 | 已完成 |
| `/journal/model-first-engineering/`、`/journal/model-first-engineering/index.html` | `src/routes/journal/model-first-engineering/* -> legacyPages.journalModelFirstEngineering` | `legacy-wrapped` | 无动态数据，结构与其他文章详情同构，适合作为详情模板首篇样板 | 首篇详情页完成组件化；返回目录/返回首页链接改为组件真值；验证详情模板可复用 | P4.2 |
| `/journal/ai-collaboration-checklist/`、`/journal/ai-collaboration-checklist/index.html` | `src/routes/journal/ai-collaboration-checklist/* -> legacyPages.journalAiCollaborationChecklist` | `legacy-wrapped` | 与首篇详情同构，适合在详情模板稳定后批量迁移 | 首篇详情模板已验证通过；该页改接统一详情模板；无新增 DOM 隐式依赖 | P4.3 |
| `/journal/operational-habits-that-stick/`、`/journal/operational-habits-that-stick/index.html` | `src/routes/journal/operational-habits-that-stick/* -> legacyPages.journalOperationalHabitsThatStick` | `legacy-wrapped` | 与首篇详情同构，迁移收益主要来自统一模板和去除 legacy 注入 | 同上；详情模板复用完成；旧 HTML 仅保留为迁移期参考，不再作为运行时输入 | P4.3 |

### 3.3 分类结论
- 本轮范围内 4 组内容页归类为 `legacy-wrapped`。
- 本轮范围内 2 组内容页归类为 `component-native`。
- 本轮范围内 0 页为 `mixed-runtime`。
- 结论含义：P4.1 已验证“共享壳层不动，只替换正文承载”的实施路径可行，后续批次继续沿用该模式。

## 4. DOM 契约最小集合
### 4.1 共享壳层契约
| 选择器 / 节点 | 依赖方 | 用途 | 缺失影响 |
| --- | --- | --- | --- |
| `.ll-header` | `scripts/verify-prerender-parity.mjs`、`scripts/visual-shell-smoke.mjs`、`public/js/main.js` | 壳层存在性断言、header stability 采样、主题与状态入口的宿主区域 | L1/L2 门禁直接失败；主题开关和导航稳定性无法验证 |
| `.ll-nav` | `scripts/visual-shell-smoke.mjs`、`public/js/main.js` | header stability 关键区域；主题切换器注入/复用宿主 | L2 门禁失败；主题切换器无法挂载或状态失真 |
| `[data-theme-mode-switch]` | `scripts/verify-prerender-parity.mjs`、`scripts/visual-shell-smoke.mjs`、`public/js/main.js` | 主题切换控制骨架与门禁断言 | L1/L2 门禁失败；主题切换交互失效 |
| `[data-system-status]` | `scripts/verify-prerender-parity.mjs`、`scripts/visual-shell-smoke.mjs`、`public/js/main.js` | 公开状态灯入口、header stability 关键区域 | L1/L2 门禁失败；状态灯无法刷新或回放 |
| `[data-system-status-title]`、`[data-system-status-description]` | `public/js/main.js` | 状态灯文案写入点 | 状态灯仍可见，但文案不会更新，辅助技术信息失真 |
| `.ll-site-footer` | `scripts/verify-prerender-parity.mjs`、`scripts/visual-shell-smoke.mjs`、`public/css/shared-header.css` | 共享页脚存在性断言与壳层样式真值 | L1/L2 门禁失败；内容页底部导航缺失 |
| `#main-content` | `scripts/verify-prerender-parity.mjs`、skip-link、页面语义结构 | 主要内容锚点、可访问性跳转目标 | L1 门禁失败；跳过导航链接失效 |

### 4.2 Legacy 容器契约
| 选择器 / 节点 | 依赖方 | 用途 | 缺失影响 |
| --- | --- | --- | --- |
| `[data-legacy-page="<page-id>"]` | `src/components/LegacyPageView.tsx` 内部锚点接管、实施排查 | 标识当前页面仍处于 legacy 注入承载；作为后续退出 legacy 的切断点 | 页面仍可展示，但无法从 DOM 明确识别 legacy 承载；不利于后续门禁补强与迁移核对 |

### 4.3 页面内容结构契约
仅保留会影响阅读结构、CTA 可达性和现有样式稳定的最小节点，不把所有视觉类名升级为接口。

| 页面类型 | 最小 DOM 契约 | 依赖方 | 用途 | 缺失影响 |
| --- | --- | --- | --- | --- |
| About | `.hero`、`.about-grid`、`.panel`、`.actions` | `public/css/page-about.css` | 保持首屏说明、双栏信息区和 CTA 分组 | 布局退化为无层次文本流，CTA 可见性下降 |
| Contact | `.wrap`、`.hero`、`.grid`、`.actions` | `public/css/bento-pages.css`、`public/css/page-contact.css` | 保持固定头部下的内容偏移、联系卡片网格和 CTA 区 | 首屏可能被头部遮挡；联系卡片阅读顺序和点击区退化 |
| Journal index | `.hero`、`.journal-grid`、`.panel-head`、`.story-card`、`.note-list`、`.journal-foot`、`.archive-row` | `public/css/page-journal.css`、`public/css/theme-system.css` | 保持目录页主故事、快速入口、底部联系 CTA 和归档结构 | 目录页信息层级坍塌，主要入口与订阅 CTA 的识别度下降 |
| Journal detail | `.wrap`、`.hero`、`.article`、`.actions` | `public/css/bento-pages.css` | 保持文章头图、正文容器和返回操作区 | 正文阅读宽度、段落节奏和返回操作显著退化 |

### 4.4 禁止继续隐式扩散的耦合
1. 不允许为内容页新增依赖未登记选择器的运行时脚本。
2. 不允许把 legacy HTML 自带 `header`、`footer`、内联脚本重新视为运行时真值。
3. 不允许为单篇 Journal 文章各自扩张一套独立 DOM 契约；详情页只能复用统一详情模板契约。
4. 不允许新增只服务旧 `.html` 路径而不覆盖规范目录路径的双轨结构。

## 5. 长期承载建议
### 5.1 目标形态
- `about`、`contact`：模板组件驱动，文案先以内置内容模型承载，不引入后端内容接口。
- `journal` 首页：模板组件驱动，文章卡片列表从前端内容模型或静态映射承载。
- `journal` 详情：统一文章详情模板 + 每篇内容数据对象；metadata/head 由组件层统一管理。

### 5.2 迁移原则
1. 先替换内容承载，不改共享壳层真值。
2. 先落最小模板，再做文案或视觉微调，避免把治理任务扩大成改版任务。
3. 迁移完成后，`src/legacy-html/journal/*.html`、`src/legacy-html/about/index.html`、`src/legacy-html/contact/index.html` 只可作为迁移参考，不再作为运行时输入。

## 6. 下一轮实施拆批建议
### 批次 A：模板入口页优先
- 范围：`contact` + `journal index`
- 原因：
  - 两者都无动态数据依赖。
  - `contact` 结构简单，适合作为最小模板试点。
  - `journal index` 是内容目录入口，模板化收益高于继续保留注入。
- 最小 DoD：
  - 两页从 `LegacyPageView` 切到组件承载。
  - `/page/` 与 `/page/index.html` 内容一致。
  - 共享壳层契约不变，`#main-content` 保留。
  - Journal index 的详情入口、Contact 的主要 CTA 与当前路径语义一致。
- 验证口径：
  - `npm run build:verify`
  - `npm run visual:parity:smoke`
  - 手工抽查 `/contact/`、`/contact/index.html`、`/journal/`、`/journal/index.html`

### 批次 B：About + 首篇文章详情模板化
- 范围：`about` + `journal/model-first-engineering`
- 原因：
  - `about` 为低动态静态页，适合和首篇详情页一起验证“单页模板 + 详情模板”两种承载路径。
  - 首篇文章详情可作为统一详情模板的打样页。
- 最小 DoD：
  - About 页退出 legacy 注入。
  - 首篇文章详情退出 legacy 注入，并抽出可复用详情模板骨架。
  - 详情页“返回目录 / 返回首页”操作保持现有语义与路径。
- 验证口径：
  - `npm run build:verify`
  - `npm run visual:parity:smoke`
  - 手工抽查 `/about/`、`/about/index.html`、`/journal/model-first-engineering/`

### 批次 C：剩余 Journal 详情批量收口
- 范围：`journal/ai-collaboration-checklist` + `journal/operational-habits-that-stick`
- 原因：
  - 与批次 B 的详情结构同构，适合在模板稳定后批量替换。
  - 可以把“单篇 legacy HTML 文件作为内容真值”的状态一次性收口。
- 最小 DoD：
  - 两篇详情页接入统一详情模板与内容数据源。
  - 不新增页面级运行时脚本。
  - `legacyPages.journal*` 仅保留未迁移条目，最终清零。
- 验证口径：
  - `npm run build:verify`
  - `npm run visual:parity:smoke`
  - 手工抽查三篇详情页的回链、标题、描述和正文结构一致性

## 7. 保留与退出总表
| 页面类别 | 当前保留理由 | 退出触发条件 | 不建议继续拖延的原因 |
| --- | --- | --- | --- |
| About | 低动态、低回归噪音，可后置 | 批次 B 启动时立即纳入 | 长期保留会让“静态文案页仍依赖 raw HTML 注入”成为常态 |
| Contact | 低复杂度、适合试点 | 批次 A | 继续保留收益低，且会拖慢模板试点启动 |
| Journal index | 目录型入口、结构接近模板 | 批次 A | 目录入口仍由注入 HTML 承载，会放大未来文章扩展成本 |
| Journal detail | 多页同构，适合模板复用 | 批次 B/C | 若不统一模板，文章越多 legacy 资产越难收口 |

## 8. 本轮验证记录
| 命令 | 结果 |
| --- | --- |
| `Get-Content ../../control-plane/任务/前端实施单-前端治理待办P4-内容页承载收敛与DOM契约显式化落地.md` 等输入文档 | 已核对实施目标、范围和 DoD |
| `rg --files src` | 已确认 `about`、`contact`、`journal` 路由、legacy 页面和组件入口存在且可追溯 |
| `Get-Content src/legacy/pages.ts` | 已确认内容页均由 `legacyPages.*` 注入承载 |
| `Get-Content src/legacy/parseLegacyHtml.ts` | 已确认 legacy 自带 `header/footer/script` 会被剥离，当前壳层真值在 React Root Shell |
| `rg -n 'data-legacy-page|main-content|ll-header|ll-site-footer|data-theme-mode-switch|data-system-status-title|data-system-status-description' src public scripts` | 已确认 DOM 契约真实依赖方来自门禁脚本、共享运行时和样式 |

## 9. 风险与回退方案
### 风险
1. 当前内容结构类名大多仍由 legacy HTML 提供，下一轮若直接重写组件而未保留最小结构，容易出现样式静默漂移。
2. `journal` 详情若逐篇自由实现，会再次制造 DOM 契约分叉。
3. 若后续实施同时改文案、改样式、改承载，问题归因会失真。

### 回退方案
1. 任何单页迁移失败时，可按页面粒度暂时回挂到 `legacyPages.<page>`，不影响其他批次。
2. 若模板化后触发壳层门禁失败，优先回退组件模板改动，不回退 Root Shell 契约。
3. 若详情模板在批次 B 未稳定，暂停批次 C，保留剩余文章在 `legacy-wrapped`，避免半成品批量扩散。

## 10. 阻塞项与归属判断
- 当前无后端阻塞。
- 当前无 control-plane 输入缺口。
- 下一轮若需要“文章内容源从静态对象升级为统一内容模型文件”，归属前端。
- 只有在后续明确出现“内容必须由后端动态提供且现有合同无法表达”的证据后，才升级为后端/新议题。
