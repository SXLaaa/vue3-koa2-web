<!--
 * @Author: shixl shixl@dist.com.cn
 * @Date: 2024-06-26 10:11:49
 * @LastEditors: shixiaolei
 * @LastEditTime: 2026-04-07 15:47:30
 * @FilePath: /vue3.0-koa2/vue3-koa2-web/README.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

# vue3-koa2-web

vue3+elementPlus+Koa2
node v18.19.0
npm 10.2.3
yarn 1.22.19
谷歌 98 以上

# 安装依赖（MAC、Windows 切换需删除 yarn.lock）

## 更换依赖安装源

npm config set registry https://registry.npmjs.org/
npm config set registry https://registry.npm.taobao.org

## 清空缓存

yarn cache clean
npm cache clean

yarn/npm

# cesium 依赖引入切换

index.html

路径：vue3-koa2-web\public
windows Cesium
Mac Cesium-Mac

# 运行

npm run dev

注意：如运行失败，需要删除依赖重新下载；用npm run dev 和 yarn dev各自试试；
管理员/123456

# 白名单访问三维

http://localhost:8080/#/three/cesium/cesiumLayer
http://localhost:8080/#/three/cesium/SplitScreenCesium
http://localhost:8080/#/three/mapBox/mapBoxLayer

# 白名单访问deepseek

http://localhost:8080/#/deepSeek

###

## Docker 外网部署说明

- 本地开发保持不变：
  `/api -> http://localhost:3000`
  `/ws -> 通过 Vite 代理到 ws://localhost:3000`
  `/modelData`、`/geoserver -> http://localhost:8089`

- 生产环境会自动切到同域名相对路径：
  `/api`
  `/ws`
  `/modelData`
  `/geoserver`

- 因此前端部署到 Docker 后，不要再把接口地址写成 `localhost`。

- `nginx.conf` 已预留以下反向代理，要求后端容器内这些服务可访问：
  `webserver:3000` API / WebSocket
  `webserver:8089` modelData / geoserver

- 如果你的后端容器名不是 `webserver`，请同步修改 `nginx.conf` 里的 `proxy_pass`。

- 如果线上启用 HTTPS，前端会自动把 WebSocket 从 `ws` 切到 `wss`。

### Docker 启动示例

```bash
docker build -t vue3-koa2-web .
docker run -d --name vue3-koa2-web -p 80:80 vue3-koa2-web
```

### 项目根目录一键启动

在项目根目录 `vue3.0-koa2` 下执行：

```bash
docker compose up -d --build
```

默认端口：

- 前端：`http://localhost:8080`
- Koa API：`http://localhost:3000`
- WebSocket：`ws://localhost:8080/ws`
- MongoDB：`localhost:27017`

AI 密钥配置：

- 后端已不再在代码里保存明文密钥
- 参考 `vue3-koa2-server/.env.example`
- 本地运行时请自行注入：
  `DEEPSEEK_API_KEY`
  `DASHSCOPE_API_KEY`
- Docker Compose 会自动透传宿主机环境变量中的这两个值

说明：

- 这套 compose 只在你执行 `docker compose up` 时生效，不影响平时本地 `npm run dev`
- 如果你本机已经占用了这些端口，需要先改 `docker-compose.yml` 的左侧宿主机端口
- 建议从项目根目录启动，不要和 `vue3-koa2-server/docker-compose.yml` 混用

###

查看进程
netstat -ano | findstr :3001
杀死进程
taskkill /F /PID 32468
