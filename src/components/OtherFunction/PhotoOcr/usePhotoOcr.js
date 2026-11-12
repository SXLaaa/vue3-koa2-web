/**
 * @Description: 批量照片识别状态与资源生命周期；逐张处理，失败可重试，离开页面释放预览。
 * @Date: 2026-11-12
 * @FilePath: /vue3-koa2-web/src/components/OtherFunction/PhotoOcr/usePhotoOcr.js
 */
import { ref, onBeforeUnmount } from "vue";
import { recognizePhoto } from "@/api/photoOcr";
export function usePhotoOcr() {
  const photos = ref([]);
  const running = ref(false);
  const notice = ref("");
  let controller;
  let stopped = false;
  let nextId = 1;
  function addFiles(files) {
    notice.value = "";
    for (const file of Array.from(files || [])) {
      if (photos.value.length >= 50) { notice.value = "每批最多50张图片"; break; }
      if (!/\.(jpe?g|png|webp)$/i.test(file.name) || !file.size || file.size > 15 * 1024 * 1024) {
        notice.value = "已跳过无效文件；支持15MB以内的JPG、PNG和WebP";
        continue;
      }
      photos.value.push({ id: nextId++, file, url: URL.createObjectURL(file), status: "待识别", result: null, error: "" });
    }
  }
  async function start() {
    if (running.value) return;
    stopped = false;
    running.value = true;
    try {
      for (const photo of photos.value) {
        if (stopped) break;
        if (photo.result) continue;
        controller = new AbortController();
        photo.status = "识别中";
        photo.error = "";
        try {
          const result = await recognizePhoto(photo.file, controller.signal);
          photo.result = result;
          photo.status = result.warnings?.length || result.ocr?.timings?.manualReviewNeeded ? "待核对" : "已识别";
        } catch (error) {
          photo.status = stopped ? "待识别" : "识别失败";
          photo.error = stopped ? "" : error?.response?.data?.msg || error?.message || String(error);
        }
      }
    } finally { running.value = false; controller = null; }
  }
  // 停止后不再上传下一张；服务端当前图片仍受独立超时和清理机制约束。
  function stop() { stopped = true; controller?.abort(); }
  function clear() {
    if (running.value) return;
    photos.value.forEach(photo => URL.revokeObjectURL(photo.url));
    photos.value = [];
  }
  function exportResults() {
    const data = photos.value.filter(photo => photo.result).map(photo => ({ filename: photo.file.name, ...photo.result }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "照片识别结果.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  onBeforeUnmount(() => { stop(); photos.value.forEach(photo => URL.revokeObjectURL(photo.url)); });
  return { photos, running, notice, addFiles, start, stop, clear, exportResults };
}
