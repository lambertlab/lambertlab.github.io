# Current Architecture

## 1. 当前主语义
- canonical route 是页面唯一主路径定义。
- 仓库内不再保留页面级 compat route、compat adapter 或 compat registry 字段。
- 旧 `.html` URL 只允许通过统一 legacy URL bootstrap 归一化到 canonical，不允许回到第二套路由定义。

## 2. 当前代码主链
### 2.1 Route Layer
- `src/routes/**/index.tsx`
- 职责：定义 canonical 页面路径、head、页面主组件入口。

### 2.2 Legacy URL Normalization Layer
- `src/lib/legacyCompatPaths.ts`
- `src/routes/__root.tsx`
- 职责：在应用 bootstrap 阶段把历史 `.html` URL 统一归一化到 canonical。

### 2.3 Truth Source Layer
- `src/content/contentModels.ts`
- `src/lib/projectsApi.ts`
- 职责：分别承载内容主真值与 Projects 数据读取主入口。

### 2.4 Page Registry & Verify Layer
- `scripts/page-registry.mjs`
- `scripts/verify-prerender-parity.mjs`
- `scripts/verify-dynamic-contracts.mjs`
- `scripts/visual-shell-smoke.mjs`
- `scripts/verify-editorial-workflow.mjs`
- 职责：围绕 canonical 主语义做页面登记与回归校验。

## 3. 当前兼容策略
- 页面级 compat 已退场。
- legacy URL 只允许走统一 bootstrap 归一化，不允许再建 `index[.]html.tsx` route。
- `page-registry.mjs` 只登记 canonical prerender 主事实。

## 4. 当前开发默认心智
1. 先认 canonical route。
2. 再看 legacy URL 是否需要统一归一化。
3. 再看真值入口在 `contentModels` 还是 `projectsApi`。
4. 最后再决定要跑哪些门禁。

## 5. 当前不该误读的对象
- 历史阶段治理文档已归档到 `docs/archive/`，不是当前最优入口。
- gate 的分层思想仍有效，但不应替代“先理解当前 canonical 主链”。
- 若 future 需求再次涉及 legacy URL，只能在统一入口层实现，不能恢复页面级 compat 结构。
