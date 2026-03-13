# legacy-html 退出检查表（P1 准入）

更新时间：2026-03-13

## 1. 使用方式
对每个候选页面单独执行本检查表。所有硬性项必须通过，才可判定“允许退出 legacy-html 承载”。

## 2. 准入判定规则
1. `硬性项` 全通过：准入 `PASS`。
2. 任一 `硬性项` 不通过：准入 `FAIL`，不得进入替换发布。
3. `建议项` 不阻断，但必须登记风险与补偿计划。

## 3. 检查项
| 类型 | 检查项 | 通过标准 | 证据/命令 |
| --- | --- | --- | --- |
| 硬性 | 数据依赖迁移完成 | 页面数据全部来自明确合同（如 `/projects`、`/projects/{slug}`），不再依赖 legacy 注入补丁 | 代码审查 + `npm run gate:l3` |
| 硬性 | 结构契约可自动发现回归 | 关键壳层、关键容器、关键链接、fallback 容器已纳入自动检查 | `npm run gate:l1` |
| 硬性 | 壳层视觉稳定可持续保障 | header/footer/theme/status/nav 与关键 hero/content 容器稳定，L2 无阻断 | `npm run gate:l2` |
| 硬性 | loading/empty/error/retry 四态完整 | 动态页面四态均可触发且交互可恢复（含 retry） | `npm run gate:l3` + 手工抽检 |
| 硬性 | URL 回放与兼容路径一致 | `/projects/` 与 `/projects/index.html`（含详情页 index 兼容路径）回放一致 | `npm run gate:l3` |
| 硬性 | 回退策略明确 | 已定义回退版本、回退触发条件、执行命令与负责人 | 发布单/回退脚本记录 |
| 建议 | expectedDiffs 无 `suspected-regression` 长驻项 | 若存在，已转缺陷并附处理时限 | `scripts/visual-parity.config.json` 审核 |
| 建议 | legacy 资产清理计划已登记 | 替换后遗留文件删除窗口与 owner 明确 | 技术债台账 |

## 4. 页面级判定模板
```md
页面：<path>
日期：<YYYY-MM-DD>
负责人：<name>

- 硬性项通过数：<n>/<total>
- 建议项通过数：<n>/<total>
- 准入结论：PASS | FAIL
- 主要风险：
  - <risk 1>
  - <risk 2>
- 回退方案：
  - 触发条件：<condition>
  - 回退动作：<command/steps>
  - 目标版本：<tag/commit>
```

## 5. 与门禁命令的对应关系
- L1：`npm run gate:l1`
- L2：`npm run gate:l2`
- L3：`npm run gate:l3`
- 汇总：`npm run gate:all`
