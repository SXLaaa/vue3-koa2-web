<!-- @Description: 登录页和后台顶栏共用的日夜配色切换。 -->
<template>
  <div :class="['theme-switch', { 'is-night': themeMode === 'night' }]" role="group" aria-label="配色模式">
    <button type="button" :aria-pressed="themeMode === 'day'" @click="setAppTheme('day')">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <span>日间</span>
    </button>
    <button type="button" :aria-pressed="themeMode === 'night'" @click="setAppTheme('night')">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.6 13.2A8.6 8.6 0 0 1 10.8 3.4a8.6 8.6 0 1 0 9.8 9.8Z" />
      </svg>
      <span>夜间</span>
    </button>
  </div>
</template>

<script>
import { appThemeMode, setAppTheme } from "@/utils/appTheme";

export default {
  name: "ThemeSwitch",
  computed: {
    themeMode() {
      return appThemeMode.value;
    },
  },
  methods: { setAppTheme },
};
</script>

<style scoped>
.theme-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
  flex: 0 0 auto;
  width: 148px;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--app-control-edge);
  border-radius: 10px;
  background: var(--app-subtle);
}

.theme-switch::before {
  content: "";
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 8px) / 2);
  border: 1px solid var(--app-edge);
  border-radius: 7px;
  background: var(--app-surface-raised);
  box-shadow: var(--app-shell-shadow);
  transition: transform 0.18s ease;
  pointer-events: none;
}

.theme-switch.is-night::before {
  transform: translateX(calc(100% + 2px));
}

.theme-switch button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--app-muted);
  font: inherit;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease;
}

.theme-switch button[aria-pressed="false"]:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.theme-switch button[aria-pressed="true"] {
  color: var(--app-accent);
  font-weight: 600;
}

.theme-switch svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.theme-switch button:focus-visible {
  outline: 2px solid var(--app-focus);
  outline-offset: -2px;
}

@media (max-width: 640px) {
  .theme-switch { width: 108px; }
  .theme-switch svg { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch::before,
  .theme-switch button { transition: none; }
}
</style>
