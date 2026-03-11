# /journal/* 分阶段迁移路线（等价优先）

## 目标
- 在保持当前 `.new` 站点视觉和交互等价的前提下，把 Journal 的 canonical 路径从 `/insights/*` 逐步迁移到 `/journal/*`。
- 迁移期间不破坏已有外链和书签，先兼容再切主。

## 当前基线（2026-03-11）
- 现行主路径：`/insights/*`
- 已有详情页：
  - `/insights/model-first-engineering.html`
  - `/insights/ai-collaboration-checklist.html`
  - `/insights/operational-habits-that-stick.html`
- 路由架构：TanStack Start + 文件路由 + 静态预渲染

## 执行进度
- 2026-03-11：J1 已落地并存路由（`/journal` 与 `/journal/*` 已可访问），当前仍保持 `/insights/*` 为主入口。

## 分阶段计划
### 阶段 J1：并存期（先加不切）
- 新增同内容的 `/journal` 列表页与 `/journal/*` 详情页路由。
- `/insights/*` 继续保留为主入口，不做自动跳转。
- 导航文案仍可显示 `Journal`，但所有现有入口先不强制切换。

验收标准：
- `/insights/*` 与 `/journal/*` 页面内容一致，视觉 diff 在既定阈值内。
- 主题、状态灯、头部行为一致，无新增闪烁。

### 阶段 J2：切主期（入口迁移）
- 头部与站内主入口统一指向 `/journal` 与 `/journal/*`。
- `/insights/*` 保留为兼容别名（可返回 200 同内容，或做稳定重定向，二选一）。

验收标准：
- 从首页、Projects、About、Contact 进入 Journal 均落在 `/journal/*`。
- 刷新/前进/后退路径稳定，不出现目录索引页。

### 阶段 J3：收口期（对外契约更新）
- 更新 sitemap、内部文档、后端返回链接中的 Journal 目标路径为 `/journal/*`。
- 输出一份旧路径到新路径映射清单，便于后续排查外链。

验收标准：
- 全站不再产生新的 `/insights/*` 主入口链接。
- 映射清单完整，抽样验证通过。

## 映射清单（预置）
- `/insights/index.html` -> `/journal`（或 `/journal/index.html`）
- `/insights/model-first-engineering.html` -> `/journal/model-first-engineering`
- `/insights/ai-collaboration-checklist.html` -> `/journal/ai-collaboration-checklist`
- `/insights/operational-habits-that-stick.html` -> `/journal/operational-habits-that-stick`

## 执行约束（硬性）
- 不改色板、间距、排版、动效参数；仅做路径与路由迁移。
- 每次阶段完成后必须跑最小门禁（build + parity smoke）并记录可清理测试产物。
- 任一阶段出现视觉/交互漂移，立即回到该阶段修复，不推进下一阶段。
