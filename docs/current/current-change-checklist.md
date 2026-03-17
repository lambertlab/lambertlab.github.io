# Current Change Checklist

## 1. 新增改动六问
新增任何前端改动前，默认先回答这 6 个问题：
1. 这次改动的 canonical 主路径 / 主页面是什么？
2. 这次改动是否触碰 compat 接入、旧链接或历史路径回放？
3. 这次改动的数据或内容真值入口在哪里？
4. 这次改动会影响哪类护栏：build、visual、dynamic、content domain？
5. 这次改动是否触碰当前红线或需要更新 current docs？
6. 这次改动至少要跑哪组验证？

## 2. 默认回答模板
- Canonical Path：`<页面 / 路径>`
- Compat Impact：`none / public / projects / admin / other`
- Truth Source：`contentModels / projectsApi / route loader / other`
- Guardrail Impact：`build / visual / dynamic / content-domain`
- Docs Impact：`current docs / archive only / none`
- Minimum Verification：`verify / build:verify / verify:content / verify:deep / visual:parity:full`

## 3. 最小验证建议表
| 变更类型 | 默认至少跑 | 需要时再补 |
| --- | --- | --- |
| 普通 UI / 文案小改 | `npm run verify` | - |
| 路由 / compat / page registry 改动 | `npm run verify` | `npm run verify:deep` |
| 纯内容域改动 | `npm run verify` | `npm run verify:content` |
| 深度视觉排障 | `npm run verify` | `npm run visual:parity:full` |
| 分层定位问题 | `npm run verify` | `npm run gate:l1/l2/l3` |

## 4. 使用要求
- 如果六问回答不清，默认不应直接进入实现。
- 如果要新增一条治理规则，必须先判断它属于 current 还是 archive。
- 如果改动涉及 compat、page registry 或 legacy 证据，必须同时说明保留理由、退出条件与最小验证。
