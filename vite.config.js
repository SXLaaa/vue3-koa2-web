const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

// https://vitejs.dev/config/
module.exports = defineConfig({
  server:{
    host: '127.0.0.1',
    port: 8080,
    proxy: {
      '/agent-api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-api/, '/api')
      }
    }
  },
  plugins: [vue()]
})
