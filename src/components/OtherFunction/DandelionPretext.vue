<template>
  <div class="dandelion-page">
    <canvas ref="sceneCanvas" class="scene-canvas"></canvas>
    <div class="scene-glow scene-glow-left"></div>
    <div class="scene-glow scene-glow-right"></div>

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">OtherFunction / Pretext</p>
        <h1>动态蒲公英页面</h1>
        <p class="intro">
          文字的停顿、风的方向、绒羽的离散速度，都在同一块画布里被重新编排。
        </p>

        <div ref="copyCard" class="copy-card">
          <p
            v-for="(line, index) in textLines"
            :key="`${index}-${line.text}`"
            class="copy-line"
            :style="{ width: `${Math.ceil(line.width)}px` }"
          >
            {{ line.text }}
          </p>
        </div>

        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">排版宽度</span>
            <span class="stat-value">{{ textWidth }}px</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">分行数量</span>
            <span class="stat-value">{{ textLines.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">漂浮绒羽</span>
            <span class="stat-value">{{ driftingSeeds.length }}</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="seed-cloud">
          <span
            v-for="seed in floatingLabels"
            :key="seed.id"
            class="seed-label"
            :style="seed.style"
          >
            {{ seed.text }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";

const COPY_TEXT =
  "蒲公英会把一段完整的话拆成许多更轻的部分，再顺着气流缓慢扩散。这个页面使用 pretext 预计算文本分行，让文案宽度、视觉层标签和飘散节奏保持同步。";

export default {
  name: "DandelionPretext",
  data() {
    return {
      preparedText: null,
      textLines: [],
      textWidth: 0,
      lineHeight: 30,
      resizeObserver: null,
      animationId: 0,
      canvasContext: null,
      canvasSize: {
        width: 0,
        height: 0,
        dpr: 1,
      },
      driftingSeeds: [],
      floatingLabels: [],
      lastTimestamp: 0,
    };
  },
  mounted() {
    this.preparedText = prepareWithSegments(
      COPY_TEXT,
      '600 18px "Georgia"'
    );
    this.refreshTextLayout();
    this.buildDriftingSeeds();
    this.setupResizeObserver();
    this.setupCanvas();
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },
  methods: {
    setupResizeObserver() {
      this.resizeObserver = new ResizeObserver(() => {
        this.refreshTextLayout();
        this.setupCanvas();
      });

      if (this.$refs.copyCard) {
        this.resizeObserver.observe(this.$refs.copyCard);
      }
      if (this.$el) {
        this.resizeObserver.observe(this.$el);
      }
    },
    refreshTextLayout() {
      this.$nextTick(() => {
        if (!this.$refs.copyCard || !this.preparedText) {
          return;
        }

        const availableWidth = Math.max(
          240,
          Math.floor(this.$refs.copyCard.clientWidth - 44)
        );
        const result = layoutWithLines(
          this.preparedText,
          availableWidth,
          this.lineHeight
        );

        this.textWidth = availableWidth;
        this.textLines = result.lines;
        this.buildFloatingLabels();
      });
    },
    buildFloatingLabels() {
      const baseLines = this.textLines.length
        ? this.textLines
        : [{ text: "风会继续前进", width: 120 }];

      this.floatingLabels = baseLines.map((line, index) => {
        const duration = 10 + index * 1.5;
        const delay = Number((index * 0.8).toFixed(2));
        const top = 10 + (index % 5) * 14;
        const left = 8 + index * 8;

        return {
          id: `${index}-${line.text}`,
          text: line.text,
          style: {
            top: `${top}%`,
            left: `${left}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            maxWidth: `${Math.max(120, Math.ceil(line.width) + 28)}px`,
          },
        };
      });
    },
    buildDriftingSeeds() {
      this.driftingSeeds = Array.from({ length: 42 }, (_, index) => {
        const speed = 18 + Math.random() * 24;
        const angle = -Math.PI / 4 + Math.random() * (Math.PI / 2.4);
        const radius = 36 + Math.random() * 24;
        const swing = Math.random() * Math.PI * 2;

        return {
          id: index,
          speed,
          angle,
          radius,
          swing,
          scale: 0.6 + Math.random() * 0.8,
          width: 26 + Math.random() * 16,
          opacity: 0.3 + Math.random() * 0.5,
        };
      });
    },
    setupCanvas() {
      this.$nextTick(() => {
        const canvas = this.$refs.sceneCanvas;
        if (!canvas || !this.$el) {
          return;
        }

        const rect = this.$el.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(320, Math.floor(rect.width));
        const height = Math.max(560, Math.floor(rect.height));

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        this.canvasContext = canvas.getContext("2d");
        this.canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.canvasSize = { width, height, dpr };

        if (!this.animationId) {
          this.lastTimestamp = performance.now();
          this.animationId = requestAnimationFrame(this.animateScene);
        }
      });
    },
    animateScene(timestamp) {
      const delta = Math.min(0.032, (timestamp - this.lastTimestamp) / 1000 || 0);
      this.lastTimestamp = timestamp;
      this.drawScene(timestamp, delta);
      this.animationId = requestAnimationFrame(this.animateScene);
    },
    drawScene(timestamp, delta) {
      if (!this.canvasContext) {
        return;
      }

      const { width, height } = this.canvasSize;
      const ctx = this.canvasContext;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(9, 25, 33, 0.95)");
      gradient.addColorStop(0.55, "rgba(14, 44, 55, 0.88)");
      gradient.addColorStop(1, "rgba(27, 77, 68, 0.72)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      this.drawMist(timestamp);
      this.drawDandelionBase();
      this.drawDriftingSeeds(timestamp, delta);
    },
    drawMist(timestamp) {
      const { width, height } = this.canvasSize;
      const ctx = this.canvasContext;
      const pulse = Math.sin(timestamp / 2200) * 0.08 + 0.18;

      ctx.save();
      ctx.fillStyle = `rgba(226, 243, 226, ${pulse})`;
      ctx.beginPath();
      ctx.arc(width * 0.7, height * 0.2, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(158, 216, 194, 0.12)";
      ctx.beginPath();
      ctx.arc(width * 0.16, height * 0.82, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    drawDandelionBase() {
      const { width, height } = this.canvasSize;
      const ctx = this.canvasContext;
      const rootX = width * 0.24;
      const rootY = height * 0.78;
      const headX = width * 0.34;
      const headY = height * 0.48;

      ctx.save();
      ctx.strokeStyle = "rgba(171, 224, 187, 0.75)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(width * 0.28, height * 0.62, headX, headY);
      ctx.stroke();

      ctx.strokeStyle = "rgba(229, 241, 232, 0.78)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 34; i++) {
        const angle = (Math.PI * 2 * i) / 34 - Math.PI / 2.4;
        const length = 36 + (i % 5) * 5;
        const endX = headX + Math.cos(angle) * length;
        const endY = headY + Math.sin(angle) * length;

        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        this.drawSeedFluff(endX, endY, angle, 0.78);
      }

      ctx.fillStyle = "rgba(241, 248, 243, 0.95)";
      ctx.beginPath();
      ctx.arc(headX, headY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    drawDriftingSeeds(timestamp, delta) {
      const { width, height } = this.canvasSize;
      const originX = width * 0.34;
      const originY = height * 0.48;
      const driftX = width * 0.48;
      const driftY = height * 0.08;

      this.driftingSeeds.forEach((seed) => {
        seed.radius += seed.speed * delta;
        if (seed.radius > driftX) {
          seed.radius = 28 + Math.random() * 24;
        }

        const sway = Math.sin(timestamp / 800 + seed.swing) * 18;
        const x = originX + Math.cos(seed.angle) * seed.radius + sway;
        const y =
          originY +
          Math.sin(seed.angle) * (seed.radius * 0.58) -
          seed.radius * 0.16 +
          Math.cos(timestamp / 1100 + seed.swing) * 12;

        if (x > width + 40 || y < -60 || y > height + 60) {
          seed.radius = 24 + Math.random() * 20;
        }

        const alpha = Math.max(0.16, seed.opacity - seed.radius / (driftY + 380));
        this.drawSeedFluff(x, y, seed.angle - 0.3, alpha, seed.scale, seed.width);
      });
    },
    drawSeedFluff(x, y, angle, alpha, scale = 1, stemWidth = 28) {
      const ctx = this.canvasContext;
      const stemLength = stemWidth * scale;
      const fluffRadius = 10 * scale;
      const stemX = x - Math.cos(angle) * stemLength;
      const stemY = y - Math.sin(angle) * stemLength;

      ctx.save();
      ctx.strokeStyle = `rgba(241, 248, 243, ${alpha})`;
      ctx.fillStyle = `rgba(244, 250, 245, ${alpha + 0.08})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(stemX, stemY);
      ctx.lineTo(x, y);
      ctx.stroke();

      for (let i = 0; i < 7; i++) {
        const branchAngle = angle - 1.55 + i * 0.22;
        const branchX = x + Math.cos(branchAngle) * fluffRadius;
        const branchY = y + Math.sin(branchAngle) * fluffRadius;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(branchX, branchY);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(stemX, stemY, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
};
</script>

<style scoped lang="scss">
.dandelion-page {
  position: relative;
  min-height: calc(100vh - 90px);
  overflow: hidden;
  padding: 40px;
  background:
    radial-gradient(circle at 20% 20%, rgba(218, 239, 228, 0.12), transparent 34%),
    linear-gradient(135deg, #07161b 0%, #0f313d 46%, #1d5b4f 100%);
  color: #f4fbf6;
}

.scene-canvas,
.scene-glow {
  position: absolute;
  inset: 0;
}

.scene-canvas {
  z-index: 0;
}

.scene-glow {
  pointer-events: none;
  filter: blur(40px);
  opacity: 0.7;
}

.scene-glow-left {
  background: radial-gradient(circle, rgba(236, 250, 224, 0.26), transparent 60%);
  transform: translate(-24%, 56%);
}

.scene-glow-right {
  background: radial-gradient(circle, rgba(129, 208, 180, 0.22), transparent 60%);
  transform: translate(42%, -18%);
}

.hero {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(300px, 520px) 1fr;
  align-items: center;
  gap: 32px;
  min-height: calc(100vh - 170px);
}

.eyebrow {
  margin: 0 0 12px;
  color: rgba(218, 241, 222, 0.74);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.02;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.intro {
  max-width: 520px;
  margin: 18px 0 28px;
  font-size: 18px;
  line-height: 1.8;
  color: rgba(238, 249, 240, 0.88);
}

.copy-card {
  width: min(100%, 520px);
  padding: 22px;
  border: 1px solid rgba(231, 247, 232, 0.16);
  border-radius: 28px;
  background: rgba(6, 19, 24, 0.34);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 90px rgba(2, 10, 12, 0.32);
}

.copy-line {
  margin: 0 0 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(238, 247, 241, 0.16), rgba(152, 211, 186, 0.08));
  color: #f7fff8;
  font: 600 18px/30px "Georgia", serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-line:last-child {
  margin-bottom: 0;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.stat-item {
  min-width: 120px;
  padding: 12px 16px;
  border-radius: 18px;
  background: rgba(244, 252, 245, 0.08);
  border: 1px solid rgba(244, 252, 245, 0.12);
}

.stat-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: rgba(218, 241, 222, 0.68);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.hero-visual {
  position: relative;
  min-height: 520px;
}

.seed-cloud {
  position: absolute;
  inset: 0;
}

.seed-label {
  position: absolute;
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(244, 252, 245, 0.08);
  border: 1px solid rgba(244, 252, 245, 0.16);
  box-shadow: 0 18px 50px rgba(4, 18, 21, 0.24);
  color: rgba(248, 253, 249, 0.92);
  font: 600 14px/1.4 "Georgia", serif;
  animation-name: floatSeedLabel;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes floatSeedLabel {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-4deg);
    opacity: 0.38;
  }

  35% {
    transform: translate3d(26px, -18px, 0) rotate(2deg);
    opacity: 0.84;
  }

  70% {
    transform: translate3d(74px, -46px, 0) rotate(6deg);
    opacity: 0.68;
  }
}

@media (max-width: 960px) {
  .dandelion-page {
    padding: 24px;
  }

  .hero {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .hero-visual {
    min-height: 360px;
  }

  .seed-label {
    font-size: 13px;
  }
}

@media (max-width: 640px) {
  .dandelion-page {
    min-height: calc(100vh - 70px);
    padding: 18px;
  }

  .copy-card {
    padding: 18px;
    border-radius: 22px;
  }

  .copy-line {
    font-size: 16px;
  }

  .stats {
    gap: 10px;
  }

  .stat-item {
    flex: 1 1 calc(50% - 10px);
    min-width: 0;
  }
}
</style>
