<template>
  <div class="agent-page">
    <aside class="session-panel" :class="{ 'mobile-open': sessionsVisible }">
      <div class="session-panel__header">
        <div>
          <h2>会话</h2>
          <span>{{ stats.sessions }} 条记录</span>
        </div>
        <div class="session-panel__header-actions">
          <el-tooltip content="新建会话" placement="top">
            <el-button
              icon="el-icon-plus"
              circle
              size="mini"
              aria-label="新建会话"
              @click="newSession"
            ></el-button>
          </el-tooltip>
          <el-button
            class="mobile-only"
            icon="el-icon-close"
            circle
            size="mini"
            aria-label="关闭会话列表"
            @click="sessionsVisible = false"
          ></el-button>
        </div>
      </div>

      <div class="session-list" v-loading="sessionsLoading">
        <button
          v-for="item in sessions"
          :key="item.sessionId"
          type="button"
          class="session-item"
          :class="{ active: item.sessionId === sessionId }"
          @click="openSession(item.sessionId)"
        >
          <span class="session-item__title">{{ item.title || '新会话' }}</span>
          <span class="session-item__meta">{{ formatDate(item.updatedAt) }} · {{ item.messageCount || 0 }} 条</span>
          <el-tooltip content="删除会话" placement="top">
            <span
              class="session-item__delete"
              role="button"
              tabindex="0"
              aria-label="删除会话"
              @click.stop="removeSession(item)"
              @keydown.enter.stop="removeSession(item)"
            >
              <i class="el-icon-delete"></i>
            </span>
          </el-tooltip>
        </button>

        <div v-if="!sessionsLoading && !sessions.length" class="session-list__empty">
          暂无历史会话
        </div>
      </div>

      <div class="data-summary">
        <span>教学 {{ stats.trainingSamples }}</span>
        <span>纠错 {{ stats.correctedFeedback }}</span>
      </div>
    </aside>

    <section class="chat-panel">
      <header class="chat-toolbar">
        <div class="model-state">
          <span class="status-dot" :class="modelOnline ? 'online' : 'offline'"></span>
          <div>
            <strong>{{ modelOnline ? '本地模型已连接' : serviceOnline ? '模型未连接' : 'Agent 未启动' }}</strong>
            <span>{{ health.provider || 'ollama' }}</span>
          </div>
        </div>

        <div class="chat-toolbar__actions">
          <el-tooltip content="历史会话" placement="top">
            <el-button
              class="mobile-only"
              icon="el-icon-time"
              circle
              size="small"
              aria-label="历史会话"
              @click="sessionsVisible = true"
            ></el-button>
          </el-tooltip>
          <el-select v-model="selectedModel" size="small" class="model-select" placeholder="选择模型">
            <el-option
              v-for="model in models"
              :key="model.name"
              :label="model.name"
              :value="model.name"
            ></el-option>
          </el-select>
          <el-button size="small" icon="el-icon-document-add" @click="teachVisible = true">教学</el-button>
          <el-button size="small" icon="el-icon-download" :loading="exporting" @click="exportDataset">导出</el-button>
          <el-tooltip content="刷新状态" placement="top">
            <el-button
              class="refresh-model"
              icon="el-icon-refresh"
              circle
              size="small"
              aria-label="刷新状态"
              :loading="statusLoading"
              @click="refreshAll"
            ></el-button>
          </el-tooltip>
        </div>
      </header>

      <div ref="messageList" class="message-list" v-loading="messageLoading">
        <div v-if="!messages.length && !messageLoading" class="chat-empty">
          <i class="el-icon-chat-dot-round"></i>
          <h1>本地智能体</h1>
          <p>{{ modelOnline ? selectedModel : '等待本地模型连接' }}</p>
        </div>

        <article
          v-for="(message, index) in messages"
          :key="message.id || `${message.role}-${index}`"
          class="message-row"
          :class="message.role"
        >
          <div class="message-avatar">{{ message.role === 'user' ? '你' : 'AI' }}</div>
          <div class="message-body">
            <div class="message-role">{{ message.role === 'user' ? '你' : selectedModel || '本地模型' }}</div>
            <div class="message-content">{{ message.content }}</div>
            <el-button
              v-if="message.role === 'assistant' && !message.pending"
              type="text"
              size="mini"
              icon="el-icon-edit-outline"
              @click="openCorrection(message, index)"
            >纠正</el-button>
          </div>
        </article>

        <article v-if="sending" class="message-row assistant">
          <div class="message-avatar">AI</div>
          <div class="message-body">
            <div class="message-role">{{ selectedModel || '本地模型' }}</div>
            <div class="thinking"><span></span><span></span><span></span></div>
          </div>
        </article>
      </div>

      <div class="composer">
        <el-input
          v-model="draft"
          type="textarea"
          :rows="3"
          resize="none"
          maxlength="8000"
          show-word-limit
          placeholder="输入消息"
          :disabled="sending"
          @keydown.ctrl.enter.prevent="sendMessage"
        ></el-input>
        <div class="composer__actions">
          <el-checkbox v-model="useKnowledge">使用本地知识</el-checkbox>
          <el-button
            type="primary"
            icon="el-icon-position"
            :loading="sending"
            :disabled="!draft.trim() || !modelOnline"
            @click="sendMessage"
          >发送</el-button>
        </div>
      </div>
    </section>

    <el-dialog title="人工教学" v-model="teachVisible" width="560px" custom-class="agent-dialog">
      <el-form label-position="top">
        <el-form-item label="问题">
          <el-input v-model="teachForm.instruction" type="textarea" :rows="2"></el-input>
        </el-form-item>
        <el-form-item label="正确答案">
          <el-input v-model="teachForm.output" type="textarea" :rows="5"></el-input>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="teachForm.tags" placeholder="多个标签用逗号分隔"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teachVisible = false">取消</el-button>
        <el-button type="primary" :loading="teaching" @click="submitTeach">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog title="纠正回答" v-model="correctionVisible" width="620px" custom-class="agent-dialog">
      <div class="correction-original">{{ correctionForm.answer }}</div>
      <el-form label-position="top">
        <el-form-item label="正确答案">
          <el-input v-model="correctionForm.correction" type="textarea" :rows="6"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="correctionVisible = false">取消</el-button>
        <el-button type="primary" :loading="correcting" @click="submitCorrection">保存纠正</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'

const emptyStats = () => ({
  sessions: 0,
  trainingSamples: 0,
  feedback: 0,
  correctedFeedback: 0
})

export default {
  name: 'Agent',
  data(){
    return {
      health: {},
      models: [],
      selectedModel: '',
      serviceOnline: false,
      modelOnline: false,
      statusLoading: false,
      sessionsLoading: false,
      sessionsVisible: false,
      messageLoading: false,
      sessions: [],
      sessionId: '',
      messages: [],
      stats: emptyStats(),
      draft: '',
      sending: false,
      useKnowledge: true,
      teachVisible: false,
      teaching: false,
      teachForm: {
        instruction: '',
        output: '',
        tags: ''
      },
      correctionVisible: false,
      correcting: false,
      correctionForm: {
        message: '',
        answer: '',
        correction: ''
      },
      exporting: false
    }
  },
  mounted(){
    this.refreshAll()
  },
  methods:{
    async refreshAll(){
      this.statusLoading = true
      try{
        const health = await this.$api.agentHealth()
        this.health = health
        this.serviceOnline = true
        if(!this.selectedModel){
          this.selectedModel = health.model
        }
      }catch(error){
        this.serviceOnline = false
        this.modelOnline = false
      }

      try{
        const result = await this.$api.agentModels()
        this.models = result.models || []
        this.modelOnline = this.models.length > 0
        if(this.models.length && !this.models.some((item) => item.name === this.selectedModel)){
          this.selectedModel = this.models[0].name
        }
      }catch(error){
        this.modelOnline = false
        this.models = this.selectedModel ? [{ name: this.selectedModel }] : []
      }finally{
        this.statusLoading = false
      }

      await Promise.all([this.loadSessions(), this.loadStats()])
    },
    async loadSessions(){
      this.sessionsLoading = true
      try{
        this.sessions = await this.$api.agentSessions({ limit: 50 })
      }catch(error){
        this.sessions = []
      }finally{
        this.sessionsLoading = false
      }
    },
    async loadStats(){
      try{
        this.stats = await this.$api.agentStats()
      }catch(error){
        this.stats = emptyStats()
      }
    },
    async openSession(sessionId){
      if(this.sending || sessionId === this.sessionId){
        return
      }
      this.messageLoading = true
      try{
        const result = await this.$api.agentSession(sessionId)
        this.sessionId = sessionId
        this.messages = result.messages || []
        this.sessionsVisible = false
        this.scrollToBottom()
      }catch(error){
        ElMessage.error(error.message)
      }finally{
        this.messageLoading = false
      }
    },
    newSession(){
      if(this.sending){
        return
      }
      this.sessionId = ''
      this.messages = []
      this.draft = ''
      this.sessionsVisible = false
    },
    async removeSession(item){
      try{
        await ElMessageBox.confirm(`确认删除“${item.title || '该会话'}”？`, '删除会话', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$api.agentDeleteSession(item.sessionId)
        if(this.sessionId === item.sessionId){
          this.newSession()
        }
        await Promise.all([this.loadSessions(), this.loadStats()])
      }catch(error){
        if(error !== 'cancel' && error !== 'close'){
          ElMessage.error(error.message || String(error))
        }
      }
    },
    async sendMessage(){
      const content = this.draft.trim()
      if(!content || this.sending || !this.modelOnline){
        return
      }

      const optimistic = {
        id: `local-${Date.now()}`,
        role: 'user',
        content
      }
      this.messages.push(optimistic)
      this.draft = ''
      this.sending = true
      this.scrollToBottom()

      try{
        const result = await this.$api.agentChat({
          message: content,
          sessionId: this.sessionId,
          model: this.selectedModel,
          useKnowledge: this.useKnowledge
        })
        this.sessionId = result.sessionId
        this.messages.push({
          id: result.messageId,
          role: 'assistant',
          content: result.reply,
          model: result.model
        })
        await Promise.all([this.loadSessions(), this.loadStats()])
      }catch(error){
        this.messages = this.messages.filter((item) => item.id !== optimistic.id)
        this.draft = content
        ElMessage.error(error.message)
      }finally{
        this.sending = false
        this.scrollToBottom()
      }
    },
    openCorrection(message, index){
      const previousUser = [...this.messages.slice(0, index)].reverse().find((item) => item.role === 'user')
      this.correctionForm = {
        message: previousUser?.content || '',
        answer: message.content,
        correction: ''
      }
      this.correctionVisible = true
    },
    async submitCorrection(){
      if(!this.correctionForm.message || !this.correctionForm.correction.trim()){
        ElMessage.warning('请填写正确答案')
        return
      }
      this.correcting = true
      try{
        await this.$api.agentFeedback({
          sessionId: this.sessionId,
          message: this.correctionForm.message,
          answer: this.correctionForm.answer,
          score: -1,
          correction: this.correctionForm.correction.trim()
        })
        this.correctionVisible = false
        await this.loadStats()
        ElMessage.success('纠正已保存')
      }catch(error){
        ElMessage.error(error.message)
      }finally{
        this.correcting = false
      }
    },
    async submitTeach(){
      const instruction = this.teachForm.instruction.trim()
      const output = this.teachForm.output.trim()
      if(!instruction || !output){
        ElMessage.warning('请填写问题和正确答案')
        return
      }
      this.teaching = true
      try{
        await this.$api.agentTeach({
          instruction,
          output,
          tags: this.teachForm.tags.split(/[,，]/).map((item) => item.trim()).filter(Boolean)
        })
        this.teachVisible = false
        this.teachForm = { instruction: '', output: '', tags: '' }
        await this.loadStats()
        ElMessage.success('教学样本已保存')
      }catch(error){
        ElMessage.error(error.message)
      }finally{
        this.teaching = false
      }
    },
    async exportDataset(){
      this.exporting = true
      try{
        const result = await this.$api.agentExport()
        ElMessage.success(`已导出 ${result.count} 条训练数据`)
      }catch(error){
        ElMessage.error(error.message)
      }finally{
        this.exporting = false
      }
    },
    formatDate(value){
      if(!value){
        return ''
      }
      return new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value))
    },
    scrollToBottom(){
      this.$nextTick(() => {
        const element = this.$refs.messageList
        if(element){
          element.scrollTop = element.scrollHeight
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.agent-page{
  height: 100%;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  color: #1f2933;
  background: #fff;
}
.session-panel{
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #dde3ea;
  background: #f7f8fa;
  &__header{
    height: 68px;
    flex: 0 0 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px 0 18px;
    border-bottom: 1px solid #e4e8ed;
    h2{
      margin: 0 0 3px;
      font-size: 15px;
      line-height: 1.2;
    }
    span{
      color: #7a8491;
      font-size: 12px;
    }
  }
  &__header-actions{
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
.mobile-only{
  display: none;
}
.session-list{
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
  &__empty{
    padding: 36px 12px;
    text-align: center;
    color: #929ba6;
    font-size: 13px;
  }
}
.session-item{
  position: relative;
  width: 100%;
  min-height: 58px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 9px 34px 9px 10px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  & + &{
    margin-top: 4px;
  }
  &:hover{
    background: #fff;
  }
  &.active{
    border-color: #b9d7f7;
    background: #eaf4ff;
  }
  &__title{
    display: block;
    overflow: hidden;
    color: #25313d;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__meta{
    color: #818b97;
    font-size: 11px;
  }
  &__delete{
    position: absolute;
    top: 17px;
    right: 10px;
    width: 26px;
    height: 26px;
    display: none;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: #8b949e;
  }
  &:hover &__delete,
  &.active &__delete{
    display: flex;
  }
  &__delete:hover{
    color: #d93025;
    background: #fff0ef;
  }
}
.data-summary{
  height: 44px;
  flex: 0 0 44px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #e4e8ed;
  color: #66717d;
  font-size: 12px;
}
.chat-panel{
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: 68px minmax(0, 1fr) auto;
}
.chat-toolbar{
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid #e4e8ed;
  &__actions{
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    :deep(.el-button + .el-button){
      margin-left: 0;
    }
  }
}
.model-state{
  min-width: 132px;
  display: flex;
  align-items: center;
  gap: 10px;
  .status-dot{
    width: 9px;
    height: 9px;
    flex: 0 0 9px;
    border-radius: 50%;
    &.online{
      background: #22a06b;
      box-shadow: 0 0 0 3px #ddf3e9;
    }
    &.offline{
      background: #e54d42;
      box-shadow: 0 0 0 3px #fde7e5;
    }
  }
  strong,
  span{
    display: block;
  }
  strong{
    font-size: 13px;
    line-height: 1.4;
  }
  span{
    color: #7c8793;
    font-size: 11px;
  }
}
.model-select{
  width: 190px;
}
.message-list{
  min-height: 0;
  overflow-y: auto;
  padding: 28px max(24px, calc((100% - 820px) / 2));
  scroll-behavior: smooth;
}
.chat-empty{
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6e7781;
  i{
    margin-bottom: 16px;
    color: #409eff;
    font-size: 38px;
  }
  h1{
    margin: 0 0 8px;
    color: #26313c;
    font-size: 22px;
  }
  p{
    margin: 0;
    font-size: 13px;
  }
}
.message-row{
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  & + &{
    margin-top: 26px;
  }
}
.message-avatar{
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: #273849;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.message-row.assistant .message-avatar{
  background: #16835f;
}
.message-body{
  min-width: 0;
}
.message-role{
  margin: 0 0 7px;
  color: #5e6975;
  font-size: 12px;
  font-weight: 600;
}
.message-content{
  overflow-wrap: anywhere;
  color: #202a34;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
}
.thinking{
  height: 24px;
  display: flex;
  align-items: center;
  gap: 5px;
  span{
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #7d8995;
    animation: thinking 1.2s infinite ease-in-out;
  }
  span:nth-child(2){ animation-delay: .16s; }
  span:nth-child(3){ animation-delay: .32s; }
}
@keyframes thinking{
  0%, 80%, 100%{ opacity: .3; transform: translateY(0); }
  40%{ opacity: 1; transform: translateY(-3px); }
}
.composer{
  padding: 14px max(24px, calc((100% - 820px) / 2)) 18px;
  border-top: 1px solid #e4e8ed;
  background: #fff;
  &__actions{
    min-height: 38px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-top: 8px;
  }
}
.correction-original{
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 18px;
  padding: 12px;
  border-left: 3px solid #f0ad4e;
  background: #f7f8fa;
  color: #5b6570;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 960px){
  .agent-page{
    grid-template-columns: 210px minmax(0, 1fr);
  }
  .chat-toolbar{
    padding: 0 12px;
  }
  .model-select{
    width: 145px;
  }
  .message-list,
  .composer{
    padding-left: 18px;
    padding-right: 18px;
  }
}

@media (max-width: 680px){
  .agent-page{
    display: block;
    position: relative;
  }
  .session-panel{
    position: absolute;
    z-index: 20;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(82vw, 300px);
    display: flex;
    box-shadow: 10px 0 28px rgba(22, 32, 42, .18);
    transform: translateX(-105%);
    transition: transform .2s ease;
    &.mobile-open{
      transform: translateX(0);
    }
  }
  .mobile-only{
    display: inline-flex;
  }
  .chat-panel{
    height: 100%;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .chat-toolbar{
    min-height: 96px;
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    &__actions{
      width: 100%;
      gap: 6px;
      overflow: visible;
      :deep(.el-button + .el-button){
        margin-left: 0;
      }
    }
  }
  .model-select{
    width: 154px;
    flex: 0 0 154px;
  }
  .refresh-model{
    position: absolute;
    top: 12px;
    right: 12px;
  }
  .message-list{
    padding: 18px 14px;
  }
  .composer{
    padding: 10px 12px 12px;
  }
}
</style>
