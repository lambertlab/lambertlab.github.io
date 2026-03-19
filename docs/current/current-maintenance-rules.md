# Current Maintenance Rules

## 1. current 与 archive 维护规则
- 今天有效的规则只进入 `docs/current/`。
- 历史阶段文档、退场记录、阶段性评审只进入 `docs/archive/`。
- 若 current 与 archive 有冲突，以 current 为准。

## 2. 命令与护栏维护规则
- 默认入口维持：`dev / build / verify`。
- 新增专项验证入口时，必须说明：
  - 保护对象是什么
  - 默认何时使用
  - 是否属于深验证
  - 是否需要写入 current docs
- 不允许为了减负直接削弱现有 `verify` 主链。

## 3. whitelist 与噪音治理规则
- 白名单必须保留：规则 ID、适用范围、证据、失效条件、到期时间。
- 临时噪音只能降级，不能永久豁免。
- 到期或证据失效后，应优先清理规则，而不是继续堆新豁免。

## 4. legacy URL 维护规则
- legacy URL 只能通过统一入口层归一化到 canonical。
- 不允许重新引入 `index[.]html.tsx`、compat adapter、compat registry 字段。
- 若未来必须保留新的历史 URL 入口，必须同步更新 current docs、archive 留档与最小验证口径。

## 5. 文档更新规则
- README 只放当前入口，不堆阶段术语。
- current docs 只写今天有效的规则，不复述历史演进。
- archive 文档可保留历史语境，但不应重新出现在首屏入口层。
