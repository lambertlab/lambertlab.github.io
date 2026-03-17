# 前端治理待办 P5 骨架评审（P5.1/P5.2/P5.3）

更新时间：2026-03-14

## 历史态声明（P5.3 收口后）
1. 本文档为 P5 骨架阶段的盘点记录，不代表当前运行时拓扑。
2. 文中列举的 `src/legacy-html/**`、`src/legacy/pages.ts`、`src/legacy/parseLegacyHtml.ts`、`LegacyPageView` 为历史态证据，已不在当前运行链路。
3. 当前编辑流与退场状态以 `docs/archive/frontend-governance-p5.3-editorial-workflow-and-legacy-sunset.md` 为准。

## 1. 评审结论（骨架轮）
1. 已完成 P5.1 / P5.2 / P5.3 前端侧输入清单与风险清单整理。
2. 三子批次顺序与依赖关系可落地：`P5.1 -> P5.2 -> P5.3`，与控制面文档无冲突。
3. 本轮仅输出文档清单，不进入业务代码实现。

## 2. 输入边界与证据来源
### 2.1 control-plane 输入文档
1. `../../control-plane/功能规格/功能-前端治理待办P5-内容真值收敛与legacy资产退场.md`
2. `../../control-plane/接口协议/前端治理协议-P5-内容真值收敛与legacy资产退场-v1.md`
3. `../../control-plane/任务/功能-前端治理待办P5-内容真值收敛与legacy资产退场.md`
4. `../../control-plane/任务/前端-功能-前端治理待办P5-内容真值收敛与legacy资产退场.md`
5. `../../control-plane/任务/前端实施单-前端治理待办P5-骨架搭建与子批次占位落地.md`

### 2.2 前端仓现状证据（本轮盘点）
1. 内容页当前文案真值分布：
   - `src/components/content/AboutPage.tsx`
   - `src/components/content/ContactPage.tsx`
   - `src/components/content/JournalIndexPage.tsx`
   - `src/components/content/journalDetailEntries.ts`
2. 元数据与壳层文案真值分布：
   - `src/lib/siteCopy.ts`
3. 兼容路径一致性（目录路径与 `.html` 路径共用同组件）：
   - `src/routes/about/index.tsx` + `src/routes/about/index[.]html.tsx`
   - `src/routes/contact/index.tsx` + `src/routes/contact/index[.]html.tsx`
   - `src/routes/journal/index.tsx` + `src/routes/journal/index[.]html.tsx`
   - `src/routes/journal/model-first-engineering/index.tsx` + `src/routes/journal/model-first-engineering/index[.]html.tsx`
4. 门禁链路与分层脚本：
   - `package.json`（`gate:l1/l2/l3`、`build:verify`）
   - `scripts/verify-prerender-parity.mjs`
   - `scripts/verify-dynamic-contracts.mjs`
   - `scripts/visual-shell-smoke.mjs`
5. legacy 资产与退场参考：
   - `src/legacy-html/**`
   - `src/legacy/pages.ts`
   - `src/legacy/parseLegacyHtml.ts`
   - `docs/archive/legacy-html-inventory-p0-2026-03-13.md`
   - `docs/archive/legacy-html-exit-checklist-p1-entry.md`
   - `docs/archive/frontend-governance-p0-gate-layers.md`

## 3. P5.1 输入清单与风险清单（内容模型统一与真值下沉）
### 3.1 输入清单
1. 文案真值盘点清单（页面正文、标题、副标题、CTA、标签）：
   - `AboutPage.tsx`、`ContactPage.tsx`、`JournalIndexPage.tsx`、`journalDetailEntries.ts`
2. metadata 真值盘点清单：
   - `siteCopy.ts` 内 `legacyPageMetadata`、`rootMetadata`、`shellCopy`
3. 路由一致性与回放约束：
   - `index.tsx` 与 `index[.]html.tsx` 必须持续复用同一内容模型输入
4. 进入 P5.1 详细规划前的最小基线输出项（仅规划，不实现）：
   - 内容字段分层草案（页面级字段、文章级字段、CTA 字段）
   - 字段校验口径草案（必填、可空、默认值）
   - 迁移顺序草案（先模型定义，再页面接入）

### 3.2 风险清单
1. 风险：内容真值目前分散在多个组件与 `siteCopy.ts`，一次性收敛容易漏字段。
   - 影响：迁移后出现“页面文案缺失 / metadata 回退旧值”。
2. 风险：中英文本未形成统一字段合同，可能出现仅迁移中文或仅迁移英文。
   - 影响：多语言体验不一致，回归难度上升。
3. 风险：若在字段合同未冻结前进入实现，违反 P5 协议“不越界”约束。
   - 影响：P5.2/P5.3 输入反复变更，导致返工。

## 4. P5.2 输入清单与风险清单（门禁降噪与验证分层）
### 4.1 输入清单
1. 当前门禁命令职责边界：
   - `package.json`：`gate:l1`、`gate:l2`、`gate:l3`、`gate:all`、`build:verify`
2. 当前 L1/L3 结构与动态合同断言点：
   - `verify-prerender-parity.mjs`
   - `verify-dynamic-contracts.mjs`
3. 当前 L2 壳层稳定与告警来源：
   - `visual-shell-smoke.mjs`
   - `scripts/visual-parity.config.json`
4. 既有门禁分层基线文档：
   - `docs/archive/frontend-governance-p0-gate-layers.md`

### 4.2 风险清单
1. 风险：降噪若只“减少日志”而未保留阻断信号，会弱化门禁价值。
   - 影响：真实回归被误放行。
2. 风险：L2 依赖浏览器与稳定性采样，存在环境抖动噪音。
   - 影响：误报导致评审成本升高。
3. 风险：L3 中 Projects 动态场景断言较重，若与内容模型治理混改，会混淆问题归因。
   - 影响：P5.2 结论不可解释，阻碍 P5.3 进入条件判定。

## 5. P5.3 输入清单与风险清单（编辑流与 legacy 资产退场策略）
### 5.1 输入清单
1. legacy 资产现状清单（当前仍在仓）：
   - `src/legacy-html/index.html`
   - `src/legacy-html/about/index.html`
   - `src/legacy-html/contact/index.html`
   - `src/legacy-html/journal/*.html`
   - `src/legacy-html/projects/**`
2. legacy 运行时真实引用链：
   - `src/legacy/pages.ts` 当前仍导入 `home/about/projects/legacy project detail` 源文件
   - `src/components/LegacyPageView.tsx` 仍保留 legacy 注入容器能力
3. 历史退场口径与准入模板：
   - `docs/archive/legacy-html-inventory-p0-2026-03-13.md`
   - `docs/archive/legacy-html-exit-checklist-p1-entry.md`
4. 进入 P5.3 前置：
   - P5.1 内容模型冻结
   - P5.2 门禁分层稳定（可用于退场前后对照）

### 5.2 风险清单
1. 风险：过早删除 legacy 参考资产会丢失回归对照基线。
   - 影响：异常时难以快速定位“内容错误 vs 渲染错误”。
2. 风险：若编辑流先行但内容模型未冻结，会形成新的“文档真值/代码真值双轨”。
   - 影响：退场策略无法执行闭环。
3. 风险：若未定义“可关闭兜底”的触发条件，静态兜底可能长期滞留。
   - 影响：legacy 资产名义退场，实际仍被隐式依赖。

## 6. 子批次顺序与依赖冲突检查
1. 协议顺序校验：
   - P5.1 进入条件：骨架文档已发布（已满足）。
   - P5.2 进入条件：P5.1 内容模型与校验清单已冻结（未满足，需 P5.1 完成）。
   - P5.3 进入条件：P5.2 门禁分层策略已稳定（未满足，需 P5.2 完成）。
2. 冲突检查结论：
   - 与功能规格、接口协议、总任务、前端任务、前端实施单五份输入文档一致。
   - 未发现“先做 P5.2 或 P5.3 再回补 P5.1”的逆序依赖。
3. 与既有 P4 收口关系：
   - P4 已完成内容页模板化迁移，不冲突；P5 作为“真值收敛与治理收口”顺承阶段成立。

## 7. 待澄清项（供 control-plane 进入 P5.1 详细规划）
1. P5.1 的“内容模型”是否纳入 `siteCopy.ts` 的壳层文案与 metadata，还是仅覆盖内容页正文文案？
2. 内容模型目标载体是否已冻结（TypeScript 模块 / JSON / 其他），以及是否要求双语字段同构必填？
3. P5.1 是否包含对 Home 非 Projects 文案区的真值收敛，还是限定在 about/contact/journal 内容域？
4. P5.2 的“降噪成功”量化口径是否有统一阈值（例如误报率、日志噪音项数量、首屏失败定位时长）？
5. P5.3 中 legacy 资产退场是按“页面分批”还是“目录分批”判定发布，是否允许先退场“已无运行时引用”的资产？
6. P5.3 是否要求同步输出标准回退脚本模板，还是沿用现有发布单回退记录机制？

## 8. 本轮约束执行记录
1. 本轮仅完成文档与清单输出。
2. 未进入前端业务代码实现。
