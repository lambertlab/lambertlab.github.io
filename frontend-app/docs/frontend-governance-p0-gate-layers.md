# 前端治理 P0：门禁分层落地说明

更新时间：2026-03-13

## 1. 目标
将门禁从“旧站整页像素一致优先”切换为“当前架构稳定优先”，并明确 L1/L2/L3 不可互相替代。

## 2. 三层门禁定义
| 层级 | 目标 | 执行命令 | 阻断条件 |
| --- | --- | --- | --- |
| L1 | 构建与预渲染契约稳定 | `npm run gate:l1` | 关键壳层片段缺失；关键链接错误；禁入路径回流；动态容器/fallback 缺失 |
| L2 | 壳层视觉稳定与关键区域存在 | `npm run gate:l2` | 壳层关键区域缺失；跨页 header 稳定性超阈值；关键断言导航失败 |
| L3 | 动态页面数据与结构合同稳定 | `npm run gate:l3` | 首页精选/Projects 列表/Projects 详情合同映射异常；loading/empty/error/retry 任一状态失效；URL 回放与兼容路径不一致 |

`npm run gate:all` 按 `L1 -> L3 -> L2` 串行执行。

## 3. baseline-site 退场结论
1. `baseline-site` 已在前端仓物理移除，不再参与运行时门禁。
2. L2 不再依赖 old/new 双站整页像素对比链路。
3. L2 放行核心为壳层关键区域存在性与跨页稳定性（header stability）。

## 4. expectedDiffs 归因治理（强约束）
`scripts/visual-parity.config.json` 的 `expectedDiffs` 必须使用结构化格式：

```json
{
  "home__desktop__light": {
    "category": "intentional-change",
    "reason": "Homepage Technology panel now renders Featured Projects from the unified projects contract."
  }
}
```

允许的 `category`：
- `intentional-change`
- `suspected-regression`

规则：
1. 缺少 `category` 或 `reason` 会直接使 `visual:parity:smoke` 失败。
2. `baseline-drift` 不允许再作为默认归因类别。
3. 无归因项禁止进入白名单。
4. `suspected-regression` 不允许长期滞留，必须转缺陷或修复任务。

## 5. 命令职责边界
1. `build:verify`：`build + L1 + L3`，用于结构与动态合同门禁。
2. `visual:parity:smoke`：执行 L2，聚焦壳层关键区域与稳定性；整页差异仅做归因诊断。
3. 任一层失败均阻断，不得以其他层通过替代。
