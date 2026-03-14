# LambertLab Frontend

## 门禁分层（P0 冻结）
- `L1` 构建与预渲染契约：`npm run gate:l1`
- `L2` 壳层视觉稳定：`npm run gate:l2`
- `L3` 动态页面数据与结构：`npm run gate:l3`
- 一键串行：`npm run gate:all`

`npm run build:verify` 当前等价于 `build + L1 + L3`，用于结构与动态合同放行。

## 关键命令
```bash
npm install
npm run build:verify
npm run visual:parity:smoke
```

## 治理文档
- `docs/frontend-governance-p0-gate-layers.md`
- `docs/frontend-governance-p5.3-editorial-workflow-and-legacy-sunset.md`（当前态）
- `docs/legacy-html-inventory-p0-2026-03-13.md`（历史证据）
- `docs/legacy-html-exit-checklist-p1-entry.md`（历史证据）
- `docs/content-page-convergence-p4-2026-03-13.md`（历史态）

## baseline-site 定位
`baseline-site` 已完成退场，不再作为门禁输入。`visual:parity:smoke` 统一采用单站壳层结构稳定门禁（关键节点断言 + header stability）。
