<!-- @Description: JS、TS及React JSX练习环境，支持日夜配色和独立预览。 -->
<template>
  <div class="code-lab">
    <header class="workspace-header">
      <h2>代码练习台</h2>
      <div class="workspace-actions">
        <CodeLabCases
          ref="caseLibrary"
          :language="language"
          :draft="playground[language]"
          :current-case="activeCases[language]"
          :has-unsaved-code="hasUnsavedCode"
          @saved="handleCaseSaved"
          @opened="handleCaseOpened"
          @removed="handleCaseRemoved"
        />
        <div class="run-actions">
          <el-button size="small" @click="resetCode">重置示例</el-button>
          <el-button type="primary" size="small" @click="runCode">
            运行 (Ctrl+Enter)
          </el-button>
        </div>
      </div>
    </header>

    <div class="panel editor-panel">
      <div class="panel-header">
        <h3>代码编辑</h3>
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
          <button class="switch-btn" :class="{ active: language === 'react' }" @click="switchLanguage('react')">React JSX</button>
        </div>
      </div>

      <div class="editor-toolbar">
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
            {{ language === "react" ? "React JSX" : language === "ts" ? "TypeScript" : "JavaScript" }}
          </button>
        </div>
        <div class="format-toolbar">
          <el-button size="small" @click="formatActiveCode(true)">格式化</el-button>
          <label title="离开编辑区时格式化当前代码">
            <input v-model="autoFormat" type="checkbox" />
            自动格式化
          </label>
        </div>
      </div>

      <CodeLabEditor
        :key="language + '/' + activeTab + '/' + editorRevision"
        v-model="playground[language][activeTab]"
        :mode="activeTab === 'script' ? language : activeTab"
        class="code-editor"
        @run="runCode"
        @save="$refs.caseLibrary.saveCurrent()"
        @blur="autoFormat && formatActiveCode()"
      />
      <div class="editor-shortcuts">
        <div id="code-editor-shortcuts">
          Tab 补全或缩进 · Ctrl + Space 打开提示 · Shift + Tab 取消缩进 · Esc 后按 Tab 切换焦点
        </div>
        <div v-if="formatError" class="format-error" role="status">{{ formatError }}</div>
      </div>

      <div class="compile-result" :class="{ error: diagnostics.length }">
        <template v-if="diagnostics.length">
          <div v-for="(item, index) in diagnostics" :key="index">{{ item }}</div>
        </template>
        <template v-else>
          {{ language === "react" ? "React 19 · JSX本地编译，运行需连接CDN；可使用react和react-dom/client导入。" : language === "ts" ? "TypeScript 编译成功。" : "JavaScript 无需编译。" }}
        </template>
      </div>
    </div>

    <div class="panel preview-panel">
      <div class="panel-header">
        <h3>运行效果</h3>
        <span class="run-time" v-if="runAt">最近运行: {{ runAt }}</span>
      </div>
      <iframe ref="previewFrame" title="code-preview" class="preview-frame" />
      <div class="console-box">
        <div class="console-header">
          <div class="console-title">Console</div>
          <el-button size="small" class="console-clear" @click="clearConsole">清空日志</el-button>
        </div>
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
import CodeLabEditor from "@/components/CodeLabEditor.vue";
import CodeLabCases from "@/components/CodeLabCases.vue";
import { formatCodeLabSource } from "@/utils/codeLabFormatter";
import { REACT_PRESET, REACT_IMPORT_MAP } from "@/utils/codeLabReact";
import * as tsModule from "typescript";

const tsCompiler = tsModule && tsModule.default ? tsModule.default : tsModule;

const PRESETS = {
  react: REACT_PRESET,
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
  components: { CodeLabEditor, CodeLabCases },
  data() {
    return {
      language: "ts",
      activeTab: "script",
      editorRevision: 0,
      activeCases: { ts: null, js: null, react: null },
      autoFormat: false,
      formatError: "",
      playground: {
        ts: clonePreset(PRESETS.ts),
        js: clonePreset(PRESETS.js),
        react: clonePreset(PRESETS.react),
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
        this.formatError = "";
        this.scheduleRun();
      },
    },
    language() {
      this.diagnostics = [];
      this.formatError = "";
      this.scheduleRun();
    },
    activeTab() {
      this.formatError = "";
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
    hasUnsavedCode(language) {
      const draft = this.playground[language];
      const saved = this.activeCases[language]?.draft || PRESETS[language];
      return ["html", "css", "script"].some((tab) => draft[tab] !== saved[tab]);
    },
    handleCaseSaved({ id, title, language }, draft) {
      this.activeCases[language] = { id, title, draft };
    },
    handleCaseOpened(item) {
      const { language, html, css, script } = item;
      const draft = { html, css, script };
      this.playground[language] = { ...draft };
      this.handleCaseSaved(item, draft);
      this.language = language;
      this.activeTab = "script";
      this.editorRevision += 1;
      this.consoleLogs = [];
    },
    handleCaseRemoved({ id, language }) {
      if (this.activeCases[language]?.id === id) this.activeCases[language] = null;
    },
    async formatActiveCode(showError = false) {
      const language = this.language;
      const tab = this.activeTab;
      const mode = tab === "script" ? language : tab;
      const draft = this.playground[language];
      const source = draft[tab];
      if (!source.trim()) return;
      this.formatError = "";
      try {
        const formatted = await formatCodeLabSource(source, mode, tsCompiler);
        // 只应用到发起格式化的代码，避免异步结果覆盖后续输入。
        if (this.playground[language] === draft && draft[tab] === source) {
          draft[tab] = formatted;
        }
      } catch (error) {
        if (showError && this.language === language && this.activeTab === tab && this.playground[language][tab] === source) {
          this.formatError = error.message || "格式化失败，请检查代码语法。";
        }
      }
    },
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
        if (this.language === "ts" || this.language === "react") {
          const transpileResult = tsCompiler.transpileModule(current.script, {
            fileName: this.language === "react" ? "practice.jsx" : "practice.ts",
            compilerOptions: {
              target: tsCompiler.ScriptTarget.ES2020,
              module: tsCompiler.ModuleKind.ES2020,
              strict: true,
              allowJs: this.language === "react",
              jsx: tsCompiler.JsxEmit.ReactJSX,
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
    ${this.language === "react" ? `<script type="importmap">${JSON.stringify(REACT_IMPORT_MAP)}${"</scr" + "ipt>"}` : ""}
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
      if (event.source !== this.$refs.previewFrame?.contentWindow || data.source !== "code-lab") {
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
  display: grid;
  grid-template-columns: minmax(0, 11fr) minmax(0, 9fr);
  grid-template-rows: auto minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 590px;
  background: var(--code-lab-workspace);
}

.workspace-header,
.panel {
  min-width: 0;
  background: var(--code-lab-panel);
  border: 1px solid var(--code-lab-edge);
  border-radius: 14px;
  box-shadow: 0 6px 20px var(--code-lab-shadow);
}

.workspace-header,
.panel-header,
.editor-toolbar,
.console-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
}

.workspace-header {
  grid-column: 1 / -1;
  padding: 10px 14px;

  h2 {
    margin: 0;
    font-size: 18px;
    color: var(--code-lab-heading);
  }
}

.workspace-actions,
.run-actions,
.editor-tabs,
.format-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.run-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.panel-header {
  min-height: 52px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--code-lab-divider);

  h3 {
    margin: 0;
    font-size: 15px;
    color: var(--code-lab-heading);
  }
}

.lang-switch {
  display: flex;
  border: 1px solid var(--code-lab-control-edge);
  border-radius: 8px;
  background: var(--code-lab-subtle);
}

.switch-btn {
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--code-lab-muted);
  padding: 6px 9px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;

  &.active {
    background: var(--code-lab-primary);
    color: var(--code-lab-primary-text);
  }
}

.editor-toolbar {
  padding: 8px 14px;
  border-bottom: 1px solid var(--code-lab-divider);
}

.tab-btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--code-lab-muted);
  border-radius: 7px;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;

  &.active {
    color: var(--code-lab-selected-text);
    border-color: var(--code-lab-selected-edge);
    background: var(--code-lab-selected);
  }
}

.switch-btn:focus-visible,
.tab-btn:focus-visible {
  outline: 2px solid var(--code-lab-focus);
  outline-offset: -2px;
}

.format-toolbar {
  color: var(--code-lab-muted);
  font-size: 12px;

  input {
    accent-color: var(--code-lab-primary);
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.code-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.editor-shortcuts {
  padding: 7px 14px;
  background: var(--code-lab-subtle);
  color: var(--code-lab-muted);
  font-size: 12px;
  line-height: 1.55;
}

.format-error {
  color: var(--code-lab-error-text);
}

.compile-result {
  padding: 8px 14px;
  border-top: 1px solid var(--code-lab-divider);
  background: var(--code-lab-success);
  color: var(--code-lab-success-text);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;

  &.error {
    max-height: 120px;
    overflow: auto;
    background: var(--code-lab-error);
    color: var(--code-lab-error-text);
  }
}

.preview-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  background: var(--code-lab-panel);
}

.run-time {
  color: var(--code-lab-secondary);
  font-size: 12px;
}

.console-box {
  display: flex;
  flex-direction: column;
  flex: 0 0 clamp(132px, 23%, 228px);
  min-height: 0;
  padding: 0 12px;
  background: var(--code-lab-console);
  color: var(--code-lab-console-text);
}

.console-header {
  padding: 8px 0;
  border-bottom: 1px solid var(--code-lab-console-divider);
}

.console-title {
  font-size: 12px;
  letter-spacing: 0.4px;
  color: var(--code-lab-console-text);
}

.console-clear {
  height: auto;
  padding: 4px 8px;
  background: transparent;
  border-color: var(--code-lab-console-edge);
  color: var(--code-lab-console-text);

  &:hover,
  &:focus-visible {
    background: var(--code-lab-console-hover);
    border-color: var(--code-lab-console-hover-edge);
    color: var(--code-lab-console-text);
  }
}

.console-empty,
.console-list {
  padding: 9px 0;
  font-size: 13px;
}

.console-empty {
  color: var(--code-lab-console-muted);
}

.console-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
}

.console-line {
  display: flex;
  gap: 8px;
  line-height: 1.5;
}

.tag {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--code-lab-log-text);
  background: var(--code-lab-log);
  border: 1px solid var(--code-lab-log-edge);
  border-radius: 999px;
  padding: 1px 8px;
  height: fit-content;
}

.text {
  min-width: 0;
  color: var(--code-lab-console-text);
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .code-lab {
    height: auto;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    gap: 12px;
  }

  .code-editor {
    flex: 0 0 clamp(260px, 48vh, 440px);
  }

  .preview-frame {
    flex: 0 0 clamp(240px, 42vh, 400px);
  }

  .console-box {
    flex-basis: 132px;
  }
}
</style>

<style lang="scss">
.code-lab,
.code-lab-case-dialog {
  .el-button:not(.console-clear) {
    background: var(--code-lab-panel);
    border-color: var(--code-lab-control-edge);
    color: var(--code-lab-ink);

    &:hover,
    &:focus-visible {
      background: var(--code-lab-selected);
      border-color: var(--code-lab-selected-edge);
      color: var(--code-lab-selected-text);
    }
  }

  .el-button.el-button--primary {
    background: var(--code-lab-primary);
    border-color: var(--code-lab-primary);
    color: var(--code-lab-primary-text);

    &:hover,
    &:focus-visible {
      background: var(--code-lab-primary-hover);
      border-color: var(--code-lab-primary-hover);
      color: var(--code-lab-primary-text);
    }
  }

  .el-button.el-button--danger {
    background: var(--code-lab-error);
    border-color: var(--code-lab-error-edge);
    color: var(--code-lab-error-text);
  }

  .el-button:disabled {
    opacity: 0.55;
  }
}
</style>
