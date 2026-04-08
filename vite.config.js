/*
 * @FilePath: /vue3.0-koa2/vue3-koa2-web/vite.config.js
 * @Author: shixiaolei
 * @Date: 2024-06-26 10:11:51
 * @LastEditTime: 2026-04-08 16:30:11
 * @LastEditors: shixiaolei
 * @Description: 
 */
import vue from "@vitejs/plugin-vue";
import { defineConfig } from 'vite';
const path = require("path"); // import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
      "/modelData": {
        target: "http://localhost:8089",
      },
      "/geoserver": {
        target: "http://localhost:8089",
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020', // 支持 BigInt
    },
  },
  build: {
    target: 'chrome100', // 升级支持 BigInt 的环境
    rollupOptions: {
      // 告知 Rollup 不要尝试打包这些外部文件
      // 在这里配置 external，告诉 Vite 如何处理外部资源
      external: [
        'Cesium/Cesium.js',
        'Cesium/Widgets/widgets.css',
      ],
    },
  },
  plugins: [vue()],
});
