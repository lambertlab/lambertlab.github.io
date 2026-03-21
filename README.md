# LambertLab 前端仓库

## 快速开始
```powershell
npm install
npm run dev
```

## 根目录怎么看

把根目录分成三类来看最清楚：

- 活动骨架：`public/`、`scripts/`、`src/`
- 本地 / 构建产物：`.output/`、`.tanstack/`、`node_modules/`、`qa/`
- 本地工具设置：`.vscode/`

当前结论：
- 当前前端仓真正需要长期维护的是 `public/`、`scripts/`、`src/` 和根目录配置文件
- `.output/`、`.tanstack/`、`node_modules/`、`qa/` 更像本机状态或验证产物，不是项目结构本体
- `qa/visual-parity/` 只保留 `latest/` 和最近两轮时间戳结果，避免验证证据无限膨胀
- 空的 `.github/` 占位和历史 `baseline-manifest.json` 已退出活动路径

## 默认命令
- `npm run dev`
  - 本地开发入口
- `npm run build`
  - 构建与 TypeScript 校验
- `npm run verify`
  - 默认发布前验证，等价于 `npm run build:verify && npm run visual:parity:smoke`
  - 当两项都需要时，这是首选串行入口；不要手动并行这两条命令
- `npm run preview`
  - 本地预览构建产物

## 当前入口
### 代码主入口
- 路由：`src/routes/`
- 内容主真值：`src/content/contentModels.ts`
- Projects 数据入口：`src/lib/projectsApi.ts`
- 验证脚本：`scripts/`

## 验证模式
### 默认验证
- `npm run verify`
- 适用：大多数前端改动的发布前默认验证
- 说明：当 `build:verify` 与 `visual:parity:smoke` 都需要执行时，默认通过这个入口串行完成，不要手动并行

### 结构 / 合同验证
- `npm run build:verify`
- 适用：路由、page registry、compat adapter、dynamic contract、content model 等结构性改动

### 内容域专项验证
- `npm run verify:content`
- 适用：快速确认内容域规则、model-first 编辑工作流与 legacy 回流红线

### 深验证
- `npm run verify:deep`
- `npm run visual:parity:full`
- 适用：需要显式跑完整 gate 分层或做更深视觉排查时

## 验证互斥规则
- `npm run build:verify` 与 `npm run visual:parity:smoke` 默认视为互斥验证，不并行执行
- 若两者都要跑，默认顺序是 `build:verify -> visual:parity:smoke`
- 若并行失败但串行成功，应归类为资源竞争型假失败，而不是业务回归

## Gate 映射
- `L1`：`npm run gate:l1`，关注 build 与 prerender parity
- `L2`：`npm run gate:l2`，关注 shell visual smoke
- `L3`：`npm run gate:l3`，关注 dynamic contracts
- `npm run gate:all`：按 `L1 -> L3 -> L2` 串行执行

## AI 工作流入口
- 先读工作区 `AGENTS.md`
- 再读本仓 `AGENTS.md`
- 非 trivial 任务使用 `control/live/active/<task-slug>/MISSION.md`
- 只有在需要查看详细附录时，再读 `control/README.md` 或 `control/REFERENCE.md`
- 默认不要读取归档材料或无关参考文档

## 备注
- `baseline-manifest` 已退场，不再参与当前前端工作流
- `visual:parity:smoke` 当前使用单站点 shell 稳定性断言
