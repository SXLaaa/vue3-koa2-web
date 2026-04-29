<template>
  <div class="watermark-container">
    <!-- 标题 -->
    <div class="section-title">
      <h2>📸 图片加水印工具</h2>
    </div>

    <!-- 功能切换标签页 -->
    <el-tabs v-model="activeTab" class="tabs">
      <!-- 文字水印 -->
      <el-tab-pane label="文字水印" name="text">
        <div class="tab-content">
          <!-- 上传区域 -->
          <div class="upload-section">
            <label class="section-label">1. 选择图片</label>
            <div
              class="upload-area"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleImageUpload"
              />
              <button class="upload-btn" @click="fileInput?.click()">
                <el-icon><upload-filled /></el-icon>
                <div>
                  拖拽图片到此或<em style="color: #409eff">点击上传</em>
                </div>
              </button>
              <div class="el-upload__tip" style="margin-top: 10px">
                支持 JPG, PNG, GIF 等常见图片格式
              </div>
            </div>
          </div>

          <!-- 原始图片预览 -->
          <div v-if="originalImage" class="preview-section">
            <label class="section-label">原始图片</label>
            <img :src="originalImage" class="preview-image" />
          </div>

          <!-- 文字水印配置 -->
          <div class="config-section">
            <label class="section-label">2. 水印配置</label>

            <div class="config-row">
              <label>水印文字</label>
              <el-input v-model="textConfig.text" placeholder="输入水印文字" />
            </div>

            <div class="config-row">
              <label>字体大小</label>
              <div class="range-group">
                <el-slider
                  v-model="textConfig.fontSize"
                  :min="10"
                  :max="100"
                  style="flex: 1; margin-right: 10px"
                />
                <span class="value-display">{{ textConfig.fontSize }}px</span>
              </div>
            </div>

            <div class="config-row">
              <label>透明度</label>
              <div class="range-group">
                <el-slider
                  v-model="textConfig.opacity"
                  :min="0"
                  :max="1"
                  :step="0.1"
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
              <label>X轴偏移 (px)</label>
              <el-input-number
                v-model="textConfig.offsetX"
                :min="0"
                :max="500"
                style="width: 100%"
              />
            </div>

            <div class="config-row">
              <label>Y轴偏移 (px)</label>
              <el-input-number
                v-model="textConfig.offsetY"
                :min="0"
                :max="500"
                style="width: 100%"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button
              type="primary"
              @click="addTextWatermarkAction"
              :loading="processing"
              :disabled="!originalImage"
            >
              生成水印图片
            </el-button>
            <el-button @click="resetText">重置</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 平铺水印 -->
      <el-tab-pane label="平铺水印" name="tiled">
        <div class="tab-content">
          <!-- 上传区域 -->
          <div class="upload-section">
            <label class="section-label">1. 选择图片</label>
            <div
              class="upload-area"
              @dragover.prevent
              @drop.prevent="handleDropTiled"
            >
              <input
                ref="fileInputTiled"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleImageUploadTiled"
              />
              <button class="upload-btn" @click="fileInputTiled?.click()">
                <el-icon><upload-filled /></el-icon>
                <div>
                  拖拽图片到此或<em style="color: #409eff">点击上传</em>
                </div>
              </button>
            </div>
          </div>

          <!-- 原始图片预览 -->
          <div v-if="originalImageTiled" class="preview-section">
            <label class="section-label">原始图片</label>
            <img :src="originalImageTiled" class="preview-image" />
          </div>

          <!-- 平铺水印配置 -->
          <div class="config-section">
            <label class="section-label">2. 水印配置</label>

            <div class="config-row">
              <label>水印文字</label>
              <el-input v-model="tiledConfig.text" placeholder="输入水印文字" />
            </div>

            <div class="config-row">
              <label>字体大小</label>
              <div class="range-group">
                <el-slider
                  v-model="tiledConfig.fontSize"
                  :min="15"
                  :max="80"
                  style="flex: 1; margin-right: 10px"
                />
                <span class="value-display">{{ tiledConfig.fontSize }}px</span>
              </div>
            </div>

            <div class="config-row">
              <label>透明度</label>
              <div class="range-group">
                <el-slider
                  v-model="tiledConfig.opacity"
                  :min="0"
                  :max="1"
                  :step="0.1"
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
              <label>水印间距 (px)</label>
              <el-input-number
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
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button
              type="primary"
              @click="addTiledWatermarkAction"
              :loading="processing"
              :disabled="!originalImageTiled"
            >
              生成水印图片
            </el-button>
            <el-button @click="resetTiled">重置</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 预览和下载区域 -->
    <div v-if="watermarkedImage" class="result-section">
      <label class="section-label">3. 处理结果</label>
      <img :src="watermarkedImage" class="result-image" />
      <div class="download-buttons">
        <el-button type="success" @click="downloadImage">
          💾 下载图片
        </el-button>
        <el-button type="info" @click="copyImageUrl">
          📋 复制图片 URL
        </el-button>
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
import { onBeforeUnmount, ref } from "vue";
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
const fileInput = ref(null);
const fileInputTiled = ref(null);

// 文字水印配置
const textConfig = ref({
  text: "© 2026 Company",
  fontSize: 30,
  opacity: 0.5,
  position: "bottom-right",
  offsetX: 10,
  offsetY: 10,
});

const textColor = ref("rgba(255,255,255,0.5)");

// 平铺水印配置
const tiledConfig = ref({
  text: "Confidential",
  fontSize: 40,
  opacity: 0.2,
  angle: -45,
  spacing: 100,
});

const tiledColor = ref("rgba(150,150,150,0.3)");

// 处理图片上传
const revokeWatermarkedImage = () => {
  if (watermarkedImage.value?.startsWith("blob:")) {
    URL.revokeObjectURL(watermarkedImage.value);
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

  const reader = new FileReader();
  reader.onload = (e) => {
    targetRef.value = e.target?.result || "";
    setWatermarkedImage("");
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
const addTextWatermarkAction = async () => {
  if (!originalImage.value) {
    ElMessage.error("请先选择图片");
    return;
  }

  processing.value = true;
  showLoadingDialog.value = true;

  try {
    setWatermarkedImage(await addTextWatermark(originalImage.value, {
      text: textConfig.value.text,
      fontSize: textConfig.value.fontSize,
      opacity: textConfig.value.opacity,
      position: textConfig.value.position,
      textColor: textColor.value,
      offsetX: textConfig.value.offsetX,
      offsetY: textConfig.value.offsetY,
    }));

    ElMessage.success("水印添加成功！");
  } catch (error) {
    ElMessage.error("处理失败: " + error.message);
    console.error(error);
  } finally {
    processing.value = false;
    showLoadingDialog.value = false;
  }
};

// 添加平铺水印
const addTiledWatermarkAction = async () => {
  if (!originalImageTiled.value) {
    ElMessage.error("请先选择图片");
    return;
  }

  processing.value = true;
  showLoadingDialog.value = true;

  try {
    setWatermarkedImage(await addTiledWatermark(originalImageTiled.value, {
      text: tiledConfig.value.text,
      fontSize: tiledConfig.value.fontSize,
      opacity: tiledConfig.value.opacity,
      angle: tiledConfig.value.angle,
      spacing: tiledConfig.value.spacing,
      textColor: tiledColor.value,
    }));

    ElMessage.success("水印添加成功！");
  } catch (error) {
    ElMessage.error("处理失败: " + error.message);
    console.error(error);
  } finally {
    processing.value = false;
    showLoadingDialog.value = false;
  }
};

// 下载图片
const downloadImage = () => {
  if (!watermarkedImage.value) {
    ElMessage.error("没有可下载的图片");
    return;
  }

  const filename =
    activeTab.value === "text"
      ? `watermarked-text-${Date.now()}.png`
      : `watermarked-tiled-${Date.now()}.png`;

  downloadWatermarkedImage(watermarkedImage.value, filename);
  ElMessage.success("正在下载...");
};

// 复制图片 URL
const copyImageUrl = () => {
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
  originalImage.value = "";
  setWatermarkedImage("");
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  textConfig.value = {
    text: "© 2026 Company",
    fontSize: 30,
    opacity: 0.5,
    position: "bottom-right",
    offsetX: 10,
    offsetY: 10,
  };
  textColor.value = "rgba(255,255,255,0.5)";
};

const resetTiled = () => {
  originalImageTiled.value = "";
  setWatermarkedImage("");
  if (fileInputTiled.value) {
    fileInputTiled.value.value = "";
  }
  tiledConfig.value = {
    text: "Confidential",
    fontSize: 40,
    opacity: 0.2,
    angle: -45,
    spacing: 100,
  };
  tiledColor.value = "rgba(150,150,150,0.3)";
};

onBeforeUnmount(() => {
  revokeWatermarkedImage();
});
</script>

<style scoped lang="scss">
.watermark-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;

  .section-title {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;

    h2 {
      font-size: 28px;
      font-weight: 600;
      margin: 0;
    }
  }

  .tabs {
    margin-bottom: 20px;
  }

  .tab-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
  }

  .section-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .upload-section {
    margin-bottom: 30px;

    .upload-area {
      border: 2px dashed #409eff;
      border-radius: 6px;
      overflow: hidden;

      :deep(.el-upload-dragger) {
        border: none;
        padding: 40px 20px;

        .el-icon--upload {
          font-size: 48px;
          color: #409eff;
          margin-bottom: 10px;
        }

        .el-upload__text {
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }

  .preview-section {
    margin-bottom: 30px;

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 6px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .config-section {
    background: #f5f7fa;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;

    .config-row {
      margin-bottom: 16px;

      label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        margin-bottom: 8px;
      }

      .range-group {
        display: flex;
        align-items: center;

        .value-display {
          display: inline-block;
          min-width: 50px;
          text-align: right;
          font-weight: 500;
          color: #409eff;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;

    :deep(.el-button) {
      flex: 1;
    }
  }

  .result-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    text-align: center;

    .result-image {
      max-width: 100%;
      max-height: 600px;
      border-radius: 6px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      margin: 15px 0;
    }

    .download-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;

      :deep(.el-button) {
        min-width: 150px;
      }
    }
  }
}
</style>
