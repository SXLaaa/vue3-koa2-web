/**
 * @Description: 图片OCR接口适配；复用现有鉴权，仅本接口延长识别超时。
 * @Date: 2026-11-12
 * @FilePath: /vue3-koa2-web/src/api/photoOcr.js
 */
import request from "../utils/request";
export function recognizePhoto(file, signal) {
  return request({
    url: "/photo-ocr/recognize", method: "post", data: file, mock: false,
    timeout: 130000, signal,
    headers: { "Content-Type": "application/octet-stream", "X-Photo-Name": encodeURIComponent(file.name) },
  });
}
