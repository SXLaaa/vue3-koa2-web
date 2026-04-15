<template>
  <div class="deepseek-page">
    <div class="deepseek-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <span class="hero-badge">DeepSeek Workspace</span>
          <h1>更清晰的 AI 对话界面</h1>
          <p>
            保留现有 WebSocket 交互方式，优化消息层次、等待状态和输入区域，让对话页更像一个正式产品页面。
          </p>
          <div class="hero-actions">
            <button class="plan-entry" @click="openLearningPlan">
              查看 AI 学习计划
            </button>
            <button class="deploy-entry" @click="openDeployGuide">
              查看阿里云部署手册
            </button>
          </div>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <span class="metric-label">连接状态</span>
            <strong :class="['metric-value', connectionStatus]">
              {{ statusText }}
            </strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">消息总数</span>
            <strong class="metric-value neutral">{{ messages.length }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">当前模式</span>
            <strong class="metric-value neutral">{{ currentModeText }}</strong>
          </div>
        </div>
      </section>

      <section class="chat-card">
        <header class="chat-header">
          <div>
            <h2>智能问答</h2>
            <p>输入问题后回车或点击发送，消息会实时追加到会话流中。</p>
          </div>
          <span :class="['status-pill', connectionStatus]">{{ statusText }}</span>
        </header>

        <div ref="messageListRef" class="chat-messages">
          <div v-if="!messages.length && !isLoading" class="empty-state">
            <div class="empty-icon">DS</div>
            <h3>开始一次新对话</h3>
            <p>可以先试试需求拆解、代码解释、页面文案优化或接口设计问题。</p>
            <div class="suggestion-list">
              <button
                v-for="item in suggestions"
                :key="item"
                class="suggestion-chip"
                @click="applySuggestion(item)"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <article
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-row', message.role === 'user' ? 'is-user' : 'is-bot']"
          >
            <div class="message-avatar">
              {{ message.role === "user" ? "我" : "AI" }}
            </div>
            <div class="message-bubble">
              <div class="message-meta">
                <span>{{ message.role === "user" ? "我" : getAssistantLabel(message) }}</span>
                <span>{{ message.time || formatTime() }}</span>
              </div>
              <p>{{ message.content }}</p>
            </div>
          </article>

          <article v-if="isLoading" class="message-row is-bot">
            <div class="message-avatar">AI</div>
            <div class="message-bubble loading-bubble">
              <div class="message-meta">
                <span>{{ selectedModelLabel }}</span>
                <span>生成中</span>
              </div>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </article>
        </div>

        <footer class="chat-editor">
          <div class="editor-frame">
            <div class="editor-toolbar">
              <label for="modelTypeSelect">模型调用类型</label>
              <select
                id="modelTypeSelect"
                v-model="selectedModelType"
                :disabled="isLoading"
              >
                <option
                  v-for="item in modelOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </option>
              </select>
            </div>
            <textarea
              v-model="inputMessage"
              rows="3"
              maxlength="2000"
              :disabled="isLoading || !canSendByCurrentModel"
              placeholder="输入你的问题，例如：帮我优化这个 Vue 页面结构"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="editor-bar">
              <span class="editor-tip">
                Enter 发送，Shift + Enter 换行
              </span>
              <span class="editor-count">{{ inputMessage.length }}/2000</span>
            </div>
          </div>
          <button
            class="send-button"
            :disabled="
              isLoading ||
              !inputMessage.trim() ||
              !canSendByCurrentModel
            "
            @click="sendMessage"
          >
            {{ isLoading ? "发送中..." : "发送消息" }}
          </button>
        </footer>
      </section>
    </div>

    <div
      v-if="showLearningPlan"
      class="plan-overlay"
      @click.self="closeLearningPlan"
    >
      <section class="plan-modal">
        <header class="plan-header">
          <div>
            <h3>前端工程师 AI 学习练习计划</h3>
            <p>基于当前 DeepSeek 页面，按 6 周循序渐进练习。</p>
          </div>
          <button class="plan-close" @click="closeLearningPlan">关闭</button>
        </header>
        <div class="plan-content">
          <article
            v-for="item in learningPlan"
            :key="item.week"
            class="plan-item"
          >
            <h4>{{ item.week }}：{{ item.title }}</h4>
            <p class="plan-goal">{{ item.goal }}</p>
            <ul>
              <li v-for="task in item.tasks" :key="task">{{ task }}</li>
            </ul>
          </article>
        </div>
      </section>
    </div>

    <div
      v-if="showDeployGuide"
      class="plan-overlay"
      @click.self="closeDeployGuide"
    >
      <section class="plan-modal">
        <header class="plan-header">
          <div>
            <h3>阿里云 ECS 线上部署手册</h3>
            <p>基于本项目实战排障记录整理，适配 Podman / Docker Compose 场景。</p>
          </div>
          <button class="plan-close" @click="closeDeployGuide">关闭</button>
        </header>
        <div class="plan-content">
          <article
            v-for="item in deployGuide"
            :key="item.title"
            class="plan-item"
          >
            <h4>{{ item.title }}</h4>
            <p class="plan-goal">{{ item.goal }}</p>
            <ul>
              <li v-for="task in item.tasks" :key="task">{{ task }}</li>
            </ul>
            <pre v-if="item.commands && item.commands.length" class="guide-code"><code>{{ item.commands.join("\n") }}</code></pre>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import config from "@/config";
import { useChatSocket } from "@/composables/useChatSocket";

function createDebounce(fn, wait = 280) {
  let timer = null;
  const debounced = function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

export default {
  data() {
    return {
      messages: [],
      inputMessage: "",
      chatSocket: null,
      sendMessageDebounced: null,
      isLoading: false,
      connectionStatus: "connecting",
      selectedModelType: "deepseek",
      modelOptions: [
        { label: "DeepSeek（WebSocket）", value: "deepseek" },
        { label: "GPT Plus（OpenAI）", value: "openai" },
      ],
      suggestions: [
        "帮我总结这个模块的功能",
        "把这段文案改得更专业一些",
        "给我一个 Vue 页面优化建议",
      ],
      showLearningPlan: false,
      showDeployGuide: false,
      learningPlan: [
        {
          week: "第1周",
          title: "吃透现有对话页",
          goal: "搞清楚连接状态、发送流程和消息渲染链路。",
          tasks: [
            "画出连接状态机（connecting/connected/disconnected/error）",
            "把 sendMessage 与 initSocket 逐行注释并写成文档",
            "做一次断网与重连场景的手工测试",
          ],
        },
        {
          week: "第2周",
          title: "重构成可复用能力",
          goal: "把页面逻辑抽到组合式函数，提升复用性。",
          tasks: [
            "抽离 useChatSocket 管理连接、发送、重连",
            "封装消息结构（role/content/time/providerLabel）",
            "给输入区加发送防抖和空消息保护",
          ],
        },
        {
          week: "第3周",
          title: "实现流式输出体验",
          goal: "做到 token 级流式渲染，而不是整段返回。",
          tasks: [
            "后端改为分片推送，前端按 messageId 逐步拼接",
            "加入“停止生成”与“重新回答”按钮",
            "优化滚动体验，保持首屏可读性",
          ],
        },
        {
          week: "第4周",
          title: "会话管理与持久化",
          goal: "支持多会话切换和历史记录回看。",
          tasks: [
            "实现会话列表（新建、重命名、删除）",
            "使用 localStorage 或 IndexedDB 持久化历史",
            "页面刷新后恢复最近会话",
          ],
        },
        {
          week: "第5周",
          title: "稳定性与安全",
          goal: "完善错误处理、重试策略和密钥安全。",
          tasks: [
            "区分网络错误、服务错误、模型错误并提示",
            "增加重试按钮与指数退避重连",
            "改为服务端代理模型调用，前端不暴露密钥",
          ],
        },
        {
          week: "第6周",
          title: "作品化交付",
          goal: "形成一个可演示、可复盘的 AI 前端项目。",
          tasks: [
            "补全 README：架构图、状态流、关键取舍",
            "记录性能指标：首字时间、失败率、重试成功率",
            "完成 3 分钟演示录屏并整理下一步迭代路线",
          ],
        },
      ],
      deployGuide: [
        {
          title: "0. 目标与目录约定",
          goal: "统一约定部署路径与访问方式，减少误操作。",
          tasks: [
            "部署目录统一使用 /opt/vue3-koa2-web 与 /opt/vue3-koa2-server。",
            "对外访问默认 http://<ECS公网IP>:8080/。",
            "172.20.44.1 是私网 IP，仅同内网可访问，公网用户不可用。",
          ],
          commands: [
            "echo '/opt/vue3-koa2-web + /opt/vue3-koa2-server'",
            "echo '公网访问: http://<ECS公网IP>:8080/'",
          ],
        },
        {
          title: "1. 系统准备（首次部署）",
          goal: "安装运行时工具并确认版本。",
          tasks: [
            "安装 git、podman、podman-compose（或 docker + compose）。",
            "统一使用同一个用户执行全部命令（例如 admin）。",
            "记录版本，方便后续排障。",
          ],
          commands: [
            "sudo dnf install -y git podman podman-compose || sudo yum install -y git podman podman-compose",
            "git --version && podman --version",
            "whoami",
          ],
        },
        {
          title: "2. 从拉代码开始（首次 + 增量更新）",
          goal: "确保前后端代码到位，并锁定分支 2026v1.0.0。",
          tasks: [
            "目录不存在时执行 clone；目录已存在时执行 fetch/checkout/pull。",
            "不要在不同用户之间混用 sudo git 和普通 git，避免权限错乱。",
            "确保前后端都在 2026v1.0.0。",
          ],
          commands: [
            "cd /opt",
            "[ ! -d vue3-koa2-web/.git ] && git clone -b 2026v1.0.0 https://gitee.com/shixiaol/vue3-koa2-web.git || true",
            "[ ! -d vue3-koa2-server/.git ] && git clone -b 2026v1.0.0 https://gitee.com/shixiaol/vue3-koa2-server.git || true",
            "cd /opt/vue3-koa2-web && git fetch --all && git checkout 2026v1.0.0 && git pull",
            "cd /opt/vue3-koa2-server && git fetch --all && git checkout 2026v1.0.0 && git pull",
          ],
        },
        {
          title: "3. 目录权限与 .env 配置",
          goal: "解决 Permission denied，保证服务读取到真实密钥。",
          tasks: [
            "目录若由 root clone，需要 chown 给当前执行用户。",
            "创建 .env 并填写真实 OPENAI_API_KEY（不要占位符）。",
            "后续 compose 一律从 /opt/vue3-koa2-server 执行。",
          ],
          commands: [
            "sudo chown -R admin:admin /opt/vue3-koa2-web /opt/vue3-koa2-server",
            "cd /opt/vue3-koa2-server",
            "cp .env.example .env",
            "vi .env",
            "grep -E 'OPENAI_API_KEY|DEEPSEEK_API_KEY|DASHSCOPE_API_KEY' .env",
          ],
        },
        {
          title: "4. 可选：镜像拉取超时处理",
          goal: "ECS 出网不稳定时切镜像源，避免构建卡死。",
          tasks: [
            "node/nginx/mongo 镜像替换为可访问镜像源。",
            "替换后先单独 build，确认镜像能成功生成。",
            "线上建议使用 docker-compose.ecs.yml 作为覆盖文件，不改本地 compose。",
          ],
          commands: [
            "sed -i 's#FROM node:20-bullseye-slim#FROM docker.m.daocloud.io/library/node:20-bullseye-slim#g' /opt/vue3-koa2-server/Dockerfile",
            "sed -i 's#FROM node:20-bullseye-slim as builder#FROM docker.m.daocloud.io/library/node:20-bullseye-slim as builder#g' /opt/vue3-koa2-web/Dockerfile",
            "sed -i 's#FROM nginx:1.27-alpine#FROM docker.m.daocloud.io/library/nginx:1.27-alpine#g' /opt/vue3-koa2-web/Dockerfile",
            "ls -la /opt/vue3-koa2-server/docker-compose.ecs.yml",
          ],
        },
        {
          title: "5. 构建前代码校验（Linux 大小写）",
          goal: "避免 Vite 在 Linux 报 ENOENT。",
          tasks: [
            "检查 router import 与真实目录大小写是否一致。",
            "典型问题：views/Cesium 与 views/cesium 不一致。",
            "修完再 build 前端镜像。",
          ],
          commands: [
            "cd /opt/vue3-koa2-web",
            "grep -n 'cesiumLayer' src/router/index.js",
            "find src/views -iname '*cesium*layer*.vue'",
            "sed -i 's#@/views/Cesium/cesiumLayer.vue#@/views/cesium/cesiumLayer.vue#g' src/router/index.js",
          ],
        },
        {
          title: "6. 手动构建镜像（推荐）",
          goal: "避免 compose 误从远程拉 my_project_web。",
          tasks: [
            "先分别构建前后端镜像。",
            "镜像名使用 localhost 前缀，避免被识别成远程仓库。",
            "构建成功后再用 compose 启动。",
          ],
          commands: [
            "cd /opt/vue3-koa2-web && podman build -t localhost/my_project_web:latest -f Dockerfile .",
            "cd /opt/vue3-koa2-server && podman build -t localhost/my_project_webserver:latest -f Dockerfile .",
            "podman images | grep -E 'my_project_web|my_project_webserver'",
          ],
        },
        {
          title: "7. 启动前后端与数据库",
          goal: "从后端目录一次性启动服务。",
          tasks: [
            "必须在 /opt/vue3-koa2-server 目录执行 compose。",
            "建议优先 --no-build 使用已构建镜像，减少外网依赖。",
            "线上使用 docker-compose.yml + docker-compose.ecs.yml 叠加启动。",
          ],
          commands: [
            "cd /opt/vue3-koa2-server",
            "docker compose -f docker-compose.yml -f docker-compose.ecs.yml --project-name my_project down",
            "docker compose -f docker-compose.yml -f docker-compose.ecs.yml --project-name my_project --env-file .env up -d --no-build",
            "docker compose -f docker-compose.yml -f docker-compose.ecs.yml --project-name my_project ps",
          ],
        },
        {
          title: "8. 健康检查（必须做）",
          goal: "确认 web、webserver、mongo 都稳定运行。",
          tasks: [
            "查看容器状态，确保都为 Up。",
            "查看关键日志确认无持续报错。",
            "本机探测 8080 端口是否可访问。",
          ],
          commands: [
            "podman ps",
            "podman logs --tail=100 vue3-koa2-web",
            "podman logs --tail=100 vue3-koa2-server",
            "curl -I http://127.0.0.1:8080",
          ],
        },
        {
          title: "9. 安全组与防火墙",
          goal: "打通公网入口，避免容器已启动但外网不通。",
          tasks: [
            "阿里云安全组入方向放行 8080（或你映射端口）。",
            "若开启 firewalld，需同步开放端口。",
            "先本机 curl 通，再外网浏览器访问。",
          ],
          commands: [
            "sudo firewall-cmd --add-port=8080/tcp --permanent || true",
            "sudo firewall-cmd --reload || true",
            "echo '安全组放行 8080/tcp'",
          ],
        },
        {
          title: "10. 域名与 HTTPS（上线建议）",
          goal: "从公网 IP 访问升级为域名+证书访问。",
          tasks: [
            "域名 A 记录解析到 ECS 公网 IP。",
            "Nginx 或 SLB 配置 443 证书，80 跳转 443。",
            "前端 ws 协议会自动跟随 http/https 切换。",
          ],
          commands: [
            "echo 'A记录 -> ECS公网IP'",
            "echo '配置SSL证书后开放443端口'",
          ],
        },
        {
          title: "11. 日常更新发布流程",
          goal: "后续迭代使用固定步骤，减少线上风险。",
          tasks: [
            "先 git pull 到目标分支，再构建镜像。",
            "更新前先记录当前镜像 tag 以便回滚。",
            "启动后执行健康检查与页面冒烟测试。",
          ],
          commands: [
            "cd /opt/vue3-koa2-web && git fetch --all && git checkout 2026v1.0.0 && git pull",
            "cd /opt/vue3-koa2-server && git fetch --all && git checkout 2026v1.0.0 && git pull",
            "docker compose -f docker-compose.yml -f docker-compose.ecs.yml --project-name my_project --env-file .env up -d --no-build",
          ],
        },
        {
          title: "12. 回滚与紧急处理",
          goal: "上线异常时快速恢复服务。",
          tasks: [
            "保留上一版镜像 tag（不要只用 latest）。",
            "切回上一版镜像后重启 compose。",
            "若接口异常先看 server 日志，再看 mongo 状态。",
          ],
          commands: [
            "podman images",
            "podman logs --tail=200 vue3-koa2-server",
            "podman logs --tail=200 vue3-koa2-web",
          ],
        },
      ],
    };
  },
  computed: {
    selectedModelLabel() {
      const labelMap = {
        deepseek: "DeepSeek",
        openai: "GPT Plus",
      };
      return labelMap[this.selectedModelType] || "AI";
    },
    currentModeText() {
      const modeMap = {
        deepseek: "DeepSeek（WebSocket 实时会话）",
        openai: "GPT Plus（OpenAI Chat Completions）",
      };
      return modeMap[this.selectedModelType] || "WebSocket 实时会话";
    },
    effectiveConnectionStatus() {
      return this.connectionStatus;
    },
    statusText() {
      const statusMap = {
        connecting: "连接中",
        connected: "已连接",
        disconnected: "已断开",
        error: "连接异常",
      };
      return statusMap[this.effectiveConnectionStatus] || "未知状态";
    },
    canSendByCurrentModel() {
      return this.connectionStatus === "connected";
    },
  },
  mounted() {
    // 页面只关注状态和消息渲染，WebSocket 细节由 composable 承担。
    this.chatSocket = useChatSocket({
      getUrl: () => config.getWsUrl(),
      onStatusChange: (status) => {
        this.connectionStatus = status;
        if (status !== "connected") {
          this.isLoading = false;
        }
      },
      onMessage: (raw) => {
        this.handleSocketMessage(raw);
      },
      onError: () => {
        this.isLoading = false;
      },
    });
    this.chatSocket.connect();
    // 发送入口做防抖，避免用户连击按钮或重复回车触发多次请求。
    this.sendMessageDebounced = createDebounce(this.handleSendMessage, 280);
  },
  methods: {
    createMessage({
      role,
      content,
      modelType,
      providerLabel,
      time,
    }) {
      // 统一消息结构，确保用户消息与服务端回包都按同一字段渲染。
      return {
        role,
        content,
        modelType,
        providerLabel,
        time: time || this.formatTime(),
      };
    },
    normalizeIncomingMessage(raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return this.createMessage({
          role: parsed?.role || "assistant",
          content: parsed?.content || "",
          modelType: parsed?.modelType || this.selectedModelType,
          providerLabel: this.getProviderLabel(parsed || {}),
          time: parsed?.time || this.formatTime(),
        });
      } catch (error) {
        // 避免解析异常打断页面，回落成可展示的系统消息。
        return this.createMessage({
          role: "assistant",
          content: "响应解析失败，请稍后重试。",
          modelType: "system",
          providerLabel: "系统消息",
        });
      }
    },
    handleSocketMessage(raw) {
      const response = this.normalizeIncomingMessage(raw);
      this.messages.push(response);
      this.isLoading = false;
      this.scrollToBottom();
    },
    sendMessage() {
      if (!this.sendMessageDebounced) {
        this.handleSendMessage();
        return;
      }
      // UI 层永远走防抖入口，真实发送由 handleSendMessage 统一处理。
      this.sendMessageDebounced();
    },
    handleSendMessage() {
      const content = this.inputMessage.trim();
      if (!content || this.isLoading) return;

      if (
        !this.chatSocket ||
        this.chatSocket.getReadyState() !== WebSocket.OPEN
      ) {
        this.chatSocket?.connect();
        return;
      }

      const userMessage = this.createMessage({
        role: "user",
        content,
        modelType: this.selectedModelType,
        providerLabel: this.selectedModelLabel,
      });

      this.messages.push(userMessage);
      const sent = this.chatSocket.send(userMessage);
      if (!sent) {
        this.chatSocket.connect();
        return;
      }
      this.inputMessage = "";
      this.isLoading = true;
      this.scrollToBottom();
    },
    getProviderLabel(message) {
      const modelType = message?.modelType || this.selectedModelType;
      const providerLabelMap = {
        deepseek: "DeepSeek",
        openai: "GPT Plus",
        tongyi: "通义千问",
        system: "系统消息",
      };
      return providerLabelMap[modelType] || "AI";
    },
    getAssistantLabel(message) {
      return message.providerLabel || this.getProviderLabel(message);
    },
    applySuggestion(text) {
      this.inputMessage = text;
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messageListRef;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    },
    formatTime() {
      return new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    openLearningPlan() {
      this.showLearningPlan = true;
    },
    closeLearningPlan() {
      this.showLearningPlan = false;
    },
    openDeployGuide() {
      this.showDeployGuide = true;
    },
    closeDeployGuide() {
      this.showDeployGuide = false;
    },
  },
  beforeUnmount() {
    this.sendMessageDebounced?.cancel?.();
    this.chatSocket?.close?.();
  },
};
</script>

<style lang="scss" scoped>
.deepseek-page {
  height: 100%;
  min-height: 0;
  padding: 28px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.2), transparent 30%),
    radial-gradient(circle at right center, rgba(245, 158, 11, 0.16), transparent 24%),
    linear-gradient(135deg, #eef6f4 0%, #f8fbfa 48%, #f3efe7 100%);
}

.deepseek-shell {
  max-width: 1240px;
  height: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}

.hero-panel,
.chat-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
}

.hero-panel {
  min-height: 0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(240, 249, 247, 0.94)),
    linear-gradient(135deg, #fef7ed, #ecfeff);
}

.hero-copy h1 {
  margin: 14px 0 12px;
  font-size: 34px;
  line-height: 1.15;
  color: #132238;
}

.hero-copy p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #48606f;
}

.plan-entry {
  margin-top: 16px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0f766e, #0f4c5c);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(15, 118, 110, 0.2);
}

.hero-actions {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.deploy-entry {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0f4c81, #155e75);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(14, 116, 144, 0.2);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-metrics {
  display: grid;
  gap: 14px;
}

.metric-card {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.metric-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7a89;
}

.metric-value {
  font-size: 20px;
  color: #132238;
}

.metric-value.connected {
  color: #0f766e;
}

.metric-value.connecting {
  color: #b45309;
}

.metric-value.disconnected,
.metric-value.error {
  color: #b42318;
}

.metric-value.neutral {
  color: #132238;
}

.chat-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 26px 28px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.chat-header h2 {
  margin: 0 0 6px;
  font-size: 26px;
  color: #132238;
}

.chat-header p {
  margin: 0;
  color: #607180;
  font-size: 14px;
}

.status-pill {
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.status-pill.connected {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.status-pill.connecting {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.status-pill.disconnected,
.status-pill.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b42318;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  padding: 22px 28px;
  overflow-y: auto;
  background:
    linear-gradient(180deg, rgba(247, 250, 252, 0.8), rgba(255, 255, 255, 0.95)),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 35px,
      rgba(15, 23, 42, 0.018) 35px,
      rgba(15, 23, 42, 0.018) 36px
    );
}

.empty-state {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: linear-gradient(135deg, #0f766e, #f59e0b);
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 18px 40px rgba(15, 118, 110, 0.26);
}

.empty-state h3 {
  margin: 18px 0 10px;
  font-size: 24px;
  color: #132238;
}

.empty-state p {
  max-width: 520px;
  margin: 0;
  color: #607180;
  line-height: 1.8;
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.suggestion-chip {
  padding: 10px 16px;
  border: 1px solid rgba(15, 118, 110, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #0f4c5c;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-chip:hover {
  transform: translateY(-1px);
  background: #fff7ed;
  border-color: rgba(245, 158, 11, 0.28);
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.message-row.is-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #134e4a, #0f766e);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(15, 118, 110, 0.2);
}

.message-row.is-user .message-avatar {
  background: linear-gradient(135deg, #b45309, #f59e0b);
  box-shadow: 0 12px 28px rgba(245, 158, 11, 0.24);
}

.message-bubble {
  max-width: min(78%, 820px);
  padding: 16px 18px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.message-row.is-user .message-bubble {
  background: linear-gradient(135deg, #fff7ed, #fffbeb);
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #7b8a97;
}

.message-bubble p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #1f3347;
  white-space: pre-wrap;
  word-break: break-word;
}

.loading-bubble {
  min-width: 140px;
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 20px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0f766e;
  animation: pulse 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 148px;
  gap: 16px;
  padding: 20px 28px 28px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.9);
}

.editor-frame {
  padding: 14px 16px 12px;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #607180;
}

.editor-toolbar select {
  min-width: 196px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  padding: 6px 10px;
  background: #fff;
  color: #1f3347;
  outline: none;
}

.editor-toolbar select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.editor-frame textarea {
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.7;
  color: #1f3347;
}

.editor-frame textarea::placeholder {
  color: #96a3af;
}

.editor-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #7b8a97;
}

.send-button {
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, #115e59, #0f766e 45%, #f59e0b);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 18px 36px rgba(15, 118, 110, 0.24);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}

.plan-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(15, 23, 42, 0.46);
}

.plan-modal {
  width: min(920px, 100%);
  max-height: min(86vh, 900px);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #ffffff;
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.plan-header {
  padding: 20px 22px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.plan-header h3 {
  margin: 0 0 6px;
  color: #132238;
  font-size: 22px;
}

.plan-header p {
  margin: 0;
  color: #5f7182;
  font-size: 14px;
}

.plan-close {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  color: #1f3347;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}

.plan-content {
  padding: 18px 22px 22px;
  overflow-y: auto;
  display: grid;
  gap: 14px;
  background: linear-gradient(180deg, #f8fbfa, #ffffff);
}

.plan-item {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 14px 16px;
  background: #ffffff;
}

.plan-item h4 {
  margin: 0;
  font-size: 16px;
  color: #15304a;
}

.plan-goal {
  margin: 8px 0 10px;
  color: #52667b;
  font-size: 14px;
  line-height: 1.7;
}

.plan-item ul {
  margin: 0;
  padding-left: 18px;
  color: #1f3347;
}

.plan-item li {
  margin: 6px 0;
  line-height: 1.6;
}

.guide-code {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #f7fafc;
  color: #1f3347;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.45;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1100px) {
  .deepseek-shell {
    grid-template-columns: 1fr;
  }

  .deepseek-page {
    height: 100%;
    min-height: 0;
    overflow: auto;
  }

  .chat-card {
    min-height: 680px;
  }
}

@media (max-width: 768px) {
  .deepseek-page {
    height: 100%;
    min-height: 0;
    padding: 16px;
    overflow: auto;
  }

  .hero-panel,
  .chat-card {
    border-radius: 22px;
  }

  .hero-copy h1 {
    font-size: 28px;
  }

  .chat-header,
  .chat-messages,
  .chat-editor {
    padding-left: 18px;
    padding-right: 18px;
  }

  .chat-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-bubble {
    max-width: 100%;
  }

  .chat-editor {
    grid-template-columns: 1fr;
  }

  .send-button {
    min-height: 52px;
  }

  .plan-overlay {
    padding: 12px;
  }

  .plan-modal {
    max-height: 90vh;
    border-radius: 18px;
  }
}
</style>
