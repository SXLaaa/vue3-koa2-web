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
  </div>
</template>

<script>
import config from "@/config";

export default {
  data() {
    return {
      messages: [],
      inputMessage: "",
      socket: null,
      isLoading: false,
      connectionStatus: "connecting",
      selectedModelType: "deepseek",
      modelOptions: [
        { label: "DeepSeek（WebSocket）", value: "deepseek" },
      ],
      suggestions: [
        "帮我总结这个模块的功能",
        "把这段文案改得更专业一些",
        "给我一个 Vue 页面优化建议",
      ],
    };
  },
  computed: {
    selectedModelLabel() {
      const labelMap = {
        deepseek: "DeepSeek",
      };
      return labelMap[this.selectedModelType] || "AI";
    },
    currentModeText() {
      const modeMap = {
        deepseek: "DeepSeek（WebSocket 实时会话）",
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
    this.initSocket();
  },
  methods: {
    initSocket() {
      if (
        this.socket &&
        [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.socket.readyState)
      ) {
        return;
      }

      this.connectionStatus = "connecting";
      this.socket = new WebSocket(config.getWsUrl());

      this.socket.onopen = () => {
        this.connectionStatus = "connected";
      };

      this.socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        response.providerLabel = this.getProviderLabel(response);
        response.time = this.formatTime();
        this.messages.push(response);
        this.isLoading = false;
        this.scrollToBottom();
      };

      this.socket.onerror = () => {
        this.connectionStatus = "error";
        this.isLoading = false;
      };

      this.socket.onclose = () => {
        this.connectionStatus = "disconnected";
        this.isLoading = false;
      };
    },
    async sendMessage() {
      if (
        !this.inputMessage.trim() ||
        this.isLoading
      ) {
        return;
      }

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.initSocket();
        return;
      }

      const userMessage = {
        role: "user",
        content: this.inputMessage.trim(),
        modelType: this.selectedModelType,
        providerLabel: this.selectedModelLabel,
        time: this.formatTime(),
      };

      this.messages.push(userMessage);
      this.socket.send(JSON.stringify(userMessage));
      this.inputMessage = "";
      this.isLoading = true;
      this.scrollToBottom();
    },
    getProviderLabel(message) {
      const modelType = message?.modelType || this.selectedModelType;
      const providerLabelMap = {
        deepseek: "DeepSeek",
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
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.close();
    }
  },
};
</script>

<style lang="scss" scoped>
.deepseek-page {
  height: 100%;
  min-height: 0;
  padding: 28px;
  overflow: hidden;
  background: var(--app-chat-background, var(--app-canvas));
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
  border: 1px solid var(--app-edge);
  border-radius: 28px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(16px);
}

.hero-panel {
  min-height: 0;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  background: var(--app-chat-hero, var(--app-surface));
}

.hero-copy h1 {
  margin: 14px 0 12px;
  font-size: 34px;
  line-height: 1.15;
  color: var(--app-heading);
}

.hero-copy p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--app-secondary);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
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
  background: var(--app-surface-raised);
  border: 1px solid var(--app-divider);
}

.metric-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--app-muted);
}

.metric-value {
  font-size: 20px;
  color: var(--app-heading);
}

.metric-value.connected {
  color: var(--app-success);
}

.metric-value.connecting {
  color: var(--app-warning);
}

.metric-value.disconnected,
.metric-value.error {
  color: var(--app-error);
}

.metric-value.neutral {
  color: var(--app-heading);
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
  border-bottom: 1px solid var(--app-divider);
}

.chat-header h2 {
  margin: 0 0 6px;
  font-size: 26px;
  color: var(--app-heading);
}

.chat-header p {
  margin: 0;
  color: var(--app-muted);
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
  background: var(--app-success-soft);
  color: var(--app-success);
}

.status-pill.connecting {
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.status-pill.disconnected,
.status-pill.error {
  background: var(--app-error-soft);
  color: var(--app-error);
}

.chat-messages {
  flex: 1;
  min-height: 0;
  padding: 22px 28px;
  overflow-y: auto;
  background: var(--app-chat-feed, linear-gradient(180deg, var(--app-subtle), var(--app-surface)));
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
  color: var(--app-heading);
}

.empty-state p {
  max-width: 520px;
  margin: 0;
  color: var(--app-muted);
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
  border: 1px solid var(--app-control-edge);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-chip:hover {
  transform: translateY(-1px);
  background: var(--app-warning-soft);
  border-color: var(--app-warning);
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
  background: var(--app-surface-raised);
  border: 1px solid var(--app-divider);
  box-shadow: var(--app-shadow);
}

.message-row.is-user .message-bubble {
  background: linear-gradient(135deg, var(--app-warning-soft), var(--app-subtle));
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--app-muted);
}

.message-bubble p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--app-text);
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
  background: var(--app-accent);
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
  border-top: 1px solid var(--app-divider);
  background: var(--app-surface);
}

.editor-frame {
  padding: 14px 16px 12px;
  border-radius: 24px;
  border: 1px solid var(--app-edge);
  background: linear-gradient(180deg, var(--app-surface), var(--app-subtle));
  box-shadow: inset 0 1px 0 var(--app-divider);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--app-muted);
}

.editor-toolbar select {
  min-width: 196px;
  border: 1px solid var(--app-control-edge);
  border-radius: 12px;
  padding: 6px 10px;
  background: var(--app-surface);
  color: var(--app-text);
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
  color: var(--app-text);
}

.editor-frame textarea::placeholder {
  color: var(--app-muted);
}

.editor-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--app-muted);
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
}
</style>
