# 后端联调起步清单（本地自测版）

## 目标
- 在本地把前后端接口打通，保持当前页面视觉/交互不回归。
- 先完成最小可用联调闭环，再扩展功能。

## 接口契约（保持不变）
- 运行时配置来源：`window.__APP_CONFIG__`
- 必须字段：
  - `API_BASE`
  - `STATUS_SUMMARY_PATH`
  - `HEALTH_PATH`
  - `HOME_CONTENT_PATH`
- 建议字段：
  - `STATUS_CACHE_TTL_MS`
  - `REQUEST_TIMEOUT_MS`
  - `RETRY_TIMES`

## 联调范围（第一批）
- Header 状态灯：
  - `loading / ok / error` 三态正确显示
  - 超时与失败 fallback 正常
- 首页内容拉取：
  - 成功时使用接口数据
  - 失败时保留静态兜底内容

## 本地执行步骤
1. 启动后端（`lambertlab-backend`）并确认可访问健康接口。
2. 启动前端（`lambertlab.github.io/frontend-app`）开发或预览服务。
3. 在浏览器检查：
   - 首页首屏加载
   - Header 状态灯初始态与最终态
   - 主题切换跨页保持
4. 执行最小门禁：
   - `npm run build:verify`
   - `npm run visual:parity:smoke`

## 最小门禁（通过条件）
- 构建通过，静态预渲染路由可达。
- parity smoke 通过（不允许新增页面级视觉漂移）。
- 交互抽样通过：
  - 主题胶囊不闪烁
  - 状态灯不延迟插入
  - 主导航跨页不抽搐

## 每次测试后必须记录
- 本次命令清单（build / parity / 其它）
- 可清理产物清单（例如 `.output/`、`qa/visual-parity/`、临时缓存目录）
- 是否已清理（是/否）
