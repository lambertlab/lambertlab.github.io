# legacy-html 页面盘点（P0）

更新时间：2026-03-13

## 1. 盘点范围
来源：`src/legacy-html/` 全量页面资产（当前共 10 项）。

## 2. 分类口径
- `短期必须保留`：当前版本仍依赖该承载方式，短期移除会影响稳定发布。
- `中期可替换`：可进入模板化/组件化替换队列，但不属于最高脆弱面。
- `优先重写`：动态数据与运行时补丁耦合高，持续放大回归风险，优先进入 P1。

## 3. 盘点清单
| 页面路径 | 页面类型 | 运行时 DOM 注入依赖 | 后端动态数据依赖 | 高频变更 | expected diff 历史 | 分类结论 | 分类依据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/index.html` | 动态型（首页精选） | 是（`LegacyPageView`） | 是（`/projects/featured`） | 是 | 有 | 优先重写 | 旧 DOM + 新数据合同 + 运行时脚本补丁并存，壳层与业务区耦合高 |
| `/projects/index.html` | 动态型（目录） | 是（`LegacyPageView`） | 是（`/projects`） | 是 | 有 | 优先重写 | loading/empty/error/retry 与 URL 回放都依赖脚本拼装，维护脆弱度最高 |
| `/journal/index.html` | 内容型（列表） | 是（`LegacyPageView`） | 否 | 否 | 有 | 中期可替换 | 结构稳定但仍依赖 legacy 注入，适合模板化替换 |
| `/journal/model-first-engineering.html` | 内容型（详情） | 是（`LegacyPageView`） | 否 | 否 | 无 | 中期可替换 | 内容页低动态，优先级低于首页/目录动态区 |
| `/journal/ai-collaboration-checklist.html` | 内容型（详情） | 是（`LegacyPageView`） | 否 | 否 | 无 | 中期可替换 | 同上，适合在内容承载迁移阶段替换 |
| `/journal/operational-habits-that-stick.html` | 内容型（详情） | 是（`LegacyPageView`） | 否 | 否 | 无 | 中期可替换 | 同上，风险可控但不应长期保留 legacy 注入 |
| `/about/index.html` | 内容型 | 是（`LegacyPageView`） | 否 | 否 | 有 | 短期必须保留 | 业务波动低，可作为过渡资产保留到内容承载统一阶段 |
| `/contact/index.html` | 内容型 | 是（`LegacyPageView`） | 否 | 否 | 有 | 短期必须保留 | 与 about 同类，短期保留成本低且风险可控 |
| `/projects/personal-toolbox/index.html` | 内容型（遗留详情） | 是（遗留资产） | 否（当前主路由已改 API-first 详情） | 否 | 无 | 中期可替换 | 已有新详情路由承载，遗留文件属于可清理替换项 |
| `/projects/ai-message-value-triage/index.html` | 内容型（遗留详情） | 是（遗留资产） | 否（当前主路由已改 API-first 详情） | 否 | 无 | 中期可替换 | 同上，属于“已被新合同替代”的历史包袱资产 |

## 4. 分类汇总
- 优先重写：2 页（`/index.html`、`/projects/index.html`）
- 中期可替换：6 页
- 短期必须保留：2 页

## 5. 结论
1. P1 优先治理对象固定为首页精选与 Projects 目录页。
2. 内容型页面进入中期替换队列，按模板化/组件化推进。
3. `legacy-html` 中遗留项目详情文件已非主承载，纳入清理窗口。
