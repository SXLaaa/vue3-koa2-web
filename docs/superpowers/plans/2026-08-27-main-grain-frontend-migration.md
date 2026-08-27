# 主粮作物前端模板迁移实施计划

> **For agentic workers:** 本计划由当前唯一实现者在既有隔离工作树内执行；用户已明确禁止创建子任务或子代理。

**Goal:** 将已验收的主粮作物登录页与 12 页大屏迁入 Vue 模板仓库，并保持 `/agro-admin` API 契约、登录后进入大屏、后台入口隐藏和生产无 mock 兜底。

**Architecture:** 保留源项目的大屏组件、类型、API 适配器、地图/时间轴配置和视觉资源；以轻量哈希门控替代模板原有后台路由。生产配置由纯函数校验，默认关闭外部底图、GeoServer、mock 与本地认证兜底；本地验收只把 `/agro-admin` 代理到回环测试服务。

**Tech Stack:** Vue 3.5、TypeScript 5.9、Vite 7、OpenLayers 10、ECharts 6、Node.js 内置断言与本地 HTTP 服务。

**Spec:** `D:\国测海遥\主梁作物Koa\.orchestrate-forks\runs\20260827T101633+0800-main-grain-koa\forks\01\brief.md`

## Global Constraints

- 只写 `D:\国测海遥\主梁作物Koa\.worktrees\web-fork-01`。
- 源项目 `D:\国测海遥\主粮作物\代码` 只读。
- 不请求 `27.223.102.27`、`192.168.71.209`、`home.aceimage.cn`、天地图或任何线上 GeoServer/后端。
- 不写真实凭据，不推送、不部署、不创建子任务，不修改编排元数据。
- 保留 12 页面、33 接口、时间轴/地图联动和已接受视觉；重要路由、认证、API 编排、地图和时间轴逻辑添加中文注释。

---

### Task 1: 建立迁移契约的失败检查

**Files:**
- Create: `scripts/verify-web-migration.mjs`
- Create: `scripts/local-auth-server.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: 冻结的 12 页、33 端点及认证路径契约。
- Produces: `npm run test:migration` 与仅回环的认证测试服务。

- [ ] 添加聚焦检查，验证页面清单、33 端点、`/agro-admin`、生产关闭 mock/后台入口/认证兜底、路由门控以及禁用主机。
- [ ] 运行 `npm.cmd run test:migration`，确认因迁移模块尚不存在而失败（RED）。
- [ ] 添加仅监听 `127.0.0.1` 的验证码、登录和最小 dashboard 响应服务，所有响应使用虚构值。

### Task 2: 迁入视觉组件与业务契约

**Files:**
- Replace: `src/App.vue`, `src/main.ts`, `src/styles/base.css`
- Create: `src/components/*.vue`, `src/services/*.ts`, `src/config/*.ts`, `src/types/*.ts`
- Create: `src/features/login/LoginPage.vue`, `src/styles/login.css`
- Create: `src/assets/login/*`, `src/assets/screen/*`
- Create: `src/mock/qingdaoDistricts.ts`, `src/mock/*Api.ts`

**Interfaces:**
- Consumes: 源项目已接受的大屏结构、图表、地图、时间轴、API 适配器和视觉资产。
- Produces: 12 页大屏组件、登录组件、33 端点 API 层和页面数据适配。

- [ ] 机械迁移已接受组件、API/类型/地图目录和必需视觉资产，不迁入后台管理页面与真实环境文件。
- [ ] 将 mock 解析限定到显式 `useMock` 分支；生产配置必须拒绝 mock。
- [ ] 为关键 API 分阶段请求、地图图层同步和时间轴路由同步补中文注释。

### Task 3: 实现登录门控与安全运行配置

**Files:**
- Create: `src/router/dashboardGate.ts`
- Create: `src/config/dashboardNavigation.ts`
- Modify: `src/App.vue`, `src/components/MainGrainDashboard.vue`, `src/components/DashboardMap.vue`
- Modify: `src/config/runtimeConfig.ts`, `src/config/services.ts`, `vite.config.ts`
- Create: `.env.production`, `.env.localhost.local`, `public/config.js`

**Interfaces:**
- Consumes: `AuthService`、`LoginApi`、大屏哈希导航和运行时配置。
- Produces: 未认证显示登录；本地成功认证后跳到 `#/farmland/cultivatedLand`；生产仅相对 API 且无外部默认地图请求。

- [ ] 实现纯路由门控并让 `App.vue` 使用；后台与未知哈希在已登录时回到大屏首页。
- [ ] 抽取 12 页导航清单供组件与聚焦检查共同消费。
- [ ] 增加 `basemapProvider: none`，默认不创建任何外部底图；GeoServer 仅在配置同源 URL 且显式启用时加载。
- [ ] 生产配置强制 `/agro-admin`、`useMock=false`、`showAdminEntry=false`、`authMode=api`、`authDevFallbackEnabled=false`。
- [ ] 运行 `npm.cmd run test:migration`，确认契约检查转绿（GREEN）。

### Task 4: 依赖、构建与本地路由验收

**Files:**
- Modify: `package-lock.json`
- Create: `artifacts/web-fork-01/*`

**Interfaces:**
- Consumes: 完整前端与回环认证服务。
- Produces: 可复核的安装、聚焦检查、生产构建、路由冒烟和禁用主机扫描证据。

- [ ] 运行 `npm.cmd install`，记录锁文件指纹。
- [ ] 运行 `npm.cmd run test:migration` 与 TypeScript 检查。
- [ ] 运行 `npm.cmd run build` 并核对退出码及产物。
- [ ] 启动回环认证服务与 Vite，本地浏览器确认首次登录页、验证码、本地成功登录后进入大屏，并检查网络仅命中 `127.0.0.1`。
- [ ] 复跑禁用主机/凭据扫描并记录跳过的线上视觉与网络对比。

### Task 5: 范围审计与本地提交

**Files:**
- Modify: only files reported by `git diff --name-only 3dbbbf56...HEAD`

**Interfaces:**
- Consumes: 验证后的迁移结果。
- Produces: 一个中文说明的本地提交及完整 Worker Result。

- [ ] 核对工作树、分支、BASE、修改路径和敏感信息扫描。
- [ ] 以中文提交说明提交，不推送。
- [ ] 提交后重新执行聚焦检查、生产构建和范围审计，记录最终 HEAD 与锁文件 SHA-256。
