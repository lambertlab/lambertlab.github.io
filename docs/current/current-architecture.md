# Current Architecture

## 1. 当前主语义
- canonical route 是页面唯一主路径定义。
- compat route 只承担旧链接接入与归一化回放，不再承担第二份页面主定义。
- 新页面默认只建 canonical，除非显式登记 compat 保留原因、消费入口、退出条件与验证方式。

## 2. 当前代码主链
### 2.1 Route Layer
- `src/routes/**/index.tsx`
- 职责：定义 canonical 页面路径、head、页面主组件入口。

### 2.2 Compat Adapter Layer
- `src/routes/**/index[.]html.tsx`
- `src/components/content/PublicCompatRouteAdapter.tsx`
- `src/components/projects/ProjectsCompatRouteAdapter.tsx`
- `src/components/admin/projects/AdminCompatRouteAdapter.tsx`
- 职责：接住旧 `.html` 路径并回放到 canonical。

### 2.3 Normalization Layer
- `src/lib/publicCompatPathNormalization.ts`
- `src/lib/projectsCompatPathNormalization.ts`
- `src/lib/adminCompatPathNormalization.ts`
- 职责：定义 compat 路径如何归一化到 canonical。

### 2.4 Truth Source Layer
- `src/content/contentModels.ts`
- `src/lib/projectsApi.ts`
- 职责：分别承载内容主真值与 Projects 数据读取主入口。

### 2.5 Page Registry & Verify Layer
- `scripts/page-registry.mjs`
- `scripts/verify-prerender-parity.mjs`
- `scripts/verify-dynamic-contracts.mjs`
- `scripts/visual-shell-smoke.mjs`
- `scripts/verify-editorial-workflow.mjs`
- 职责：围绕 canonical 主语义做页面登记与回归校验。

## 3. 当前兼容策略
### 3.1 public
- 统一使用 `PublicCompatRouteAdapter`。
- 目标：旧链接可访问，但主流程不再主动走 `.html`。

### 3.2 projects
- 统一使用 `ProjectsCompatRouteAdapter`。
- 目标：`/projects/` 仍是主入口，`/projects/index.html` 只承担历史接入。

### 3.3 admin
- 统一使用 `AdminCompatRouteAdapter`。
- 目标：admin canonical 路径是主语义，compat 只做接入与回放。

## 4. 当前开发默认心智
1. 先认 canonical route。
2. 再看是否触碰 compat 接入。
3. 再看真值入口在 `contentModels` 还是 `projectsApi`。
4. 最后再决定要跑哪些门禁。

## 5. 当前不该误读的对象
- `scripts/page-registry.mjs` 中的 `compatPaths` 是历史接入证据，不是页面主链真值。
- 历史阶段治理文档已归档到 `docs/archive/`，不是当前最优入口。
- gate 的分层思想仍有效，但不应替代“先理解当前代码主链”。
