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
 * @returns {Promise<string>} - 返回 base64 或 blob URL
 */
function parseColorAlpha(color) {
  if (typeof color !== "string") {
    return 1;
  }

  const rgbaMatch = color.match(
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)/i,
  );
  if (rgbaMatch) {
    return Number(rgbaMatch[1]);
  }

  const hexMatch = color.match(/^#([0-9a-f]{8})$/i);
  if (hexMatch) {
    return Number.parseInt(hexMatch[1].slice(6, 8), 16) / 255;
  }

  return 1;
}

function getFinalAlpha(color, opacity) {
  return Math.max(0, Math.min(1, parseColorAlpha(color) * opacity));
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
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制原始图片
      ctx.drawImage(img, 0, 0);

      // 设置水印样式
      ctx.globalAlpha = getFinalAlpha(textColor, opacity);
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "bottom";

      // 计算水印位置
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      let x, y;
      switch (position) {
        case "top-left":
          x = offsetX;
          y = textHeight + offsetY;
          break;
        case "top-right":
          x = canvas.width - textWidth - offsetX;
          y = textHeight + offsetY;
          break;
        case "bottom-left":
          x = offsetX;
          y = canvas.height - offsetY;
          break;
        case "bottom-right":
          x = canvas.width - textWidth - offsetX;
          y = canvas.height - offsetY;
          break;
        case "center":
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2;
          break;
        default:
          x = canvas.width - textWidth - offsetX;
          y = canvas.height - offsetY;
      }

      // 绘制水印
      ctx.fillText(text, x, y);

      // 返回结果
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/png");
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
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制原始图片
      ctx.drawImage(img, 0, 0);

      // 设置水印样式
      ctx.globalAlpha = getFinalAlpha(textColor, opacity);
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const textMetrics = ctx.measureText(text);
      const textWidth = Math.ceil(textMetrics.width);
      const textHeight = Math.ceil(fontSize * 1.4);
      const stepX = Math.max(textWidth + spacing, spacing);
      const stepY = Math.max(textHeight + spacing, spacing);

      // 计算对角线长度
      const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

      // 保存 canvas 状态
      ctx.save();

      // 旋转
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angle * Math.PI) / 180);

      // 平铺绘制水印
      for (let x = -diagonal; x < diagonal; x += stepX) {
        for (let y = -diagonal; y < diagonal; y += stepY) {
          ctx.fillText(text, x, y);
        }
      }

      ctx.restore();

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/png");
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
