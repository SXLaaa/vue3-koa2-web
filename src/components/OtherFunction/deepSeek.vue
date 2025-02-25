<template>
  <div class="chat-container">
    <div class="chat-messages">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="message.role === 'user' ? 'user-message' : 'bot-message'"
      >
        <p>{{ message.content }}</p>
      </div>
      <!-- 加载提示 -->
      <div v-if="isLoading" class="loading-message">
        <p>正在等待 AI 回复，请稍候...</p>
      </div>
    </div>
    <div class="chat-input">
      <input
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="输入消息"
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading">
        {{ isLoading ? "正在发送..." : "发送" }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messages: [],
      inputMessage: "",
      socket: null,
      isLoading: false, // 新增加载状态
    };
  },
  mounted() {
    // 建立WebSocket连接
    this.socket = new WebSocket("ws://localhost:3001");

    this.socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    this.socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      this.messages.push(response);
      this.isLoading = false; // 收到消息后，取消加载状态
    };

    this.socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };
  },
  methods: {
    sendMessage() {
      if (this.inputMessage.trim() === "") return;

      const userMessage = {
        role: "user",
        content: this.inputMessage,
      };
      this.messages.push(userMessage);
      this.socket.send(JSON.stringify(userMessage));
      this.inputMessage = "";
      this.isLoading = true; // 发送消息后，开启加载状态
    },
  },
  beforeDestroy() {
    // 关闭WebSocket连接
    if (this.socket) {
      this.socket.close();
    }
  },
};
</script>

<style lang="scss" scoped>
$primary-color: #007bff;
$secondary-color: #0056b3;
$background-color: #f9f9f9;
$shadow-color: rgba(0, 0, 0, 0.1);
$border-radius: 15px;
$input-padding: 10px;
$button-padding: 10px 20px;

.chat-container {
  display: flex;
  flex-direction: column;
  height: 450px;
  max-width: 600px;
  margin: 20px auto;
  border: 1px solid #ccc;
  border-radius: $border-radius;
  overflow: hidden;
  background-color: $background-color;
  box-shadow: 0 4px 10px $shadow-color;

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f3f3f3;
  }

  .user-message,
  .bot-message {
    margin-bottom: 15px;

    p {
      display: inline-block;
      padding: 10px 15px;
      border-radius: $border-radius;
      max-width: 75%;
      box-shadow: 0 2px 5px $shadow-color;
    }
  }

  .user-message {
    text-align: right;

    p {
      background-color: #d3f8c6;
    }
  }

  .bot-message {
    text-align: left;

    p {
      background-color: #ffffff;
    }
  }

  .chat-input {
    display: flex;
    padding: 15px;
    background-color: #fff;
    border-top: 1px solid #ddd;

    input {
      flex: 1;
      padding: $input-padding;
      border: 1px solid #ccc;
      border-radius: 20px;
      margin-right: 15px;
      font-size: 16px;
    }

    button {
      padding: $button-padding;
      background-color: $primary-color;
      color: #fff;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 16px;

      &:hover {
        background-color: $secondary-color;
      }
    }
  }

  .loading-message {
    text-align: center;
    color: #888;
    font-style: italic;
  }
}
</style>
