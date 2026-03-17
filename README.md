# LambertLab Frontend

## Quick Start
```bash
npm install
npm run dev
```

## Default Commands
- `npm run dev`
  - 本地开发入口
- `npm run build`
  - 构建与 TypeScript 校验
- `npm run verify`
  - 默认发布前验证；等价于 `npm run build:verify && npm run visual:parity:smoke`
- `npm run preview`
  - 本地预览构建产物

## Current Entry
### Code
- routes：`src/routes/`
- content truth source：`src/content/contentModels.ts`
- projects data entry：`src/lib/projectsApi.ts`
- verify scripts：`scripts/`

### Current Docs
- `docs/current/current-architecture.md`
- `docs/current/current-guardrails.md`
- `docs/current/current-red-lines.md`
- `docs/current/current-content-domain.md`
- `docs/current/current-change-checklist.md`
- `docs/current/current-maintenance-rules.md`

## Validation Modes
### Default
- `npm run verify`
- 适用：大多数前端改动的发布前默认验证。

### Structure & Contracts
- `npm run build:verify`
- 适用：路由、page registry、compat adapter、dynamic contract、content model 等结构性改动。

### Content Domain
- `npm run verify:content`
- 适用：只想快速确认内容域规则、model-first 编辑工作流与 legacy 回流红线是否被破坏。

### Deep Validation
- `npm run verify:deep`
- `npm run visual:parity:full`
- 适用：需要显式跑完整 gate 分层或更深视觉排查时使用。

## Gate Mapping
- `L1`：`npm run gate:l1`，关注 build 与 prerender parity
- `L2`：`npm run gate:l2`，关注 shell visual smoke
- `L3`：`npm run gate:l3`，关注 dynamic contracts
- `npm run gate:all`：按 `L1 -> L3 -> L2` 串行执行

## Collaboration Entry
- 先读：`../../control-plane/任务/CURRENT_TASK.md`
- 涉及接口再读：`../../control-plane/接口协议/CURRENT_API.md`
- 找不到入口时，再按本轮任务单读取规格 / 协议 / 任务文档

## Archive Docs
- 历史治理文档与 legacy 证据已归档到：`docs/archive/README.md`
- 若需追溯阶段性判断、白名单演进、legacy 退场证据，请从 archive 进入。

## Notes
`baseline-site` has been sunset and is no longer gate input.
`visual:parity:smoke` now uses single-site shell stability assertions.
