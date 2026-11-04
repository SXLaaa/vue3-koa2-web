/**
 * 图片加水印工具函数
 * 支持文字水印、图片水印等功能
 */

/**
 * 添加文字水印到图片
 * @param {string} imageSrc - 图片源（URL 或 路径）
 * @param {object} options - 配置选项
 * @param {string} options.text - 水印文字
 * @param {string} options.textColor - 文字颜色，默认 'rgba(255,255,255,0.5)'
 * @param {number} options.fontSize - 字体大小，默认 20
 * @param {string} options.fontFamily - 字体类型，默认 'Arial'
 * @param {number} options.opacity - 透明度，默认 0.5（0-1）
 * @param {string} options.position - 位置，默认 'bottom-right'（top-left, top-right, bottom-left, bottom-right, center）
 * @param {number} options.offsetX - X轴偏移，默认 10
 * @param {number} options.offsetY - Y轴偏移，默认 10
 * @param {string} options.sizeMode - pixel（兼容旧参数）或 relative（按最终图片短边计算）
 * @param {number} options.fontSizeRatio - 相对字号，默认 0.08
 * @param {number} options.marginXRatio - 相对水平边距，默认 0.025
 * @param {number} options.marginYRatio - 相对垂直边距，默认 0.025
 * @param {boolean} options.outline - 白色描边，默认 false
 * @param {boolean} options.shadow - 轻阴影，默认 false
 * @param {boolean} options.background - 半透明底色，默认 false
 * @param {string} options.mimeType - image/png、image/jpeg 或 image/webp，默认 image/png
 * @param {number} options.quality - 编码质量，默认 0.92
 * @param {number} options.maxSize - 最长边限制，0 保留原尺寸，默认 0
 * @returns {Promise<string>} - 返回 blob URL
 */
function watermarkNumber(value, fallback, min = 0, max = Infinity) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
}

function createWatermarkCanvas(img, options) {
  const mimeType = options.mimeType ?? "image/png";
  if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
    throw new Error("Unsupported image encoding format");
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) throw new Error("Failed to decode image dimensions");
  const maxSize = watermarkNumber(options.maxSize, 0);
  const scale = maxSize > 0 ? Math.min(1, Math.max(1, maxSize) / Math.max(width, height)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  // JPEG 不支持透明，先铺白底，避免透明区域被编码为黑色。
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx, mimeType };
}

function measureWatermark(ctx, text, fontSize, fontFamily, options, maxWidth, maxHeight) {
  let size = Math.max(0.01, fontSize);
  for (let attempt = 0; attempt < 6; attempt++) {
    ctx.font = `${size}px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const metrics = ctx.measureText(text);
    const left = metrics.actualBoundingBoxLeft || 0;
    const textWidth = Math.max(0, left + (metrics.actualBoundingBoxRight ?? metrics.width));
    const ascent = metrics.actualBoundingBoxAscent ?? size;
    const textHeight = Math.max(ascent + (metrics.actualBoundingBoxDescent || 0), size * 0.01);
    const lineWidth = options.outline ? size * 0.06 : 0;
    const padding = Math.max(options.background ? size * 0.2 : 0, lineWidth / 2 + (options.shadow ? size * 0.28 : 0));
    const width = textWidth + padding * 2;
    const height = textHeight + padding * 2;
    const scale = Math.min(1, maxWidth / Math.max(width, 0.01), maxHeight / Math.max(height, 0.01));
    if (scale >= 1) return { fontSize: size, left, ascent, textWidth, textHeight, padding, width, height, lineWidth };
    size *= scale * 0.99;
  }
  throw new Error("Watermark text cannot fit within image bounds");
}

function drawWatermarkText(ctx, text, x, y, layout, options, textColor) {
  const { fontSize, padding, left, ascent, textWidth, textHeight, lineWidth } = layout;
  if (options.background) {
    const inset = fontSize * 0.2;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + padding - inset, y + padding - inset, textWidth + inset * 2, textHeight + inset * 2);
  }
  ctx.save();
  if (options.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = fontSize * 0.12;
    ctx.shadowOffsetY = fontSize * 0.04;
  }
  const textX = x + padding + left;
  const textY = y + padding + ascent;
  if (options.outline) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.strokeText(text, textX, textY);
  }
  ctx.fillStyle = textColor;
  ctx.fillText(text, textX, textY);
  ctx.restore();
}

function exportWatermark(canvas, mimeType, options, resolve, reject) {
  canvas.toBlob((blob) => {
    try {
      if (!blob) throw new Error("Failed to encode image blob");
      if (blob.type !== mimeType) throw new Error(`Image encoding format is not supported: ${mimeType}`);
      resolve(URL.createObjectURL(blob));
    } catch (error) {
      reject(error);
    }
  }, mimeType, watermarkNumber(options.quality, 0.92, 0, 1));
}

export function addTextWatermark(imageSrc, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      text = "Watermark",
      textColor = "rgba(255,255,255,0.5)",
      fontSize = 20,
      fontFamily = "Arial",
      opacity = 0.5,
      position = "bottom-right",
      offsetX = 10,
      offsetY = 10,
    } = options;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const { canvas, ctx, mimeType } = createWatermarkCanvas(img, options);
        const shortSide = Math.min(canvas.width, canvas.height);
        const relative = options.sizeMode === "relative";
        const marginX = Math.min(relative ? shortSide * watermarkNumber(options.marginXRatio, 0.025) : watermarkNumber(offsetX, 10), (canvas.width - 1) / 2);
        const marginY = Math.min(relative ? shortSide * watermarkNumber(options.marginYRatio, 0.025) : watermarkNumber(offsetY, 10), (canvas.height - 1) / 2);
        const size = relative ? shortSide * watermarkNumber(options.fontSizeRatio, 0.08) : watermarkNumber(fontSize, 20);
        const label = String(text);
        const layout = measureWatermark(ctx, label, size, fontFamily, options, canvas.width - marginX * 2, canvas.height - marginY * 2);

        // 颜色本身的 alpha 由 Canvas 处理，globalAlpha 只应用一次透明度。
        ctx.globalAlpha = watermarkNumber(opacity, 0.5, 0, 1);
        let x, y;
        switch (position) {
          case "top-left":
            x = marginX;
            y = marginY;
            break;
          case "top-right":
            x = canvas.width - layout.width - marginX;
            y = marginY;
            break;
          case "bottom-left":
            x = marginX;
            y = canvas.height - layout.height - marginY;
            break;
          case "center":
            x = (canvas.width - layout.width) / 2;
            y = (canvas.height - layout.height) / 2;
            break;
          default:
            x = canvas.width - layout.width - marginX;
            y = canvas.height - layout.height - marginY;
        }
        if (label) drawWatermarkText(ctx, label, x, y, layout, options, textColor);
        exportWatermark(canvas, mimeType, options, resolve, reject);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageSrc;
  });
}

/**
 * 添加平铺文字水印（多行重复）
 * @param {string} imageSrc - 图片源
 * @param {object} options - 配置选项
 * @param {string} options.text - 水印文字
 * @param {string} options.textColor - 文字颜色
 * @param {number} options.fontSize - 字体大小
 * @param {number} options.opacity - 透明度
 * @param {number} options.angle - 旋转角度（度数），默认 -45
 * @param {number} options.spacing - 水印间距，默认 80
 * @param {number} options.spacingRatio - 相对间距（最终图片短边比例），默认 0.15
 * @param {string} options.sizeMode - pixel 或 relative，输出及效果选项与文字水印相同
 * @returns {Promise<string>}
 */
export function addTiledWatermark(imageSrc, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      text = "Watermark",
      textColor = "rgba(150,150,150,0.3)",
      fontSize = 30,
      opacity = 0.3,
      angle = -45,
      spacing = 80,
      fontFamily = "Arial",
    } = options;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const { canvas, ctx, mimeType } = createWatermarkCanvas(img, options);
        const shortSide = Math.min(canvas.width, canvas.height);
        const relative = options.sizeMode === "relative";
        const size = relative ? shortSide * watermarkNumber(options.fontSizeRatio, 0.08) : watermarkNumber(fontSize, 30);
        const gap = relative ? shortSide * watermarkNumber(options.spacingRatio, 0.15) : watermarkNumber(spacing, 80);
        const label = String(text);
        const layout = measureWatermark(ctx, label, size, fontFamily, options, canvas.width, canvas.height);
        ctx.globalAlpha = watermarkNumber(opacity, 0.3, 0, 1);
        let stepX = Math.max(layout.width + gap, 1);
        let stepY = Math.max((relative ? layout.height : Math.max(layout.height, Math.ceil(layout.fontSize * 1.4))) + gap, 1);
        const radians = (watermarkNumber(angle, -45, -360, 360) * Math.PI) / 180;
        const extentX = (Math.abs(canvas.width * Math.cos(radians)) + Math.abs(canvas.height * Math.sin(radians))) / 2;
        const extentY = (Math.abs(canvas.width * Math.sin(radians)) + Math.abs(canvas.height * Math.cos(radians))) / 2;

        // 极小字号/间距也限制绘制次数，避免平铺阻塞页面。
        while (Math.ceil((extentX * 2) / stepX) * Math.ceil((extentY * 2) / stepY) > 4096) {
          stepX *= 1.2;
          stepY *= 1.2;
        }
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        if (label) {
          for (let x = -extentX; x < extentX; x += stepX) {
            for (let y = -extentY; y < extentY; y += stepY) {
              drawWatermarkText(ctx, label, x, y, layout, options, textColor);
            }
          }
        }
        ctx.restore();
        exportWatermark(canvas, mimeType, options, resolve, reject);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageSrc;
  });
}

/**
 * 添加图片水印
 * @param {string} imageSrc - 主图片源
 * @param {string} watermarkSrc - 水印图片源
 * @param {object} options - 配置选项
 * @param {number} options.opacity - 水印透明度
 * @param {string} options.position - 位置
 * @param {number} options.scale - 水印缩放比例（相对于主图）
 * @returns {Promise<string>}
 */
export function addImageWatermark(imageSrc, watermarkSrc, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      opacity = 0.5,
      position = "bottom-right",
      scale = 0.2,
      offsetX = 10,
      offsetY = 10,
    } = options;

    let loadedImages = 0;
    const img = new Image();
    const watermark = new Image();

    img.crossOrigin = "anonymous";
    watermark.crossOrigin = "anonymous";

    const checkBothLoaded = () => {
      loadedImages++;
      if (loadedImages === 2) {
        processImages();
      }
    };

    const processImages = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制原始图片
      ctx.drawImage(img, 0, 0);

      // 计算水印大小
      const watermarkWidth = img.width * scale;
      const watermarkHeight =
        (watermark.height / watermark.width) * watermarkWidth;

      // 计算位置
      let x, y;
      switch (position) {
        case "top-left":
          x = offsetX;
          y = offsetY;
          break;
        case "top-right":
          x = canvas.width - watermarkWidth - offsetX;
          y = offsetY;
          break;
        case "bottom-left":
          x = offsetX;
          y = canvas.height - watermarkHeight - offsetY;
          break;
        case "bottom-right":
          x = canvas.width - watermarkWidth - offsetX;
          y = canvas.height - watermarkHeight - offsetY;
          break;
        case "center":
          x = (canvas.width - watermarkWidth) / 2;
          y = (canvas.height - watermarkHeight) / 2;
          break;
        default:
          x = canvas.width - watermarkWidth - offsetX;
          y = canvas.height - watermarkHeight - offsetY;
      }

      // 绘制水印
      ctx.globalAlpha = opacity;
      ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/png");
    };

    img.onload = checkBothLoaded;
    img.onerror = () => reject(new Error("Failed to load main image"));
    img.src = imageSrc;

    watermark.onload = checkBothLoaded;
    watermark.onerror = () =>
      reject(new Error("Failed to load watermark image"));
    watermark.src = watermarkSrc;
  });
}

/**
 * 下载带水印的图片
 * @param {string} imageUrl - 图片 URL（src 或 blob URL）
 * @param {string} filename - 文件名
 */
export function downloadWatermarkedImage(
  imageUrl,
  filename = "watermarked-image.png",
) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 设置图片尺寸（可选的预处理）
 * @param {string} imageSrc - 图片源
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<string>}
 */
export function resizeImage(imageSrc, maxWidth = 1920, maxHeight = 1080) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // 按比例缩小
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/png");
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}
