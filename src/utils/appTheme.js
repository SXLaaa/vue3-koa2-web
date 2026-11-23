/** @Description: 管理全站日间和夜间模式，以及浏览器中的配色偏好。 */
import { readonly, ref } from "vue";

const themeModeKey = "koa-app-theme";
const mode = ref("day");
let listeningForThemeChanges = false;

export const appThemeMode = readonly(mode);

function applyThemeMode() {
  document.documentElement.dataset.appTheme = mode.value;
  document.documentElement.style.colorScheme = mode.value === "night" ? "dark" : "light";
}

function syncThemeMode(event) {
  if (event.key !== themeModeKey && event.key !== null) return;
  try {
    if (event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  mode.value = event.newValue === "night" ? "night" : "day";
  applyThemeMode();
}

export function initializeAppTheme() {
  try {
    mode.value = window.localStorage.getItem(themeModeKey) === "night" ? "night" : "day";
  } catch {
    // 本地存储不可用时保留当前配色，首次加载默认为日间。
  }
  applyThemeMode();
  if (!listeningForThemeChanges) {
    // 其他标签页切换或清空配色偏好时，同步当前页面。
    window.addEventListener("storage", syncThemeMode);
    listeningForThemeChanges = true;
  }
}

export function setAppTheme(modeName) {
  if (modeName !== "day" && modeName !== "night") return;
  mode.value = modeName;
  applyThemeMode();
  try {
    window.localStorage.setItem(themeModeKey, modeName);
  } catch {
    // 浏览器禁用存储时，当次页面仍可切换配色。
  }
}
