# 前端治理 P5.3：编辑工作流与 legacy 资产退场策略落地

更新时间：2026-03-14

## 1. 编辑工作流闭环（模型优先、模板消费、门禁兜底）
### 1.1 唯一编辑入口
1. 内容主真值只允许修改 `src/content/contentModels.ts`。
2. 内容页路由仅消费模型，不允许回退到 `legacy` 注入入口。
3. 页面模板组件只做渲染，不持有主真值副本。

### 1.2 固化执行三步法
1. 修改：
   - 在 `src/content/contentModels.ts` 更新内容字段。
   - 在变更说明中填写影响范围（页面、路由、兼容路径）。
2. 校验：
   - `npm run build:verify`
   - `npm run visual:parity:smoke`
3. 回退：
   - 直接回退本轮涉及的模型与脚本变更文件。
   - 触发条件：任一阻断门禁失败，或主路径与 `.html` 兼容路径内容不一致。

### 1.3 门禁兜底
新增脚本：`scripts/verify-editorial-workflow.mjs`  
兜底规则：
1. 内容路由必须从 `src/content/contentModels.ts` 消费模型。
2. 禁止内容路由回退引用 `legacyPages` / `LegacyPageView`。
3. 禁止残留 `legacy-html ?raw` 导入。
4. `src/components/LegacyPageView.tsx`、`src/legacy/pages.ts`、`src/legacy/parseLegacyHtml.ts`、`src/legacy-html/` 必须已退场。

`build:verify` 已接入该脚本，形成发布前硬校验。

## 2. legacy 资产判定表（allow-remove / hold / must-keep）
| 资产 | 判定 | 证据 | 处理 |
| --- | --- | --- | --- |
| `src/components/LegacyPageView.tsx` | allow-remove | 无路由引用，`rg "LegacyPageView" src` 仅命中自身 | 已删除（批次 1） |
| `src/legacy/pages.ts` | allow-remove | 无业务引用，且仅用于加载 `src/legacy-html/**` | 已删除（批次 1） |
| `src/legacy/parseLegacyHtml.ts` | allow-remove | 仅被 `src/legacy/pages.ts` 引用 | 已删除（批次 1） |
| `src/legacy-html/**`（10 个页面资产） | allow-remove | 仅被已删除的 `src/legacy/pages.ts` 原始导入 | 已删除（批次 2） |
| `src/legacy/useHomeSplitLayout.ts` | hold | 首页 `src/components/home/HomePage.tsx` 仍使用 | 本轮保留 |
| `docs/legacy-html-inventory-p0-2026-03-13.md` | must-keep | 历史盘点基线证据 | 保留 |
| `docs/legacy-html-exit-checklist-p1-entry.md` | must-keep | 退场准入模板证据 | 保留 |

## 3. 分批退场执行记录
### 批次 1：删除 legacy 注入链路
1. 删除文件：
   - `src/components/LegacyPageView.tsx`
   - `src/legacy/pages.ts`
   - `src/legacy/parseLegacyHtml.ts`
2. 回归命令：
   - `cmd /c "npm run gate:l1 && npm run gate:l3"`
3. 结果：
   - 通过（L1/L3 均 pass）。

### 批次 2：删除 legacy HTML 资产目录
1. 删除目录：
   - `src/legacy-html/`（含 about/contact/home/journal/projects 全量遗留 HTML）
2. 回归命令：
   - `npm run build:verify`
   - `npm run visual:parity:smoke`
3. 结果：
   - 通过（含新增 `verify-editorial-workflow`）。

## 4. 回归证据摘要
1. `npm run build:verify`：
   - `verify-prerender-parity` pass
   - `verify-dynamic-contracts` pass
   - `verify-editorial-workflow` pass
2. `npm run visual:parity:smoke`：
   - 16 组壳层场景断言全部通过

## 5. 剩余风险与回退方案
### 剩余风险
1. `src/legacy/useHomeSplitLayout.ts` 仍是 legacy 命名模块，存在后续认知负担。
2. 历史文档（P4/P5 骨架）中仍描述已退场链路，可能造成阅读歧义。

### 回退方案
1. 若发现内容路由回退或兼容路径漂移：
   - 回退 `package.json` 与 `scripts/verify-editorial-workflow.mjs` 到上一可用版本后重新执行两条 DoD 命令。
2. 若删除 legacy 资产后发现隐藏依赖：
   - 从 Git 历史按批次恢复对应文件（先恢复批次 2，再评估是否需要恢复批次 1）。
   - 恢复后立即运行 `npm run build:verify` 与 `npm run visual:parity:smoke`。
