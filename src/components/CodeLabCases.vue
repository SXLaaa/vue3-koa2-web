<!-- @Description: 代码练习台的用例保存、打开和删除入口。 -->
<template>
  <div class="case-actions">
    <el-button size="small" :loading="busy === 'save'" @click="saveCurrent">保存 (Ctrl+S)</el-button>
    <el-button size="small" :disabled="!!busy" @click="showLibrary">我的用例</el-button>
    <span v-if="currentCase" class="case-title" :title="currentCase.title">{{ currentCase.title }}</span>

    <el-dialog title="保存用例" v-model="nameVisible" width="420px" custom-class="code-lab-case-dialog"
      :close-on-click-modal="busy !== 'save'" :close-on-press-escape="busy !== 'save'" :show-close="busy !== 'save'">
      <label class="case-name">
        用例名称
        <el-input v-model="title" maxlength="80" placeholder="例如：组件属性测试" @keyup.enter="submitNewCase" />
      </label>
      <template #footer>
        <el-button size="small" :disabled="!!busy" @click="nameVisible = false">取消</el-button>
        <el-button type="primary" size="small" :disabled="!title.trim()" :loading="busy === 'save'" @click="submitNewCase">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="我的用例" v-model="libraryVisible" width="620px" custom-class="code-lab-case-dialog"
      :close-on-click-modal="!busy" :close-on-press-escape="!busy" :show-close="!busy">
      <div v-if="busy === 'list'" class="case-status" role="status">正在加载…</div>
      <div v-else-if="loadError" class="case-status" role="alert">
        {{ loadError }} <el-button size="small" @click="showLibrary">重试</el-button>
      </div>
      <div v-else-if="!cases.length" class="case-status">还没有已保存的用例</div>
      <ul v-else class="case-list">
        <li v-for="item in cases" :key="item.id">
          <div class="case-info">
            <strong>{{ item.title }}</strong>
            <span>{{ languageLabels[item.language] }} · {{ formatTime(item.updatedAt) }}</span>
          </div>
          <div class="case-row-actions">
            <el-button size="small" :disabled="!!busy" @click="openCase(item)">打开</el-button>
            <el-button size="small" type="danger" plain :disabled="!!busy" @click="deleteCase(item)">删除</el-button>
          </div>
        </li>
      </ul>
      <template #footer>
        <el-button v-if="currentCase" size="small" :disabled="!!busy" @click="saveAs">另存当前用例</el-button>
        <el-button size="small" :disabled="!!busy" @click="libraryVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from "element-plus";
import api from "@/api/codeLabCases";

function errorMessage(error, fallback) {
  return error?.response?.data?.msg || (typeof error === "string" ? error : "") || fallback;
}

export default {
  name: "CodeLabCases",
  props: {
    language: { type: String, required: true },
    draft: { type: Object, required: true },
    currentCase: { type: Object, default: null },
    hasUnsavedCode: { type: Function, required: true },
  },
  emits: ["saved", "opened", "removed"],
  data() {
    return {
      nameVisible: false,
      libraryVisible: false,
      title: "",
      busy: "",
      loadError: "",
      cases: [],
      languageLabels: { ts: "TypeScript", js: "JavaScript", react: "React JSX" },
    };
  },
  methods: {
    saveCurrent() {
      if (this.busy || this.nameVisible || this.libraryVisible) return;
      if (this.currentCase) {
        this.persistCase(this.currentCase.title, this.currentCase.id);
      } else {
        this.title = "";
        this.nameVisible = true;
      }
    },
    saveAs() {
      this.libraryVisible = false;
      this.title = "";
      this.nameVisible = true;
    },
    submitNewCase() {
      const title = this.title.trim();
      if (title) this.persistCase(title);
    },
    async persistCase(title, id) {
      if (this.busy) return;
      const { html, css, script } = this.draft;
      // 保存发起时的三个编辑区，期间继续输入的内容仍可再次保存。
      const draft = { html, css, script };
      const payload = { title, language: this.language, ...draft };
      this.busy = "save";
      try {
        const item = await (id ? api.update(id, payload) : api.create(payload));
        this.$emit("saved", item, draft);
        this.nameVisible = false;
        ElMessage.success("用例已保存");
      } catch (error) {
        ElMessage.error(errorMessage(error, "保存用例失败，请稍后重试"));
      } finally {
        this.busy = "";
      }
    },
    async showLibrary() {
      if (this.busy) return;
      this.libraryVisible = true;
      this.busy = "list";
      this.loadError = "";
      try {
        this.cases = await api.list();
      } catch (error) {
        this.loadError = errorMessage(error, "加载用例失败，请稍后重试");
      } finally {
        this.busy = "";
      }
    },
    async confirm(message, title, confirmButtonText) {
      try {
        await ElMessageBox.confirm(message, title, { confirmButtonText, cancelButtonText: "取消", type: "warning" });
        return true;
      } catch {
        return false;
      }
    },
    async openCase(item) {
      if (this.busy) return;
      if (this.hasUnsavedCode(item.language) && !(await this.confirm(
        "该语言下还有未保存的修改，打开用例会替换编辑区中的内容。",
        "打开用例",
        "继续打开"
      ))) return;
      this.busy = "open";
      try {
        const loaded = await api.get(item.id);
        this.$emit("opened", loaded);
        this.libraryVisible = false;
      } catch (error) {
        ElMessage.error(errorMessage(error, "打开用例失败，请刷新列表后重试"));
      } finally {
        this.busy = "";
      }
    },
    async deleteCase(item) {
      if (this.busy || !(await this.confirm(`确定删除「${item.title}」？`, "删除用例", "删除"))) return;
      this.busy = "delete";
      try {
        await api.remove(item.id);
        this.cases = this.cases.filter(({ id }) => id !== item.id);
        this.$emit("removed", item);
        ElMessage.success("用例已删除");
      } catch (error) {
        ElMessage.error(errorMessage(error, "删除用例失败，请稍后重试"));
      } finally {
        this.busy = "";
      }
    },
    formatTime(value) {
      return new Date(value).toLocaleString();
    },
  },
};
</script>

<style scoped>
:global(.code-lab-case-dialog) {
  max-width: 92vw;
}
.case-actions, .case-row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.case-actions > .el-button + .el-button,
.case-row-actions > .el-button + .el-button {
  margin-left: 0;
}
.case-title {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #475569;
  font-size: 12px;
}

.case-name, .case-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.case-status {
  padding: 16px 0;
  color: #64748b;
  text-align: center;
}
.case-list {
  max-height: 55vh;
  overflow: auto;
  padding: 0;
  margin: 0;
  list-style: none;
}
.case-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #eef2f7;
}
.case-info strong { overflow-wrap: anywhere; }
.case-info span { color: #64748b; font-size: 12px; }

@media (max-width: 480px) {
  .case-list li {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
