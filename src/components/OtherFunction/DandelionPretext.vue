<template>
  <div
    class="dandelion-page"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleCanvasClick"
  >
    <canvas ref="sceneCanvas" class="scene-canvas"></canvas>
    <div class="scene-glow scene-glow-left"></div>
    <div class="scene-glow scene-glow-right"></div>
    <div class="scene-glow scene-glow-flower"></div>

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
            <span class="line-dot"></span>
            <span class="line-text">{{ line.text }}</span>
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
          <div
            class="stat-item stat-wind"
            @click.stop="triggerBurst"
            title="点击唤起一阵微风"
          >
            <span class="stat-label">实时风感</span>
            <span class="stat-value wind-val">{{ windStatusText }}</span>
          </div>
        </div>

        <p class="interaction-tip">
          <span class="tip-icon">✦</span> 轻晃鼠标或轻触画面，随风吹散漫天绒羽
        </p>
      </div>

      <div class="hero-visual">
        <div class="seed-cloud">
          <span
            v-for="seed in floatingLabels"
            :key="seed.id"
            class="seed-label"
            :style="seed.style"
          >
            <svg
              class="seed-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 21V10M12 10L6 4.5M12 10L18 4.5M12 10L9 3M12 10L15 3M12 10L4 7.5M12 10L20 7.5"
                stroke-width="1.6"
                stroke-linecap="round"
              />
              <circle cx="12" cy="21" r="1.5" fill="currentColor" />
            </svg>
            <span class="seed-text">{{ seed.text }}</span>
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
      resizeRafId: 0,
      animationId: 0,
      canvasContext: null,
      canvasSize: {
        width: 0,
        height: 0,
        dpr: 1,
      },
      bgGradient: null,
      driftingSeeds: [],
      ambientSpores: [],
      shockwaves: [],
      floatingLabels: [],
      lastTimestamp: 0,
      wind: {
        baseX: 38,
        baseY: -8,
        currentX: 38,
        currentY: -8,
        gust: 0,
      },
      mouse: {
        x: -999,
        y: -999,
        lastX: -999,
        lastY: -999,
        vx: 0,
        vy: 0,
        active: false,
      },
      stem: {
        rootX: 0,
        rootY: 0,
        headX: 0,
        headY: 0,
        restHeadX: 0,
        restHeadY: 0,
        ctrlX: 0,
        ctrlY: 0,
        reactionX: 0,
        reactionY: 0,
      },
      florets: [],
      windStatusText: "微风拂面 🍃",
      windStatusTimer: null,
    };
  },
  mounted() {
    this.preparedText = prepareWithSegments(
      COPY_TEXT,
      '600 18px "Georgia"'
    );
    this.refreshTextLayout();
    this.buildFlorets();
    this.buildDriftingSeeds();
    this.buildAmbientSpores();
    this.setupCanvas();
    this.setupResizeObserver();
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.resizeRafId) {
      cancelAnimationFrame(this.resizeRafId);
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.windStatusTimer) {
      clearTimeout(this.windStatusTimer);
    }
  },
  methods: {
    setupResizeObserver() {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.resizeRafId) {
          cancelAnimationFrame(this.resizeRafId);
        }
        this.resizeRafId = requestAnimationFrame(() => {
          this.refreshTextLayout();
          this.setupCanvas();
        });
      });

      if (this.$refs.copyCard) {
        this.resizeObserver.observe(this.$refs.copyCard);
      }
      if (this.$el) {
        this.resizeObserver.observe(this.$el);
      }
    },
    refreshTextLayout() {
      if (!this.$refs.copyCard || !this.preparedText) {
        return;
      }

      const availableWidth = Math.max(
        240,
        Math.floor(this.$refs.copyCard.clientWidth - 44)
      );

      if (availableWidth === this.textWidth && this.textLines.length > 0) {
        return;
      }

      const result = layoutWithLines(
        this.preparedText,
        availableWidth,
        this.lineHeight
      );

      this.textWidth = availableWidth;
      this.textLines = result.lines;
      this.buildFloatingLabels();
    },
    buildFloatingLabels() {
      const baseLines = this.textLines.length
        ? this.textLines
        : [{ text: "风会继续前进", width: 120 }];

      this.floatingLabels = baseLines.map((line, index) => {
        const duration = 9 + (index % 4) * 2.2;
        const delay = Number((index * 0.75).toFixed(2));
        const top = 10 + (index % 5) * 16 + (index % 2 === 0 ? 0 : 3);
        const left = 6 + (index % 4) * 18 + (index * 4) % 15;

        return {
          id: `${index}-${line.text}`,
          text: line.text,
          style: {
            top: `${top}%`,
            left: `${left}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            maxWidth: `${Math.max(140, Math.ceil(line.width) + 48)}px`,
          },
        };
      });
    },
    buildFlorets() {
      const count = 38;
      this.florets = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2.3;
        const length = 34 + (i % 6) * 4.2 + (i % 3) * 2;
        const phase = (i * 1.37) % (Math.PI * 2);
        return {
          baseAngle: angle,
          length,
          phase,
          fluffRadius: 9 + (i % 4) * 1.4,
          rayCount: 8 + (i % 3),
        };
      });
    },
    buildDriftingSeeds() {
      const total = 46;
      this.driftingSeeds = Array.from({ length: total }, (_, index) => {
        const depth = 0.5 + Math.random() * 0.75;
        const scale = 0.55 + depth * 0.7;
        const speed = (22 + Math.random() * 26) * depth;

        return {
          id: index,
          x: Math.random() * 1200,
          y: Math.random() * 800,
          vx: speed,
          vy: -6 - Math.random() * 10,
          speed,
          depth,
          scale,
          opacity: 0.25 + depth * 0.55,
          angle: -0.3 + Math.random() * 0.5,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 1.8 + Math.random() * 1.4,
          stemLength: 22 + Math.random() * 10,
          fluffRadius: 8 + Math.random() * 4,
          rayCount: 8 + (index % 3),
          isBurst: false,
        };
      });
    },
    buildAmbientSpores() {
      this.ambientSpores = Array.from({ length: 32 }, (_, i) => {
        return {
          id: i,
          x: Math.random() * 1200,
          y: Math.random() * 800,
          radius: 1 + Math.random() * 2,
          vx: 12 + Math.random() * 14,
          vy: -4 - Math.random() * 6,
          alpha: 0.15 + Math.random() * 0.45,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 1.2 + Math.random() * 1.5,
        };
      });
    },
    setupCanvas() {
      const canvas = this.$refs.sceneCanvas;
      if (!canvas || !this.$el) {
        return;
      }

      const rect = this.$el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(560, Math.floor(rect.height));

      if (
        this.canvasSize.width === width &&
        this.canvasSize.height === height &&
        this.canvasSize.dpr === dpr
      ) {
        return;
      }

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      this.canvasContext = canvas.getContext("2d");
      this.canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.canvasSize = { width, height, dpr };

      this.bgGradient = this.canvasContext.createLinearGradient(0, 0, width, height);
      this.bgGradient.addColorStop(0, "rgba(7, 22, 27, 0.96)");
      this.bgGradient.addColorStop(0.5, "rgba(13, 41, 51, 0.9)");
      this.bgGradient.addColorStop(1, "rgba(22, 69, 61, 0.78)");

      this.initStemPositions(width, height);

      if (!this.animationId) {
        this.lastTimestamp = 0;
        this.animationId = requestAnimationFrame(this.animateScene);
      }
    },
    initStemPositions(width, height) {
      const rootX = width * 0.22;
      const rootY = height * 0.82;
      const restHeadX = width * 0.33;
      const restHeadY = height * 0.5;

      this.stem.rootX = rootX;
      this.stem.rootY = rootY;
      this.stem.restHeadX = restHeadX;
      this.stem.restHeadY = restHeadY;
      this.stem.headX = restHeadX;
      this.stem.headY = restHeadY;
      this.stem.ctrlX = rootX + (restHeadX - rootX) * 0.45;
      this.stem.ctrlY = rootY - (rootY - restHeadY) * 0.55;

      this.driftingSeeds.forEach((seed) => {
        if (seed.x > width || seed.y > height) {
          seed.x = restHeadX + Math.random() * (width - restHeadX);
          seed.y = Math.random() * height;
        }
      });
    },
    handleMouseMove(e) {
      const rect = this.$el.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (this.mouse.active) {
        this.mouse.vx = (currentX - this.mouse.lastX) * 1.2;
        this.mouse.vy = (currentY - this.mouse.lastY) * 1.2;
      }

      this.mouse.lastX = currentX;
      this.mouse.lastY = currentY;
      this.mouse.x = currentX;
      this.mouse.y = currentY;
      this.mouse.active = true;

      const speed = Math.hypot(this.mouse.vx, this.mouse.vy);
      if (speed > 45 && this.windStatusText !== "清风拂动 🍃") {
        this.setWindStatus("清风拂动 🍃", 1400);
      }
    },
    handleMouseLeave() {
      this.mouse.active = false;
      this.mouse.vx = 0;
      this.mouse.vy = 0;
    },
    handleCanvasClick(e) {
      const rect = this.$el.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      this.createShockwave(clickX, clickY);
      this.burstSeedsFromHead(14);
      this.setWindStatus("微风吹散绒羽 ✨", 2200);
    },
    triggerBurst() {
      this.createShockwave(this.stem.headX, this.stem.headY);
      this.burstSeedsFromHead(18);
      this.setWindStatus("微风吹散绒羽 ✨", 2200);
    },
    setWindStatus(text, duration = 2000) {
      this.windStatusText = text;
      if (this.windStatusTimer) {
        clearTimeout(this.windStatusTimer);
      }
      this.windStatusTimer = setTimeout(() => {
        this.windStatusText = "微风拂面 🍃";
      }, duration);
    },
    createShockwave(x, y) {
      this.shockwaves.push({
        x,
        y,
        radius: 12,
        maxRadius: 180,
        alpha: 0.65,
        speed: 260,
      });
    },
    burstSeedsFromHead(count = 14) {
      const headX = this.stem.headX;
      const headY = this.stem.headY;

      let released = 0;
      for (let i = 0; i < this.driftingSeeds.length && released < count; i++) {
        const seed = this.driftingSeeds[i];
        if (!seed.isBurst || seed.x > this.canvasSize.width * 0.7) {
          const burstAngle = -Math.PI / 4 + (Math.random() - 0.3) * (Math.PI / 2.2);
          const burstSpeed = 80 + Math.random() * 110;

          seed.x = headX + (Math.random() - 0.5) * 16;
          seed.y = headY + (Math.random() - 0.5) * 16;
          seed.vx = Math.cos(burstAngle) * burstSpeed;
          seed.vy = Math.sin(burstAngle) * burstSpeed - 18;
          seed.opacity = 0.85;
          seed.isBurst = true;
          released++;
        }
      }
    },
    animateScene(timestamp) {
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }
      const delta = Math.min(
        0.033,
        Math.max(0.001, (timestamp - this.lastTimestamp) / 1000)
      );
      this.lastTimestamp = timestamp;

      this.updatePhysics(timestamp, delta);
      this.drawScene(timestamp, delta);

      this.animationId = requestAnimationFrame(this.animateScene);
    },
    updatePhysics(timestamp, delta) {
      const tSec = timestamp * 0.001;

      const gust =
        Math.sin(tSec * 0.7) * 15 +
        Math.sin(tSec * 1.8 + 1.2) * 9 +
        Math.cos(tSec * 0.32) * 11;
      this.wind.gust = gust;

      const targetWindX = this.wind.baseX + gust + this.mouse.vx * 0.22;
      const targetWindY =
        this.wind.baseY + Math.sin(tSec * 1.2) * 7 + this.mouse.vy * 0.18;

      this.wind.currentX += (targetWindX - this.wind.currentX) * (delta * 3);
      this.wind.currentY += (targetWindY - this.wind.currentY) * (delta * 3);

      this.mouse.vx *= 0.92;
      this.mouse.vy *= 0.92;

      const headDist = Math.hypot(
        this.mouse.x - this.stem.headX,
        this.mouse.y - this.stem.headY
      );
      if (this.mouse.active && headDist < 170) {
        const force = (1 - headDist / 170) * 32;
        const angle = Math.atan2(
          this.stem.headY - this.mouse.y,
          this.stem.headX - this.mouse.x
        );
        this.stem.reactionX += Math.cos(angle) * force * delta * 8;
        this.stem.reactionY += Math.sin(angle) * force * delta * 8;
      }
      this.stem.reactionX += (0 - this.stem.reactionX) * (delta * 3.2);
      this.stem.reactionY += (0 - this.stem.reactionY) * (delta * 3.2);

      const windBend = (this.wind.currentX - this.wind.baseX) * 0.75;
      const targetHeadX =
        this.stem.restHeadX + windBend + this.stem.reactionX;
      const targetHeadY =
        this.stem.restHeadY + Math.abs(windBend) * 0.14 + this.stem.reactionY;

      this.stem.headX += (targetHeadX - this.stem.headX) * (delta * 3.8);
      this.stem.headY += (targetHeadY - this.stem.headY) * (delta * 3.8);

      this.stem.ctrlX =
        this.stem.rootX + (this.stem.headX - this.stem.rootX) * 0.4 + windBend * 0.2;
      this.stem.ctrlY =
        this.stem.rootY - (this.stem.rootY - this.stem.headY) * 0.58;

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += sw.speed * delta;
        sw.alpha = Math.max(0, 0.65 * (1 - sw.radius / sw.maxRadius));
        if (sw.radius >= sw.maxRadius) {
          this.shockwaves.splice(i, 1);
        }
      }
    },
    drawScene(timestamp, delta) {
      if (!this.canvasContext) {
        return;
      }

      const { width, height } = this.canvasSize;
      const ctx = this.canvasContext;

      ctx.fillStyle = this.bgGradient || "rgba(7, 22, 27, 0.96)";
      ctx.fillRect(0, 0, width, height);

      this.drawMist(timestamp);
      this.drawAmbientSpores(timestamp, delta);
      this.drawShockwaves();
      this.drawDandelionBase(timestamp);
      this.drawDriftingSeeds(timestamp, delta);
    },
    drawMist(timestamp) {
      const { width, height } = this.canvasSize;
      const ctx = this.canvasContext;
      const pulse1 = Math.sin(timestamp / 2400) * 0.04 + 0.14;

      ctx.save();
      const grad1 = ctx.createRadialGradient(
        width * 0.72,
        height * 0.22,
        10,
        width * 0.72,
        height * 0.22,
        220
      );
      grad1.addColorStop(0, `rgba(228, 245, 230, ${pulse1})`);
      grad1.addColorStop(0.6, `rgba(160, 220, 196, ${pulse1 * 0.4})`);
      grad1.addColorStop(1, "transparent");
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(width * 0.72, height * 0.22, 220, 0, Math.PI * 2);
      ctx.fill();

      const headGlow = ctx.createRadialGradient(
        this.stem.headX,
        this.stem.headY,
        5,
        this.stem.headX,
        this.stem.headY,
        70
      );
      headGlow.addColorStop(0, "rgba(240, 252, 243, 0.16)");
      headGlow.addColorStop(1, "transparent");
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(this.stem.headX, this.stem.headY, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    drawAmbientSpores(timestamp, delta) {
      const { width, height } = this.canvasSize;
      const ctx = this.canvasContext;

      ctx.save();
      this.ambientSpores.forEach((spore) => {
        spore.x += (spore.vx + this.wind.currentX * 0.35) * delta;
        spore.y += (spore.vy + this.wind.currentY * 0.35) * delta;

        if (spore.x > width + 20) spore.x = -20;
        if (spore.y < -20) spore.y = height + 20;
        if (spore.y > height + 20) spore.y = -20;

        const pulse =
          Math.sin(timestamp * 0.001 * spore.pulseSpeed + spore.pulsePhase) *
            0.2 +
          0.8;
        const alpha = spore.alpha * pulse;

        ctx.fillStyle = `rgba(224, 250, 234, ${alpha})`;
        ctx.beginPath();
        ctx.arc(spore.x, spore.y, spore.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    },
    drawShockwaves() {
      const ctx = this.canvasContext;
      if (!this.shockwaves.length) return;

      ctx.save();
      this.shockwaves.forEach((sw) => {
        ctx.strokeStyle = `rgba(215, 245, 230, ${sw.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    },
    drawDandelionBase(timestamp) {
      const ctx = this.canvasContext;
      const { rootX, rootY, headX, headY, ctrlX, ctrlY } = this.stem;

      ctx.save();

      const stemGradient = ctx.createLinearGradient(
        rootX,
        rootY,
        headX,
        headY
      );
      stemGradient.addColorStop(0, "rgba(95, 172, 126, 0.88)");
      stemGradient.addColorStop(0.65, "rgba(148, 214, 172, 0.92)");
      stemGradient.addColorStop(1, "rgba(210, 244, 222, 0.98)");

      ctx.strokeStyle = stemGradient;
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, headX, headY);
      ctx.stroke();

      const tangentAngle =
        Math.atan2(headY - ctrlY, headX - ctrlX) - Math.PI / 2;

      ctx.strokeStyle = "rgba(112, 185, 140, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let s = -2; s <= 2; s++) {
        const sepalAngle = tangentAngle + Math.PI + s * 0.28;
        const sepalLen = 14;
        ctx.moveTo(headX, headY);
        ctx.quadraticCurveTo(
          headX + Math.cos(sepalAngle) * (sepalLen * 0.6),
          headY + Math.sin(sepalAngle) * (sepalLen * 0.6),
          headX + Math.cos(sepalAngle + 0.1) * sepalLen,
          headY + Math.sin(sepalAngle + 0.1) * sepalLen
        );
      }
      ctx.stroke();

      const tSec = timestamp * 0.001;
      this.florets.forEach((floret) => {
        const quiver = Math.sin(tSec * 2.8 + floret.phase) * 0.035;
        const currentAngle = floret.baseAngle + tangentAngle * 0.4 + quiver;
        const endX = headX + Math.cos(currentAngle) * floret.length;
        const endY = headY + Math.sin(currentAngle) * floret.length;

        ctx.strokeStyle = "rgba(226, 242, 232, 0.72)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        this.drawSeedFluff(
          endX,
          endY,
          currentAngle,
          0.74,
          1,
          floret.length * 0.55,
          floret.fluffRadius,
          floret.rayCount
        );
      });

      const coreGradient = ctx.createRadialGradient(
        headX,
        headY,
        1,
        headX,
        headY,
        7
      );
      coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      coreGradient.addColorStop(0.5, "rgba(220, 245, 226, 0.95)");
      coreGradient.addColorStop(1, "rgba(105, 175, 134, 0.9)");

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(headX, headY, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    drawDriftingSeeds(timestamp, delta) {
      const { width, height } = this.canvasSize;
      const headX = this.stem.headX;
      const headY = this.stem.headY;

      this.driftingSeeds.forEach((seed) => {
        const targetVx = (this.wind.currentX + seed.speed) * seed.depth;
        const targetVy = (this.wind.currentY - 4) * seed.depth;

        seed.vx += (targetVx - seed.vx) * (delta * 1.6);
        seed.vy += (targetVy - seed.vy) * (delta * 1.6);

        if (this.mouse.active) {
          const dx = seed.x - this.mouse.x;
          const dy = seed.y - this.mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 && dist > 1) {
            const push = (1 - dist / 130) * 160 * delta;
            seed.vx += (dx / dist) * push;
            seed.vy += (dy / dist) * push;
          }
        }

        this.shockwaves.forEach((sw) => {
          const dx = seed.x - sw.x;
          const dy = seed.y - sw.y;
          const dist = Math.hypot(dx, dy);
          if (Math.abs(dist - sw.radius) < 32 && dist > 1) {
            const force = (1 - Math.abs(dist - sw.radius) / 32) * 140 * delta;
            seed.vx += (dx / dist) * force;
            seed.vy += (dy / dist) * force;
          }
        });

        const sway =
          Math.sin(timestamp * 0.002 * seed.swaySpeed + seed.swayPhase) *
          (18 * seed.scale);
        seed.x += (seed.vx + sway) * delta;
        seed.y += seed.vy * delta;

        const motionAngle = Math.atan2(seed.vy, seed.vx) + Math.PI;
        seed.angle += (motionAngle - seed.angle) * (delta * 4);

        if (seed.x > width + 50 || seed.y < -50 || seed.y > height + 60) {
          seed.isBurst = false;
          if (Math.random() < 0.7) {
            seed.x = headX + (Math.random() - 0.4) * 20;
            seed.y = headY + (Math.random() - 0.4) * 20;
            seed.vx = seed.speed * 0.6;
            seed.vy = -8 - Math.random() * 10;
          } else {
            seed.x = -30;
            seed.y = Math.random() * height;
            seed.vx = seed.speed;
            seed.vy = -4 - Math.random() * 8;
          }
        }

        const alpha = Math.min(
          0.92,
          Math.max(0.12, seed.opacity * (1 - seed.x / (width + 120)))
        );

        this.drawSeedFluff(
          seed.x,
          seed.y,
          seed.angle,
          alpha,
          seed.scale,
          seed.stemLength,
          seed.fluffRadius,
          seed.rayCount
        );
      });
    },
    drawSeedFluff(
      x,
      y,
      angle,
      alpha,
      scale = 1,
      stemWidth = 28,
      fluffRadius = 10,
      rayCount = 8
    ) {
      const ctx = this.canvasContext;
      const stemLength = stemWidth * scale;
      const actualRadius = fluffRadius * scale;
      const stemX = x - Math.cos(angle) * stemLength;
      const stemY = y - Math.sin(angle) * stemLength;

      ctx.strokeStyle = `rgba(242, 250, 244, ${alpha})`;
      ctx.lineWidth = Math.max(0.7, 0.9 * scale);
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(stemX, stemY);
      ctx.lineTo(x, y);

      const spread = 1.35;
      const startAngle = angle - spread / 2;
      const step = spread / (rayCount - 1);
      const subLen = actualRadius * 0.32;

      for (let i = 0; i < rayCount; i++) {
        const branchAngle = startAngle + i * step;
        const branchX = x + Math.cos(branchAngle) * actualRadius;
        const branchY = y + Math.sin(branchAngle) * actualRadius;

        ctx.moveTo(x, y);
        ctx.lineTo(branchX, branchY);

        if (scale > 0.8) {
          const subAngle1 = branchAngle - 0.35;
          const subAngle2 = branchAngle + 0.35;
          ctx.moveTo(branchX, branchY);
          ctx.lineTo(
            branchX - Math.cos(subAngle1) * subLen,
            branchY - Math.sin(subAngle1) * subLen
          );
          ctx.moveTo(branchX, branchY);
          ctx.lineTo(
            branchX - Math.cos(subAngle2) * subLen,
            branchY - Math.sin(subAngle2) * subLen
          );
        }
      }
      ctx.stroke();

      ctx.fillStyle = `rgba(248, 254, 250, ${Math.min(1, alpha + 0.15)})`;
      ctx.beginPath();
      ctx.arc(stemX, stemY, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();
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
    radial-gradient(circle at 18% 22%, rgba(218, 239, 228, 0.14), transparent 36%),
    linear-gradient(135deg, #07161b 0%, #0f313d 46%, #1d5b4f 100%);
  color: #f4fbf6;
  user-select: none;
  contain: paint;
}

.scene-canvas,
.scene-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scene-canvas {
  z-index: 0;
  pointer-events: auto;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.scene-glow {
  will-change: transform;
}

.scene-glow-left {
  background: radial-gradient(circle at 30% 75%, rgba(236, 250, 224, 0.22) 0%, transparent 60%);
}

.scene-glow-right {
  background: radial-gradient(circle at 75% 25%, rgba(129, 208, 180, 0.18) 0%, transparent 55%);
}

.scene-glow-flower {
  background: radial-gradient(circle at 35% 50%, rgba(200, 245, 220, 0.14) 0%, transparent 45%);
}

.hero {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(320px, 530px) 1fr;
  align-items: center;
  gap: 36px;
  min-height: calc(100vh - 170px);
}

.eyebrow {
  margin: 0 0 12px;
  color: rgba(218, 241, 222, 0.76);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.intro {
  max-width: 520px;
  margin: 18px 0 26px;
  font-size: 17px;
  line-height: 1.8;
  color: rgba(238, 249, 240, 0.88);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.copy-card {
  width: min(100%, 530px);
  padding: 24px;
  border: 1px solid rgba(231, 247, 232, 0.18);
  border-radius: 28px;
  background: rgba(6, 21, 27, 0.45);
  backdrop-filter: blur(10px);
  box-shadow: 0 24px 90px rgba(2, 10, 12, 0.36);
  transition: border-color 0.3s ease;

  &:hover {
    border-color: rgba(231, 247, 232, 0.28);
  }
}

.copy-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  padding: 9px 16px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(238, 247, 241, 0.18),
    rgba(152, 211, 186, 0.09)
  );
  color: #f7fff8;
  font: 600 17px/28px "Georgia", serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.25s ease;

  &:hover {
    transform: translateX(4px);
    background: linear-gradient(
      90deg,
      rgba(238, 247, 241, 0.26),
      rgba(152, 211, 186, 0.16)
    );
    border-color: rgba(240, 250, 244, 0.3);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a9e8c6;
  box-shadow: 0 0 8px #a9e8c6;
  flex-shrink: 0;
}

.line-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.stat-item {
  min-width: 110px;
  padding: 12px 16px;
  border-radius: 18px;
  background: rgba(244, 252, 245, 0.09);
  border: 1px solid rgba(244, 252, 245, 0.14);
  backdrop-filter: blur(6px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(244, 252, 245, 0.14);
  }
}

.stat-wind {
  cursor: pointer;
  border-color: rgba(169, 232, 198, 0.25);
  background: rgba(169, 232, 198, 0.1);

  &:hover {
    background: rgba(169, 232, 198, 0.18);
    transform: translateY(-2px);
  }
}

.stat-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: rgba(218, 241, 222, 0.72);
}

.stat-value {
  font-size: 21px;
  font-weight: 700;
}

.wind-val {
  font-size: 16px;
  color: #c5f4d8;
}

.interaction-tip {
  margin: 16px 0 0;
  font-size: 13px;
  color: rgba(218, 241, 222, 0.65);
  display: flex;
  align-items: center;
  gap: 6px;
}

.tip-icon {
  color: #a9e8c6;
  font-size: 12px;
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
  gap: 8px;
  min-height: 44px;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(10, 31, 36, 0.76);
  border: 1px solid rgba(244, 252, 245, 0.18);
  box-shadow:
    0 16px 40px rgba(4, 18, 21, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  color: rgba(248, 253, 249, 0.94);
  font: 600 14px/1.4 "Georgia", serif;
  animation-name: floatSeedLabel;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
  transform: translateZ(0);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  cursor: default;

  &:hover {
    transform: scale(1.06) translateY(-4px) translateZ(0) !important;
    border-color: rgba(185, 245, 210, 0.5);
    box-shadow:
      0 20px 50px rgba(6, 26, 30, 0.45),
      0 0 20px rgba(169, 232, 198, 0.25);
    z-index: 10;
  }
}

.seed-icon {
  width: 16px;
  height: 16px;
  color: #bbf0d3;
  flex-shrink: 0;
}

.seed-text {
  white-space: nowrap;
}

@keyframes floatSeedLabel {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-3deg);
    opacity: 0.55;
  }

  35% {
    transform: translate3d(30px, -20px, 0) rotate(2deg);
    opacity: 0.92;
  }

  70% {
    transform: translate3d(80px, -48px, 0) rotate(5deg);
    opacity: 0.75;
  }
}

@media (max-width: 960px) {
  .dandelion-page {
    padding: 24px;
  }

  .hero {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 28px;
  }

  .hero-visual {
    min-height: 380px;
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
    font-size: 15px;
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
