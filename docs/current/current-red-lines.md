# Current Red Lines

## 1. 路由与兼容红线
- 不允许把 compat route 再当成第二份页面主定义。
- 不允许新增页面默认复制一份 `.html` route。
- 任何 compat 保留都必须能回答：为什么保留、谁消费、何时退出、如何验证。

## 2. 内容主真值红线
- 内容主真值只允许落在 `src/content/contentModels.ts`。
- 内容路由只允许消费内容模型，不允许回退到 `legacyPages`、`LegacyPageView`、`legacy-html ?raw`。
- 模板组件只做渲染，不持有第二份内容主真值副本。
- 内容域规则的适用边界见：`docs/current/current-content-domain.md`

## 3. runtime 与 legacy 红线
- 不允许重新引入 `src/lib/useRuntimeScripts.ts` 作为核心页面控制入口。
- 不允许重新引入 `public/js/home-featured-projects.js`、`public/js/projects-catalog.js`、`public/js/projects-runtime.js` 这类旧控制层。
- 不允许把 archive 文档重新升格为现行规则入口。

## 4. 页面登记红线
- prerender、dynamic contracts、visual smoke 必须围绕 canonical 主语义组织。
- `scripts/page-registry.mjs` 的 `compatPaths` 只能作为历史接入证据，不能被误用为主链真值来源。
- 不允许新增“只有 compat 覆盖、canonical 不覆盖”的验证路径。

## 5. 治理减负红线
- 不允许为了减负直接砍掉 `npm run build:verify` 或 `npm run visual:parity:smoke`。
- 不允许把 current 规则、archive 留档、阶段术语继续混成同一入口层。
- 不允许新增治理规则却不说明：保护对象、适用范围、默认命令、退出条件。
