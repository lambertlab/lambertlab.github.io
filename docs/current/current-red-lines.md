# Current Red Lines

## 1. 路由与历史 URL 红线
- 不允许重新引入页面级 compat route。
- 不允许新增页面默认复制一份 `.html` route。
- legacy URL 如需保留，只能通过统一归一化入口实现，不能恢复第二套路由定义。

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
- `scripts/page-registry.mjs` 只允许登记 canonical prerender 事实。
- 不允许新增任何只为 `.html` 路径存在的登记、验证或路由资产。

## 5. 治理减负红线
- 不允许为了减负直接砍掉 `npm run build:verify` 或 `npm run visual:parity:smoke`。
- 不允许把 current 规则、archive 留档、阶段术语继续混成同一入口层。
- 不允许新增治理规则却不说明：保护对象、适用范围、默认命令、退出条件。
