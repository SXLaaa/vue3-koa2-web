<!--
 * @Description: 独立图片导入OCR组件，提供批量识别、原图核对、字段修正和JSON导出。
 * @Date: 2026-11-12
 * @FilePath: /vue3-koa2-web/src/components/OtherFunction/PhotoOcr/PhotoOcrImport.vue
-->
<template>
  <section class="photo-ocr">
    <h2>图片导入与文字识别</h2>
    <p>提取照片水印文字、经纬度、拍摄时间、采集人和地点。识别后请对照原图核对，结果不会自动入库。</p>
    <div class="toolbar">
      <el-button :disabled="running" @click="input.click()">选择图片</el-button>
      <el-button type="primary" :disabled="running || !photos.some(p => !p.result)" @click="start">开始识别 / 重试失败项</el-button>
      <el-button v-if="running" @click="stop">停止</el-button>
      <el-button :disabled="running || !photos.some(p => p.result)" @click="exportResults">导出结果</el-button>
      <el-button :disabled="running || !photos.length" @click="clear">清空</el-button>
      <span>{{ photos.filter(p => p.result).length }} / {{ photos.length }} 张已处理</span>
      <input ref="input" type="file" accept=".jpg,.jpeg,.png,.webp" multiple hidden @change="selectFiles" />
    </div>
    <p v-if="notice" role="alert">{{ notice }}</p>
    <div v-if="!photos.length" class="empty" @dragover.prevent @drop.prevent="dropFiles">
      拖入照片，或点击“选择图片”（最多50张，单张不超过15MB）
    </div>
    <article v-for="photo in photos" :key="photo.id" class="photo-card">
      <div class="preview"><a :href="photo.url" target="_blank" rel="noopener"><img :src="photo.url" :alt="photo.file.name" loading="lazy" /></a><strong>{{ photo.file.name }}</strong><p>{{ photo.status }}</p></div>
      <div class="result">
        <p v-if="photo.error" role="alert" class="warning">{{ photo.error }}</p>
        <template v-if="photo.result">
          <div class="fields">
            <label>经度<el-input v-model="photo.result.longitude" /></label>
            <label>纬度<el-input v-model="photo.result.latitude" /></label>
            <label>拍摄时间<el-input v-model="photo.result.capturedAt" placeholder="未识别到时间" /></label>
            <label>拍摄日期<el-input v-model="photo.result.capturedDate" /></label>
            <label>采集人<el-input v-model="photo.result.originalCollectorName" /></label>
            <label>地点<el-input v-model="photo.result.address" /></label>
          </div>
          <p class="source">原始坐标来源：{{ photo.result.coordinateSource || '未识别' }}；时间来源：{{ photo.result.timeSource || '未识别' }}。手工修改仅影响本次导出，请核对格式。</p>
          <p v-for="warning in photo.result.warnings" :key="warning" class="warning">{{ warning }}</p>
          <label>识别原文<el-input :model-value="photo.result.ocr?.text || ''" type="textarea" :rows="4" readonly /></label>
        </template>
      </div>
    </article>
  </section>
</template>
<script setup>
import { ref } from "vue";
import { usePhotoOcr } from "./usePhotoOcr";
const input = ref(null);
const { photos, running, notice, addFiles, start, stop, clear, exportResults } = usePhotoOcr();
function selectFiles(event) { addFiles(event.target.files); event.target.value = ""; }
function dropFiles(event) { if (!running.value) addFiles(event.dataTransfer.files); }
</script>
<style scoped>
.photo-ocr { padding: 24px; color: #263449; }
.photo-ocr h2 { margin-top: 0; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 20px 0; }
.empty { padding: 70px 20px; text-align: center; border: 2px dashed #bdcbdc; border-radius: 10px; }
.photo-card { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 24px; padding: 20px; margin-top: 20px; border: 1px solid #dce4ee; border-radius: 10px; }
.preview img { width: 100%; height: 220px; object-fit: contain; background: #f3f6fa; }
.preview strong { display: block; overflow-wrap: anywhere; }
.fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.fields label { line-height: 2; }
.warning { color: #9d4b0b; overflow-wrap: anywhere; }
.source { color: #65758a; font-size: 13px; }
@media (max-width: 760px) { .photo-card, .fields { grid-template-columns: 1fr; } .photo-ocr { padding: 12px; } }
</style>
