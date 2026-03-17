# 前端治理 P5.2：门禁降噪与验证分层落地

更新时间：2026-03-14

## 1. 分层口径
1. `blocking`：阻断级，命中即失败。
2. `observing`：观察级，输出告警但不阻断。
3. `info`：信息级，仅用于回放与定位上下文。

所有门禁脚本统一通过 `scripts/gate-layering.mjs` 输出分层摘要，禁止阻断与观察混排。

## 2. 白名单清单（可追踪）
来源：`scripts/gate-noise-whitelist.json`

| 规则ID | 适用范围 | 降级级别 | 证据 | 失效条件 | 到期 |
| --- | --- | --- | --- | --- | --- |
| `WL-P5.2-L2-HEADER-RUNTIME-CLOSED-001` | `visual-shell.header-stability.runtime` | `observing` | `qa/visual-parity/2026-03-13T06-03-40-697Z/report.json` | Header stability 连续 7 次 smoke 不再出现 browser context closed 错误 | 2026-04-30 |

治理约束：
1. 白名单必须包含规则ID、适用范围、证据、失效条件、到期时间。
2. 白名单只允许降级到 `observing/info`，禁止覆盖 `blocking` 硬规则。
3. 禁止全局永久豁免（`scope=*` 或无到期规则会被脚本校验拒绝）。

## 3. 覆盖矩阵（必测/抽样）
| 门禁项 | 命令 | 分层 | 风险类型 | 覆盖口径 |
| --- | --- | --- | --- | --- |
| 构建与类型检查 | `npm run build` | `blocking` | 构建可发布性 | 必测 |
| prerender 壳层与片段契约 | `node scripts/verify-prerender-parity.mjs` | `blocking` | 结构回归 | 必测 |
| 动态合同与四态回放（含 retry） | `node scripts/verify-dynamic-contracts.mjs` | `blocking` | 交互可用性/合同一致性 | 必测 |
| `/projects/` 与 `/projects/index.html` 回放一致性 | `node scripts/verify-dynamic-contracts.mjs` | `blocking` | URL 兼容真值漂移 | 必测 |
| 壳层关键区域存在性 | `node scripts/visual-shell-smoke.mjs` | `blocking` | 导航壳层稳定性 | 必测 |
| Header stability 阈值检查 | `node scripts/visual-shell-smoke.mjs` | `blocking` | 跨页布局跳变 | 必测 |
| Header runtime 噪音降级（白名单） | `node scripts/visual-shell-smoke.mjs` | `observing` | 执行环境噪音 | 抽样持续观察 |
| expected attribution 缺失（非 smoke） | `node scripts/visual-parity.mjs --mode=full` | `observing` | 归因治理完整性 | 抽样 |

