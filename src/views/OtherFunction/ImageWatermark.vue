<template>
  <div class="watermark-container">
    <!-- 标题与模板 -->
    <div class="section-title">
      <h2>📸 图片加水印工具</h2>
      <div class="template-toolbar">
        <el-select v-model="selectedTemplate" placeholder="常用模板" size="small" clearable @change="applySavedTemplate">
          <el-option v-for="item in savedTemplates" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-popover placement="bottom-end" :width="280" trigger="click">
          <template #reference><el-button size="small">保存</el-button></template>
          <div class="template-manager">
            <label>模板名称</label>
            <el-input v-model="templateName" placeholder="输入模板名称" maxlength="24" size="small" />
            <el-button type="primary" size="small" @click="saveTemplate">{{ selectedTemplate ? "覆盖保存" : "保存模板" }}</el-button>
          </div>
        </el-popover>
        <el-popover placement="bottom-end" :width="280" trigger="click">
          <template #reference><el-button size="small">管理</el-button></template>
          <div class="template-manager">
            <label>重命名当前模板</label>
            <el-input v-model="templateName" placeholder="先选择常用模板" maxlength="24" size="small" :disabled="!selectedTemplate" />
            <div class="manager-actions">
              <el-button size="small" :disabled="!selectedTemplate" @click="saveTemplate">保存修改</el-button>
              <el-button size="small" type="danger" plain :disabled="!selectedTemplate" @click="deleteTemplate">删除模板</el-button>
            </div>
            <div class="manager-actions">
              <el-button size="small" @click="templateInput?.click()">导入模板</el-button>
              <el-button size="small" @click="exportTemplate">导出模板</el-button>
            </div>
          </div>
        </el-popover>
        <input ref="templateInput" type="file" accept=".json,application/json" style="display: none" @change="importTemplate" />
      </div>
    </div>

    <div class="workspace-layout">
      <!-- 左侧配置 -->
      <div class="settings-panel">
        <el-tabs v-model="activeTab" class="tabs">
          <el-tab-pane label="文字水印" name="text">
            <div class="mode-content">
              <!-- 选择图片 -->
              <div class="upload-section">
                <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
                  <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleImageUpload" />
                  <button class="upload-btn" @click="fileInput?.click()">
                    <el-icon><upload-filled /></el-icon>
                    <span class="upload-name" :title="imageName">{{ originalImage ? (imageName || '已选择图片') : '拖拽图片到此，或点击选择' }}</span>
                    <em v-if="originalImage">更换图片</em>
                  </button>
                  <div v-if="!originalImage" class="el-upload__tip">JPG / PNG / WebP，动图输出静态图</div>
                </div>
              </div>

              <!-- 文字水印配置 -->
              <div class="config-section">
                <div class="section-heading">
                  <span class="section-label">水印配置</span>
                  <div class="action-buttons">
                    <el-button type="text" size="small" @click="addTextWatermarkAction()" :loading="processing" :disabled="!originalImage">重新生成</el-button>
                    <el-button type="text" size="small" @click="resetText">重置</el-button>
                  </div>
                </div>

                <div class="config-row full-row">
                  <label>水印文字</label>
                  <el-input v-model="textConfig.text" placeholder="输入水印文字" maxlength="80" />
                </div>

                <div class="config-row">
                  <div class="config-label">
                    字体大小
                    <el-checkbox :model-value="textConfig.sizeMode === 'relative'" @change="textConfig.sizeMode = $event ? 'relative' : 'pixel'">随图</el-checkbox>
                  </div>
                  <div class="range-group">
                    <el-slider
                      v-if="textConfig.sizeMode === 'relative'"
                      v-model="textConfig.fontSizeRatio"
                      :min="0.01"
                      :max="0.3"
                      :step="0.005"
                      style="flex: 1; margin-right: 10px"
                    />
                    <el-slider
                      v-else
                      v-model="textConfig.fontSize"
                      :min="10"
                      :max="100"
                      style="flex: 1; margin-right: 10px"
                    />
                    <span class="value-display">{{ textConfig.sizeMode === "relative" ? (textConfig.fontSizeRatio * 100).toFixed(1) + "%" : textConfig.fontSize + "px" }}</span>
                  </div>
                </div>

                <div class="config-row">
                  <label>透明度</label>
                  <div class="range-group">
                    <el-slider
                      v-model="textConfig.opacity"
                      :min="0"
                      :max="1"
                      :step="0.05"
                      style="flex: 1; margin-right: 10px"
                    />
                    <span class="value-display"
                      >{{ (textConfig.opacity * 100).toFixed(0) }}%</span
                    >
                  </div>
                </div>

                <div class="config-row">
                  <label>水印位置</label>
                  <el-select v-model="textConfig.position" style="width: 100%">
                    <el-option label="左上" value="top-left" />
                    <el-option label="右上" value="top-right" />
                    <el-option label="左下" value="bottom-left" />
                    <el-option label="右下" value="bottom-right" />
                    <el-option label="中心" value="center" />
                  </el-select>
                </div>

                <div class="config-row">
                  <label>文字颜色</label>
                  <el-color-picker
                    v-model="textColor"
                    show-alpha
                    style="width: 100%"
                  />
                </div>

                <div class="config-row">
                  <label>{{ textConfig.sizeMode === "relative" ? "X边距（短边%）" : "X轴偏移 (px)" }}</label>
                  <div v-if="textConfig.sizeMode === 'relative'" class="range-group">
                    <el-slider v-model="textConfig.marginXRatio" :min="0" :max="0.3" :step="0.005" style="flex: 1; margin-right: 10px" />
                    <span class="value-display">{{ (textConfig.marginXRatio * 100).toFixed(1) }}%</span>
                  </div>
                  <el-input-number
                    v-else
                    v-model="textConfig.offsetX"
                    :min="0"
                    :max="500"
                    style="width: 100%"
                  />
                </div>

                <div class="config-row">
                  <label>{{ textConfig.sizeMode === "relative" ? "Y边距（短边%）" : "Y轴偏移 (px)" }}</label>
                  <div v-if="textConfig.sizeMode === 'relative'" class="range-group">
                    <el-slider v-model="textConfig.marginYRatio" :min="0" :max="0.3" :step="0.005" style="flex: 1; margin-right: 10px" />
                    <span class="value-display">{{ (textConfig.marginYRatio * 100).toFixed(1) }}%</span>
                  </div>
                  <el-input-number
                    v-else
                    v-model="textConfig.offsetY"
                    :min="0"
                    :max="500"
                    style="width: 100%"
                  />
                </div>
                <div class="effect-row">
                  <el-checkbox v-model="textConfig.outline">描边</el-checkbox>
                  <el-checkbox v-model="textConfig.shadow">阴影</el-checkbox>
                  <el-checkbox v-model="textConfig.background">底色</el-checkbox>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="平铺水印" name="tiled">
            <div class="mode-content">
              <!-- 选择图片 -->
              <div class="upload-section">
                <div class="upload-area" @dragover.prevent @drop.prevent="handleDropTiled">
                  <input ref="fileInputTiled" type="file" accept="image/*" style="display: none" @change="handleImageUploadTiled" />
                  <button class="upload-btn" @click="fileInputTiled?.click()">
                    <el-icon><upload-filled /></el-icon>
                    <span class="upload-name" :title="imageNameTiled">{{ originalImageTiled ? (imageNameTiled || '已选择图片') : '拖拽图片到此，或点击选择' }}</span>
                    <em v-if="originalImageTiled">更换图片</em>
                  </button>
                  <div v-if="!originalImageTiled" class="el-upload__tip">JPG / PNG / WebP，动图输出静态图</div>
                </div>
              </div>

              <!-- 平铺水印配置 -->
              <div class="config-section">
                <div class="section-heading">
                  <span class="section-label">水印配置</span>
                  <div class="action-buttons">
                    <el-button type="text" size="small" @click="addTiledWatermarkAction()" :loading="processing" :disabled="!originalImageTiled">重新生成</el-button>
                    <el-button type="text" size="small" @click="resetTiled">重置</el-button>
                  </div>
                </div>

                <div class="config-row full-row">
                  <label>水印文字</label>
                  <el-input v-model="tiledConfig.text" placeholder="输入水印文字" maxlength="80" />
                </div>

                <div class="config-row">
                  <div class="config-label">
                    字体大小
                    <el-checkbox :model-value="tiledConfig.sizeMode === 'relative'" @change="tiledConfig.sizeMode = $event ? 'relative' : 'pixel'">随图</el-checkbox>
                  </div>
                  <div class="range-group">
                    <el-slider
                      v-if="tiledConfig.sizeMode === 'relative'"
                      v-model="tiledConfig.fontSizeRatio"
                      :min="0.01"
                      :max="0.3"
                      :step="0.005"
                      style="flex: 1; margin-right: 10px"
                    />
                    <el-slider
                      v-else
                      v-model="tiledConfig.fontSize"
                      :min="15"
                      :max="80"
                      style="flex: 1; margin-right: 10px"
                    />
                    <span class="value-display">{{ tiledConfig.sizeMode === "relative" ? (tiledConfig.fontSizeRatio * 100).toFixed(1) + "%" : tiledConfig.fontSize + "px" }}</span>
                  </div>
                </div>

                <div class="config-row">
                  <label>透明度</label>
                  <div class="range-group">
                    <el-slider
                      v-model="tiledConfig.opacity"
                      :min="0"
                      :max="1"
                      :step="0.05"
                      style="flex: 1; margin-right: 10px"
                    />
                    <span class="value-display"
                      >{{ (tiledConfig.opacity * 100).toFixed(0) }}%</span
                    >
                  </div>
                </div>

                <div class="config-row">
                  <label>旋转角度</label>
                  <div class="range-group">
                    <el-slider
                      v-model="tiledConfig.angle"
                      :min="-90"
                      :max="90"
                      style="flex: 1; margin-right: 10px"
                    />
                    <span class="value-display">{{ tiledConfig.angle }}°</span>
                  </div>
                </div>

                <div class="config-row">
                  <label>{{ tiledConfig.sizeMode === "relative" ? "间距（短边%）" : "水印间距 (px)" }}</label>
                  <div v-if="tiledConfig.sizeMode === 'relative'" class="range-group">
                    <el-slider v-model="tiledConfig.spacingRatio" :min="0.02" :max="1" :step="0.01" style="flex: 1; margin-right: 10px" />
                    <span class="value-display">{{ Math.round(tiledConfig.spacingRatio * 100) }}%</span>
                  </div>
                  <el-input-number
                    v-else
                    v-model="tiledConfig.spacing"
                    :min="30"
                    :max="300"
                    style="width: 100%"
                  />
                </div>

                <div class="config-row">
                  <label>文字颜色</label>
                  <el-color-picker
                    v-model="tiledColor"
                    show-alpha
                    style="width: 100%"
                  />
                </div>
                <div class="effect-row">
                  <el-checkbox v-model="tiledConfig.outline">描边</el-checkbox>
                  <el-checkbox v-model="tiledConfig.shadow">阴影</el-checkbox>
                  <el-checkbox v-model="tiledConfig.background">底色</el-checkbox>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 导出设置 -->
        <div class="config-section export-section">
          <div class="section-heading"><span class="section-label">导出设置</span></div>
          <div class="config-row">
            <label>图片格式</label>
            <el-select v-model="outputConfig.mimeType" size="small">
              <el-option label="PNG（无损）" value="image/png" />
              <el-option label="JPEG（白底）" value="image/jpeg" />
              <el-option label="WebP" value="image/webp" />
            </el-select>
          </div>
          <div class="config-row">
            <label>最长边（px，0 原图）</label>
            <el-input-number v-model="outputConfig.maxSize" :min="0" :max="8192" :step="128" size="small" />
          </div>
          <details class="export-more">
            <summary>更多设置</summary>
            <div v-if="outputConfig.mimeType !== 'image/png'" class="config-row">
              <label>质量 {{ Math.round(outputConfig.quality * 100) }}%</label>
              <el-slider v-model="outputConfig.quality" :min="0.1" :max="1" :step="0.05" />
            </div>
            <div class="config-row">
              <label>文件名（自动匹配后缀）</label>
              <el-input v-model="outputConfig.filename" maxlength="120" size="small" placeholder="watermarked" />
            </div>
          </details>
        </div>
      </div>

      <!-- 右侧预览与下载 -->
      <div class="preview-section">
        <div class="preview-heading">
          <span class="section-label">实时预览</span>
          <span class="preview-status">{{ processing ? "更新中…" : (watermarkedImage ? "已更新" : "等待选择图片") }}</span>
        </div>
        <div class="preview-canvas">
          <img
            v-if="activeTab === 'text' ? originalImage : originalImageTiled"
            :src="watermarkedImage || (activeTab === 'text' ? originalImage : originalImageTiled)"
            class="preview-image"
            alt="图片水印实时预览"
          />
          <div v-else class="preview-empty">选择图片后显示水印效果</div>
        </div>
        <div class="preview-footer">
          <span class="export-summary">
            {{ { "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP" }[outputConfig.mimeType] }}
            · {{ outputConfig.maxSize ? "最长边 " + outputConfig.maxSize + "px" : "原图尺寸" }}
          </span>
          <div class="download-buttons">
            <el-button size="small" @click="copyImageUrl" :disabled="!watermarkedImage || processing">复制图片 URL</el-button>
            <el-button type="primary" size="small" @click="downloadImage" :disabled="!watermarkedImage || processing">下载图片</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载提示 -->
    <el-dialog
      v-model="showLoadingDialog"
      title="处理中"
      :close-on-click-modal="false"
      :show-close="false"
      width="30%"
    >
      <div style="text-align: center; padding: 20px">
        <el-icon
          class="is-loading"
          style="font-size: 32px; margin-bottom: 10px"
        >
          <loading />
        </el-icon>
        <p>正在处理图片，请稍候...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import {
  addTextWatermark,
  addTiledWatermark,
  downloadWatermarkedImage,
} from "@/utils/watermark";

// 状态
const activeTab = ref("text");
const processing = ref(false);
const showLoadingDialog = ref(false);

// 图片相关
const originalImage = ref("");
const originalImageTiled = ref("");
const watermarkedImage = ref("");
const imageName = ref("");
const imageNameTiled = ref("");
const fileInput = ref(null);
const fileInputTiled = ref(null);
const imageReaders = new Map();
let previewTimer;
let renderVersion = 0;

// 文字水印配置
const defaultTextConfig = {
  text: "仅供学习使用",
  fontSize: 48,
  opacity: 0.85,
  position: "center",
  offsetX: 10,
  offsetY: 10,
  sizeMode: "relative",
  fontSizeRatio: 0.08,
  marginXRatio: 0.025,
  marginYRatio: 0.025,
  outline: true,
  shadow: false,
  background: false,
};
const textConfig = ref({ ...defaultTextConfig });

const textColor = ref("#b42318");

// 平铺水印配置
const defaultTiledConfig = {
  text: "仅供学习使用",
  fontSize: 40,
  opacity: 0.55,
  angle: -30,
  spacing: 80,
  sizeMode: "relative",
  fontSizeRatio: 0.06,
  spacingRatio: 0.15,
  outline: true,
  shadow: false,
  background: false,
};
const tiledConfig = ref({ ...defaultTiledConfig });

const tiledColor = ref("#b42318");

// 导出设置
const defaultOutputConfig = {
  mimeType: "image/png",
  quality: 0.92,
  maxSize: 0,
  filename: "watermarked",
};
const outputConfig = ref({ ...defaultOutputConfig });

// 常用模板只保存配置，不保存图片和临时地址。
const templateStorageKey = "image-watermark-templates-v1";
const savedTemplates = ref([]);
const selectedTemplate = ref("");
const templateName = ref("");
const templateInput = ref(null);
let templateImportVersion = 0;

const validateTemplate = (value) => {
  if (
    !value || value.version !== 1 || !["text", "tiled"].includes(value.mode) ||
    !value.config || typeof value.config !== "object" || Array.isArray(value.config) ||
    !value.output || typeof value.output !== "object" || Array.isArray(value.output)
  ) {
    throw new Error("模板格式不正确或版本不支持");
  }

  const config = { ...(value.mode === "text" ? defaultTextConfig : defaultTiledConfig) };
  for (const key of Object.keys(config)) {
    if (Object.prototype.hasOwnProperty.call(value.config, key)) config[key] = value.config[key];
  }
  const ranges = {
    fontSize: value.mode === "text" ? [10, 100] : [15, 80],
    opacity: [0, 1], fontSizeRatio: [0.01, 0.3],
    offsetX: [0, 500], offsetY: [0, 500],
    marginXRatio: [0, 0.3], marginYRatio: [0, 0.3],
    angle: [-90, 90], spacing: [30, 300], spacingRatio: [0.02, 1],
  };
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (key in config && (!Number.isFinite(config[key]) || config[key] < min || config[key] > max)) {
      throw new Error("模板中的字号、透明度或位置参数不正确");
    }
  }
  if (
    typeof config.text !== "string" || !config.text.trim() || config.text.length > 80 ||
    !["relative", "pixel"].includes(config.sizeMode) ||
    ["outline", "shadow", "background"].some((key) => typeof config[key] !== "boolean") ||
    (value.mode === "text" && !["top-left", "top-right", "bottom-left", "bottom-right", "center"].includes(config.position))
  ) {
    throw new Error("模板中的水印配置不正确");
  }
  if (
    typeof value.color !== "string" || value.color.length > 64 ||
    !/^(#[\da-f]{3}|#[\da-f]{4}|#[\da-f]{6}|#[\da-f]{8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\))$/i.test(value.color) ||
    (typeof CSS !== "undefined" && !CSS.supports("color", value.color))
  ) {
    throw new Error("模板中的颜色不正确");
  }

  const output = { ...defaultOutputConfig };
  for (const key of Object.keys(output)) {
    if (Object.prototype.hasOwnProperty.call(value.output, key)) output[key] = value.output[key];
  }
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(output.mimeType) ||
    !Number.isFinite(output.quality) || output.quality < 0 || output.quality > 1 ||
    !Number.isFinite(output.maxSize) || output.maxSize < 0 || output.maxSize > 8192 ||
    typeof output.filename !== "string" || output.filename.length > 120
  ) {
    throw new Error("模板中的导出设置不正确");
  }
  return { version: 1, mode: value.mode, config, color: value.color, output };
};

const getCurrentTemplate = () => validateTemplate({
  version: 1,
  mode: activeTab.value,
  config: activeTab.value === "text" ? textConfig.value : tiledConfig.value,
  color: activeTab.value === "text" ? textColor.value : tiledColor.value,
  output: outputConfig.value,
});

const applyTemplate = (value) => {
  const template = validateTemplate(value);
  templateImportVersion += 1;
  if (template.mode === "text") {
    textConfig.value = template.config;
    textColor.value = template.color;
  } else {
    tiledConfig.value = template.config;
    tiledColor.value = template.color;
  }
  outputConfig.value = template.output;
  activeTab.value = template.mode;
};

const loadTemplates = () => {
  if (typeof localStorage === "undefined") return;
  try {
    const stored = localStorage.getItem(templateStorageKey);
    if (!stored) return;
    if (stored.length > 256 * 1024) throw new Error("模板数据过大");
    const list = JSON.parse(stored);
    if (!Array.isArray(list) || list.length > 50) throw new Error("模板列表格式不正确");
    const ids = new Set();
    const templates = list.map((item) => {
      if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id) || typeof item.name !== "string" || !item.name.trim() || item.name.length > 24) {
        throw new Error("模板名称或编号不正确");
      }
      ids.add(item.id);
      return { ...validateTemplate(item), id: item.id, name: item.name };
    });
    savedTemplates.value = templates;
  } catch (error) {
    ElMessage.warning("本地模板读取失败，可重新导入模板");
  }
};

const applySavedTemplate = (id) => {
  const template = savedTemplates.value.find((item) => item.id === id);
  if (!template) {
    templateName.value = "";
    return;
  }
  try {
    applyTemplate(template);
    templateName.value = template.name;
  } catch (error) {
    ElMessage.error(error.message);
  }
};

const saveTemplate = () => {
  const name = templateName.value.trim();
  if (!name || name.length > 24) return ElMessage.warning("请输入 1-24 字的模板名称");
  try {
    const id = selectedTemplate.value || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (savedTemplates.value.some((item) => item.name === name && item.id !== id)) {
      throw new Error("已有同名模板，请先选择后覆盖保存");
    }
    const next = savedTemplates.value.filter((item) => item.id !== id);
    next.push({ ...getCurrentTemplate(), id, name });
    if (next.length > 50) throw new Error("最多保存 50 个常用模板");
    localStorage.setItem(templateStorageKey, JSON.stringify(next));
    savedTemplates.value = next;
    selectedTemplate.value = id;
    ElMessage.success("模板已保存到当前浏览器");
  } catch (error) {
    ElMessage.error("模板保存失败：" + error.message);
  }
};

const deleteTemplate = () => {
  if (!selectedTemplate.value) return;
  try {
    const next = savedTemplates.value.filter((item) => item.id !== selectedTemplate.value);
    localStorage.setItem(templateStorageKey, JSON.stringify(next));
    savedTemplates.value = next;
    selectedTemplate.value = "";
    templateName.value = "";
    ElMessage.success("模板已删除");
  } catch (error) {
    ElMessage.error("模板删除失败：" + error.message);
  }
};

const exportTemplate = () => {
  try {
    const blob = new Blob([JSON.stringify(getCurrentTemplate(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const name = (templateName.value.trim() || "watermark-template").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_");
    try {
      downloadWatermarkedImage(url, `${name}.json`);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    ElMessage.error("模板导出失败：" + error.message);
  }
};

const importTemplate = async (event) => {
  const [file] = event.target.files || [];
  const requestVersion = ++templateImportVersion;
  event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 32 * 1024) throw new Error("请选择 32KB 以内的 JSON 模板");
    const content = await file.text();
    if (requestVersion !== templateImportVersion) return;
    applyTemplate(JSON.parse(content));
    selectedTemplate.value = "";
    templateName.value = file.name.replace(/\.json$/i, "").slice(0, 24);
    ElMessage.success("模板已应用，可保存到常用模板");
  } catch (error) {
    if (requestVersion === templateImportVersion) ElMessage.error("模板导入失败：" + error.message);
  }
};

loadTemplates();

// 处理图片上传
const revokeWatermarkedImage = (image = watermarkedImage.value) => {
  if (image?.startsWith("blob:")) {
    URL.revokeObjectURL(image);
  }
};

const setWatermarkedImage = (nextImage) => {
  revokeWatermarkedImage();
  watermarkedImage.value = nextImage;
};

const readImageFile = (file, targetRef) => {
  if (!file) {
    return;
  }

  imageReaders.get(targetRef)?.abort();
  const reader = new FileReader();
  imageReaders.set(targetRef, reader);
  targetRef.value = "";
  const filenameRef = targetRef === originalImage ? imageName : imageNameTiled;
  filenameRef.value = "";
  reader.onload = (e) => {
    if (imageReaders.get(targetRef) !== reader) {
      return;
    }
    imageReaders.delete(targetRef);
    targetRef.value = e.target?.result || "";
    filenameRef.value = file.name || "";
  };
  reader.onerror = () => {
    if (imageReaders.get(targetRef) === reader) {
      imageReaders.delete(targetRef);
      ElMessage.error("图片读取失败，请重新选择");
    }
  };
  reader.readAsDataURL(file);
};

const handleImageUpload = (event) => {
  const [file] = event.target.files || [];
  readImageFile(file, originalImage);
};

const handleImageUploadTiled = (event) => {
  const [file] = event.target.files || [];
  readImageFile(file, originalImageTiled);
};

const handleDrop = (event) => {
  const [file] = event.dataTransfer?.files || [];
  readImageFile(file, originalImage);
};

const handleDropTiled = (event) => {
  const [file] = event.dataTransfer?.files || [];
  readImageFile(file, originalImageTiled);
};

// 添加文字水印
const addTextWatermarkAction = async (automatic = false) => {
  clearTimeout(previewTimer);
  const requestVersion = ++renderVersion;
  if (!originalImage.value) {
    if (!automatic) ElMessage.error("请先选择图片");
    return;
  }

  processing.value = true;
  showLoadingDialog.value = !automatic;

  try {
    const result = await addTextWatermark(originalImage.value, {
      ...textConfig.value,
      ...outputConfig.value,
      textColor: textColor.value,
    });
    if (requestVersion !== renderVersion) {
      revokeWatermarkedImage(result);
      return;
    }
    setWatermarkedImage(result);

    if (!automatic) ElMessage.success("水印添加成功！");
  } catch (error) {
    if (requestVersion === renderVersion) {
      setWatermarkedImage("");
      ElMessage.error("处理失败: " + error.message);
      console.error(error);
    }
  } finally {
    if (requestVersion === renderVersion) {
      processing.value = false;
      showLoadingDialog.value = false;
    }
  }
};

// 添加平铺水印
const addTiledWatermarkAction = async (automatic = false) => {
  clearTimeout(previewTimer);
  const requestVersion = ++renderVersion;
  if (!originalImageTiled.value) {
    if (!automatic) ElMessage.error("请先选择图片");
    return;
  }

  processing.value = true;
  showLoadingDialog.value = !automatic;

  try {
    const result = await addTiledWatermark(originalImageTiled.value, {
      ...tiledConfig.value,
      ...outputConfig.value,
      textColor: tiledColor.value,
    });
    if (requestVersion !== renderVersion) {
      revokeWatermarkedImage(result);
      return;
    }
    setWatermarkedImage(result);

    if (!automatic) ElMessage.success("水印添加成功！");
  } catch (error) {
    if (requestVersion === renderVersion) {
      setWatermarkedImage("");
      ElMessage.error("处理失败: " + error.message);
      console.error(error);
    }
  } finally {
    if (requestVersion === renderVersion) {
      processing.value = false;
      showLoadingDialog.value = false;
    }
  }
};

// 配置变化后合并连续输入，只接收当前模式和最新配置对应的结果。
watch(
  () => [
    activeTab.value,
    activeTab.value === "text" ? originalImage.value : originalImageTiled.value,
    activeTab.value === "text" ? textConfig.value : tiledConfig.value,
    activeTab.value === "text" ? textColor.value : tiledColor.value,
    outputConfig.value.mimeType,
    outputConfig.value.quality,
    outputConfig.value.maxSize,
  ],
  ([mode, image], previous = []) => {
    renderVersion += 1;
    clearTimeout(previewTimer);
    showLoadingDialog.value = false;
    if (mode !== previous[0] || image !== previous[1]) {
      setWatermarkedImage("");
    }
    processing.value = Boolean(image);
    if (!image) return;
    previewTimer = setTimeout(() => {
      if (mode === "text") {
        addTextWatermarkAction(true);
      } else {
        addTiledWatermarkAction(true);
      }
    }, 150);
  },
  { deep: true, flush: "sync" },
);

// 下载图片
const getDownloadFilename = () => {
  const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[outputConfig.value.mimeType];
  const name = String(outputConfig.value.filename || "watermarked")
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\.(png|jpe?g|webp|gif)$/i, "")
    .replace(/[.\s]+$/g, "")
    .trim() || "watermarked";
  return `${name}.${extension}`;
};

const downloadImage = () => {
  if (processing.value) return;
  if (!watermarkedImage.value) {
    ElMessage.error("没有可下载的图片");
    return;
  }

  downloadWatermarkedImage(watermarkedImage.value, getDownloadFilename());
  ElMessage.success("正在下载...");
};

// 复制图片 URL
const copyImageUrl = () => {
  if (processing.value) return;
  if (!watermarkedImage.value) {
    ElMessage.error("没有可复制的图片");
    return;
  }

  navigator.clipboard
    .writeText(watermarkedImage.value)
    .then(() => {
      ElMessage.success("图片 URL 已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

// 重置表单
const resetText = () => {
  templateImportVersion += 1;
  imageReaders.get(originalImage)?.abort();
  imageReaders.delete(originalImage);
  originalImage.value = "";
  imageName.value = "";
  setWatermarkedImage("");
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  textConfig.value = { ...defaultTextConfig };
  textColor.value = "#b42318";
  selectedTemplate.value = "";
  templateName.value = "";
};

const resetTiled = () => {
  templateImportVersion += 1;
  imageReaders.get(originalImageTiled)?.abort();
  imageReaders.delete(originalImageTiled);
  originalImageTiled.value = "";
  imageNameTiled.value = "";
  setWatermarkedImage("");
  if (fileInputTiled.value) {
    fileInputTiled.value.value = "";
  }
  tiledConfig.value = { ...defaultTiledConfig };
  tiledColor.value = "#b42318";
  selectedTemplate.value = "";
  templateName.value = "";
};

onBeforeUnmount(() => {
  templateImportVersion += 1;
  renderVersion += 1;
  clearTimeout(previewTimer);
  imageReaders.forEach((reader) => reader.abort());
  imageReaders.clear();
  revokeWatermarkedImage();
});
</script>

<style scoped lang="scss">
.watermark-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  background: var(--app-canvas);

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    flex-shrink: 0;
    gap: 8px 16px;
    color: var(--app-heading);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
    }
  }

  .template-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;

    :deep(.el-select) {
      width: 160px;
    }
    :deep(.el-button) {
      margin-left: 0;
    }
    :deep(.el-input),
    :deep(.el-input__inner) {
      height: 28px;
      min-height: 28px;
      line-height: 28px;
    }
  }

  .workspace-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    flex: 1;
    min-height: 0;
    gap: 16px;
  }

  .settings-panel {
    min-width: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
  }

  .tabs {
    margin: 0;
    :deep(.el-tabs__header) {
      margin: 0 0 8px;
    }
    :deep(.el-tabs__item) {
      height: 30px;
      line-height: 30px;
    }
    :deep(.el-tabs__content) {
      overflow: visible;
    }
  }

  .mode-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    display: block;
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    color: var(--app-heading);
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .upload-area {
    overflow: hidden;
    border: 1px dashed var(--app-control-edge);
    border-radius: 6px;
    background: var(--app-accent-soft);

    .upload-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 34px;
      padding: 6px 10px;
      border: none;
      background: transparent;
      color: var(--app-text);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }

    .upload-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    em {
      flex-shrink: 0;
      color: var(--app-accent);
      font-style: normal;
    }
    .el-upload__tip {
      padding: 0 8px 4px;
      font-size: 11px;
      line-height: 15px;
      color: var(--app-muted);
    }
  }

  .config-section {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 10px;
    background: var(--app-subtle);
    border-radius: 6px;
    padding: 10px;

    .section-heading,
    .config-row.full-row {
      grid-column: 1 / -1;
    }

    .section-label {
      margin-bottom: 0;
    }

    .config-row {
      min-width: 0;
      margin-bottom: 0;

      label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        line-height: 16px;
        color: var(--app-text);
        margin-bottom: 4px;
      }

      .config-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 16px;
        margin-bottom: 4px;
        color: var(--app-text);
        font-size: 12px;
        font-weight: 500;
        line-height: 16px;

        :deep(.el-checkbox) {
          height: 16px;
          margin-right: 0;
        }

        :deep(.el-checkbox__label) {
          padding-left: 4px;
          font-size: 12px;
        }
      }

      .range-group {
        display: flex;
        align-items: center;
        height: 28px;

        :deep(.el-slider) {
          min-width: 0;
        }

        .value-display {
          display: inline-block;
          min-width: 34px;
          font-size: 12px;
          text-align: right;
          font-weight: 500;
          color: var(--app-accent);
        }
      }
    }

    :deep(.el-input),
    :deep(.el-input__inner),
    :deep(.el-input-number),
    :deep(.el-select),
    :deep(.el-color-picker) {
      height: 28px;
      min-height: 28px;
      line-height: 28px;
    }

    :deep(.el-input-number) {
      line-height: 30px;
    }

    :deep(.el-color-picker__trigger) {
      height: 28px;
    }

    .effect-row {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 16px;

      :deep(.el-checkbox) {
        height: 24px;
        margin-right: 0;
      }

      :deep(.el-checkbox__label) {
        padding-left: 6px;
        font-size: 12px;
      }
    }
  }
  .action-buttons {
    display: flex;
    gap: 6px;
    :deep(.el-button) {
      height: 20px;
      min-height: 20px;
      margin: 0;
      padding: 0 2px;
      font-size: 12px;
    }
  }

  .export-section {
    margin-top: 8px;
    background: var(--app-surface);
    border: 1px solid var(--app-edge);
    :deep(.el-select),
    :deep(.el-input-number) {
      width: 100%;
    }
  }

  .export-more {
    grid-column: 1 / -1;
    min-width: 0;
    font-size: 12px;
    summary {
      cursor: pointer;
      color: var(--app-muted);
      line-height: 22px;
    }
    .config-row {
      margin-top: 8px;
    }
    :deep(.el-slider) {
      margin: 0 8px;
    }
  }

  .preview-section {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--app-edge);
    border-radius: 8px;
    background: var(--app-surface);
  }

  .preview-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    gap: 8px;
    padding: 10px 14px;
  }

  .preview-status, .export-summary {
    color: var(--app-muted);
    font-size: 12px;
    line-height: 18px;
  }

  .preview-canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    padding: 12px;
    background: var(--app-subtle);
  }

  .preview-image {
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    object-fit: contain;
  }

  .preview-empty {
    padding: 12px;
    color: var(--app-muted);
    font-size: 13px;
    text-align: center;
  }

  .preview-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 64px 10px 12px;
    border-top: 1px solid var(--app-divider);
    background: var(--app-surface);
  }

  .download-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    :deep(.el-button) {
      height: 32px;
      min-height: 32px;
      margin: 0;
    }
  }
}

.template-manager {
  display: grid;
  gap: 10px;
  font-size: 12px;
  .manager-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  :deep(.el-button) {
    margin: 0;
  }
}

@media (max-width: 760px) {
  .watermark-container {
    height: auto;
    min-height: 100%;
    overflow: visible;
    .workspace-layout {
      grid-template-columns: minmax(0, 1fr);
      flex: none;
    }
    .settings-panel {
      overflow: visible;
      padding-right: 0;
    }
    .preview-section {
      height: clamp(320px, 65vh, 520px);
    }
    .template-toolbar {
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 420px) {
  .watermark-container {
    .config-section {
      grid-template-columns: minmax(0, 1fr);
    }
    .template-toolbar {
      width: 100%;
    }
    .template-toolbar :deep(.el-select) {
      flex: 1;
      min-width: 0;
    }
    .download-buttons {
      flex-wrap: wrap;
    }
  }
}
</style>
