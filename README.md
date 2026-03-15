# LambertLab Frontend

## Low-Cost Collaboration Entry
- 先读：`../../control-plane/任务/CURRENT_TASK.md`
- 涉及接口再读：`../../control-plane/接口协议/CURRENT_API.md`
- 找不到入口时，再按本轮任务单读取规格/协议/任务文档

## Gate Layers (P0)
- `L1` build and pre-render contract: `npm run gate:l1`
- `L2` shell visual stability: `npm run gate:l2`
- `L3` dynamic page data and structure: `npm run gate:l3`
- all-in-one: `npm run gate:all`

`npm run build:verify` is currently equivalent to `build + L1 + L3`.

## Key Commands
```bash
npm install
npm run build:verify
npm run visual:parity:smoke
```

## Governance Docs
- `docs/frontend-governance-p0-gate-layers.md`
- `docs/frontend-governance-p5.3-editorial-workflow-and-legacy-sunset.md` (current)
- `docs/legacy-html-inventory-p0-2026-03-13.md` (historical)
- `docs/legacy-html-exit-checklist-p1-entry.md` (historical)
- `docs/content-page-convergence-p4-2026-03-13.md` (historical)

## baseline-site Status
`baseline-site` has been sunset and is no longer gate input.
`visual:parity:smoke` now uses single-site shell stability assertions.
