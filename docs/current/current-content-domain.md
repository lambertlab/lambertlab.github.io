# Current Content Domain

## 1. 适用范围
- 仅适用于内容页与内容模型相关改动。
- 当前覆盖对象：
  - `src/content/contentModels.ts`
  - `src/routes/about/**`
  - `src/routes/contact/**`
  - `src/routes/journal/**`
  - 对应内容页模板组件与详情模板消费链

## 2. 当前内容域规则
### 2.1 唯一主真值
- 内容主真值只允许落在 `src/content/contentModels.ts`。
- 路由与模板组件只消费模型，不持有第二份主真值副本。

### 2.2 当前验证入口
- 默认验证：`npm run verify`
- 内容域专项验证：`npm run verify:content`
- 当前专项验证实际执行：`npm run verify:editorial-workflow`

### 2.3 当前防回流规则
- 禁止内容路由回退到 `legacyPages`、`LegacyPageView`、`legacy-html ?raw`。
- 禁止把内容域规则扩写成全仓制度语言。
- 禁止为内容页单独长出新的 runtime 控制层。

## 3. 什么属于内容域改动
- 修改页面文案、文章内容、内容模型字段
- 修改内容页模板消费方式
- 修改内容页 canonical / compat 一致性逻辑
- 调整内容域的编辑工作流说明与 guardrail 规则

## 4. 什么不属于内容域改动
- 一般性壳层样式调整
- admin / projects 数据链改动
- page registry 主体结构调整
- 与内容模型无关的脚本或构建配置调整

## 5. 使用原则
- 如果改动只属于内容域，优先使用内容域语言说明，而不是把它上升为全仓架构问题。
- 如果改动越过内容域边界，必须额外说明它影响了哪类 current docs 与哪类默认验证。
