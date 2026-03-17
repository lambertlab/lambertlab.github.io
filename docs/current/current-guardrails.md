# Current Guardrails

## 1. 默认命令
### 1.1 日常开发
- `npm run dev`
- 用途：本地开发与页面调试。

### 1.2 默认发布前验证
- `npm run verify`
- 用途：默认串行执行 `build:verify + visual:parity:smoke`。

### 1.3 构建入口
- `npm run build`
- 用途：构建与 TypeScript 校验。

## 2. 验证模式
### 2.1 默认验证
- 命令：`npm run verify`
- 适用：大多数改动的发布前默认验证。
- 组成：
  - `npm run build:verify`
  - `npm run visual:parity:smoke`

### 2.2 结构与合同验证
- 命令：`npm run build:verify`
- 适用：route、compat adapter、page registry、prerender、dynamic contract、content model 等结构性改动。
- 覆盖：
  - build
  - type
  - prerender parity
  - dynamic contracts
  - editorial workflow

### 2.3 内容域专项验证
- 命令：`npm run verify:content`
- 实际执行：`npm run verify:editorial-workflow`
- 适用：只想快速确认内容主真值、model-first 编辑路径、legacy 回流红线时。
- 详细边界：见 `docs/current/current-content-domain.md`

### 2.4 深验证
- 命令：`npm run verify:deep`
- 实际执行：`npm run gate:all`
- 适用：需要显式跑完整 gate 分层时。
- 补充：若是视觉排障，再使用 `npm run visual:parity:full`。

## 3. Gate 语义映射
### 3.1 L1
- 命令：`npm run gate:l1`
- 关注：构建与 prerender parity。

### 3.2 L2
- 命令：`npm run gate:l2`
- 关注：shell visual smoke。

### 3.3 L3
- 命令：`npm run gate:l3`
- 关注：dynamic contracts。

### 3.4 Gate 使用原则
- 日常开发默认不用先记 `L1 / L2 / L3`。
- 先记住：`verify` 是默认入口。
- 只有在需要显式定位层级时，再进入 `gate:*`。

## 4. 什么时候至少跑什么
### 4.1 普通 UI / 文案 / 路由小改
- 默认至少跑：
  - `npm run verify`

### 4.2 结构性改动
- 包括：route 结构、compat adapter、page registry、content domain 规则、核心脚本修改。
- 默认至少跑：
  - `npm run verify`
- 必要时补：
  - `npm run verify:deep`
  - 专项串行 compat 回归
  - `npm run visual:parity:full`

### 4.3 纯内容域改动
- 先确认变更是否只落在 `src/content/contentModels.ts`。
- 默认至少跑：
  - `npm run verify`
- 快速专项检查可补：
  - `npm run verify:content`

## 5. 当前高价值护栏
- 不允许重新引入 `public/js/*.js` 作为核心页面控制层。
- 不允许内容路由回退到 `legacyPages` / `LegacyPageView` / `legacy-html ?raw`。
- 不允许 canonical / compat 再长回双主语义。
- 不允许 gate 噪音白名单失去证据、失效条件与到期时间。

## 6. 当前深验证入口
- `npm run gate:l1`
- `npm run gate:l2`
- `npm run gate:l3`
- `npm run gate:all`
- `npm run verify:deep`
- `npm run visual:parity:full`

> 这些入口仍可保留，但应视为专项或内部实现入口，而不是日常开发必须先记住的命令面。
