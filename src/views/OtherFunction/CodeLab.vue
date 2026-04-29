<template>
  <div class="code-lab">
    <div class="panel editor-panel">
      <div class="panel-header">
        <h2>代码练习台</h2>
        <div class="actions">
          <div class="lang-switch">
            <button
              class="switch-btn"
              :class="{ active: language === 'ts' }"
              @click="switchLanguage('ts')"
            >
              TypeScript
            </button>
            <button
              class="switch-btn"
              :class="{ active: language === 'js' }"
              @click="switchLanguage('js')"
            >
              JavaScript
            </button>
          </div>
          <el-button size="small" @click="resetCode">重置示例</el-button>
          <el-button type="primary" size="small" @click="runCode">
            运行 (Ctrl+Enter)
          </el-button>
        </div>
      </div>

      <div class="editor-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'html' }"
          @click="activeTab = 'html'"
        >
          HTML
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'css' }"
          @click="activeTab = 'css'"
        >
          CSS
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'script' }"
          @click="activeTab = 'script'"
        >
          {{ language === "ts" ? "TypeScript" : "JavaScript" }}
        </button>
      </div>

      <textarea
        v-if="activeTab === 'html'"
        v-model="playground[language].html"
        class="code-editor"
        spellcheck="false"
        @keydown.ctrl.enter.prevent="runCode"
        @keydown.meta.enter.prevent="runCode"
      />
      <textarea
        v-else-if="activeTab === 'css'"
        v-model="playground[language].css"
        class="code-editor"
        spellcheck="false"
        @keydown.ctrl.enter.prevent="runCode"
        @keydown.meta.enter.prevent="runCode"
      />
      <textarea
        v-else
        v-model="playground[language].script"
        class="code-editor"
        spellcheck="false"
        @keydown.ctrl.enter.prevent="runCode"
        @keydown.meta.enter.prevent="runCode"
      />

      <div class="compile-result" :class="{ error: diagnostics.length }">
        <template v-if="diagnostics.length">
          <div v-for="(item, index) in diagnostics" :key="index">{{ item }}</div>
        </template>
        <template v-else>
          {{ language === "ts" ? "TypeScript 编译成功。" : "JavaScript 无需编译。" }}
        </template>
      </div>
    </div>

    <div class="panel preview-panel">
      <div class="panel-header">
        <h2>运行效果</h2>
        <div class="actions">
          <span class="run-time" v-if="runAt">最近运行: {{ runAt }}</span>
          <el-button size="small" @click="clearConsole">清空日志</el-button>
        </div>
      </div>
      <iframe ref="previewFrame" title="code-preview" class="preview-frame" />
      <div class="console-box">
        <div class="console-title">Console</div>
        <div v-if="consoleLogs.length === 0" class="console-empty">暂无日志输出</div>
        <div v-else class="console-list">
          <div
            v-for="(item, index) in consoleLogs"
            :key="`${item.level}-${index}`"
            class="console-line"
          >
            <span class="tag">{{ item.level.toUpperCase() }}</span>
            <span class="text">{{ item.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as tsModule from "typescript";

const tsCompiler = tsModule && tsModule.default ? tsModule.default : tsModule;

const PRESETS = {
  ts: {
    html: `<main class="card">
  <h3>TypeScript 练习</h3>
  <p>右侧会显示计算结果和日志。</p>
  <div id="result"></div>
</main>`,
    css: `body {
  margin: 0;
  padding: 20px;
  font-family: "Avenir", "Helvetica Neue", sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%);
}

.card {
  max-width: 520px;
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 30px rgba(30, 64, 175, 0.08);
}

#result {
  margin-top: 10px;
  color: #1e293b;
}`,
    script: `type User = {
  name: string;
  score: number;
};

const users: User[] = [
  { name: "小明", score: 86 },
  { name: "小红", score: 97 },
  { name: "小张", score: 91 },
];

const best = [...users].sort((a, b) => b.score - a.score)[0];
const result = document.getElementById("result") as HTMLDivElement;
result.innerHTML = \`最高分: \${best.name} (\${best.score})\`;

console.log("TS 列表:", users);`,
  },
  js: {
    html: `<main class="card">
  <h3>JavaScript 练习</h3>
  <button id="addBtn">点击 +1</button>
  <p id="countText">当前计数: 0</p>
</main>`,
    css: `body {
  margin: 0;
  padding: 20px;
  font-family: "Avenir", "Helvetica Neue", sans-serif;
  background: linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%);
}

.card {
  max-width: 520px;
  background: #fff;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(234, 88, 12, 0.1);
}

#addBtn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: #ea580c;
  color: #fff;
  cursor: pointer;
}`,
    script: `let count = 0;
const btn = document.getElementById("addBtn");
const text = document.getElementById("countText");

btn.addEventListener("click", () => {
  count += 1;
  text.textContent = "当前计数: " + count;
  console.log("count =", count);
});`,
  },
};

function clonePreset(value) {
  return JSON.parse(JSON.stringify(value));
}

export default {
  name: "CodeLab",
  data() {
    return {
      language: "ts",
      activeTab: "script",
      playground: {
        ts: clonePreset(PRESETS.ts),
        js: clonePreset(PRESETS.js),
      },
      diagnostics: [],
      consoleLogs: [],
      autoRunTimer: null,
      previewMessageHandler: null,
      runAt: "",
    };
  },
  watch: {
    playground: {
      deep: true,
      handler() {
        this.scheduleRun();
      },
    },
    language() {
      this.diagnostics = [];
      this.scheduleRun();
    },
  },
  mounted() {
    this.previewMessageHandler = (event) => this.handlePreviewMessage(event);
    window.addEventListener("message", this.previewMessageHandler);
    this.runCode();
  },
  beforeUnmount() {
    clearTimeout(this.autoRunTimer);
    if (this.previewMessageHandler) {
      window.removeEventListener("message", this.previewMessageHandler);
    }
  },
  methods: {
    switchLanguage(nextLanguage) {
      if (nextLanguage === this.language) {
        return;
      }
      this.language = nextLanguage;
    },
    scheduleRun() {
      clearTimeout(this.autoRunTimer);
      this.autoRunTimer = setTimeout(() => {
        this.runCode();
      }, 450);
    },
    runCode() {
      try {
        const current = this.playground[this.language];
        let outputJsCode = current.script;
        if (this.language === "ts") {
          const transpileResult = tsCompiler.transpileModule(current.script, {
            compilerOptions: {
              target: tsCompiler.ScriptTarget.ES2020,
              module: tsCompiler.ModuleKind.ES2020,
              strict: true,
            },
            reportDiagnostics: true,
          });
          this.diagnostics = this.parseDiagnostics(transpileResult.diagnostics || []);
          if (this.diagnostics.length > 0) {
            return;
          }
          outputJsCode = transpileResult.outputText || "";
        } else {
          this.diagnostics = [];
        }

        this.runAt = new Date().toLocaleTimeString();
        const frame = this.$refs.previewFrame;
        if (frame) {
          frame.srcdoc = "";
          requestAnimationFrame(() => {
            frame.srcdoc = this.buildPreviewDoc(
              current.html,
              current.css,
              outputJsCode
            );
          });
        }
      } catch (error) {
        this.diagnostics = [`运行失败: ${error.message || String(error)}`];
      }
    },
    buildPreviewDoc(htmlCode, cssCode, jsCode) {
      return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
${cssCode}
    </style>
  </head>
  <body>
    ${htmlCode}
    <script>
      (function () {
        const send = (level, args) => {
          const message = args
            .map((item) => {
              if (typeof item === "string") return item;
              try {
                return JSON.stringify(item);
              } catch (e) {
                return String(item);
              }
            })
            .join(" ");
          parent.postMessage({ source: "code-lab", level, message }, "*");
        };
        const rawLog = console.log.bind(console);
        const rawWarn = console.warn.bind(console);
        const rawError = console.error.bind(console);
        console.log = (...args) => { send("log", args); rawLog(...args); };
        console.warn = (...args) => { send("warn", args); rawWarn(...args); };
        console.error = (...args) => { send("error", args); rawError(...args); };
        window.addEventListener("error", (event) => {
          send("error", [event.message]);
        });
        window.addEventListener("unhandledrejection", (event) => {
          send("error", [String(event.reason)]);
        });
      })();
    ${"</scr" + "ipt>"}
    <script type="module">
${jsCode}
    ${"</scr" + "ipt>"}
  </body>
</html>`;
    },
    parseDiagnostics(list) {
      return list.map((item) => `TS${item.code}: ${this.formatTsMessage(item.messageText)}`);
    },
    formatTsMessage(message) {
      if (typeof message === "string") {
        return message;
      }
      if (message && typeof message.messageText === "string") {
        return message.messageText;
      }
      return "编译错误";
    },
    handlePreviewMessage(event) {
      const data = event.data || {};
      if (data.source !== "code-lab") {
        return;
      }
      this.consoleLogs.push({
        level: data.level || "log",
        message: data.message || "",
      });
      if (this.consoleLogs.length > 100) {
        this.consoleLogs.shift();
      }
    },
    clearConsole() {
      this.consoleLogs = [];
    },
    resetCode() {
      this.playground[this.language] = clonePreset(PRESETS[this.language]);
      this.consoleLogs = [];
      this.diagnostics = [];
      this.runCode();
    },
  },
};
</script>

<style lang="scss" scoped>
.code-lab {
  height: 100%;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.panel-header {
  padding: 12px 14px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 16px;
    color: #0f172a;
  }
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.lang-switch {
  display: flex;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 4px;
}

.switch-btn {
  border: none;
  background: #f8fafc;
  color: #475569;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;

  &.active {
    background: #1d4ed8;
    color: #fff;
  }
}

.editor-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 14px 0;
}

.tab-btn {
  border: 1px solid #dbe3ef;
  background: #f8fafc;
  color: #475569;
  border-radius: 8px;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;

  &.active {
    color: #1d4ed8;
    border-color: #bfd3ff;
    background: #eff6ff;
  }
}

.code-editor {
  flex: 1;
  min-height: 360px;
  border: none;
  resize: none;
  outline: none;
  padding: 14px;
  font: 14px/1.6 "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  color: #1f2937;
  background: #f8fafc;
}

.compile-result {
  padding: 10px 14px;
  border-top: 1px solid #eef2f7;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  line-height: 1.5;

  &.error {
    background: #fef2f2;
    color: #b91c1c;
  }
}

.preview-frame {
  width: 100%;
  height: 320px;
  border: none;
  background: #ffffff;
}

.run-time {
  color: #64748b;
  font-size: 12px;
}

.console-box {
  border-top: 1px solid #eef2f7;
  padding: 10px 12px;
  min-height: 170px;
  max-height: 260px;
  overflow: auto;
  background: #0b1220;
  color: #e2e8f0;
}

.console-title {
  font-size: 12px;
  letter-spacing: 0.8px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.console-empty {
  font-size: 13px;
  opacity: 0.8;
}

.console-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.console-line {
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  gap: 8px;
  word-break: break-word;
}

.tag {
  font-size: 11px;
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 999px;
  padding: 1px 8px;
  height: fit-content;
}

.text {
  color: #cbd5e1;
}

@media (max-width: 1200px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 960px) {
  .code-lab {
    grid-template-columns: 1fr;
  }

  .code-editor {
    min-height: 280px;
  }

  .preview-frame {
    height: 280px;
  }
}
</style>
