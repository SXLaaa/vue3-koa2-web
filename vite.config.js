import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path') // import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve:{ // 定义别名
    alias:{
      '@': path.resolve(__dirname, './src')
    }
  },
  css:{
    // preprocessorOptions:{
    //   scss:{
    //     additionalData: `@import '@/assets/style/base.scss';`
    //   }
    // }
  },
  server:{
    host: '0.0.0.0',
    port: 8080,  
    proxy:{
      "/api":{
        target: "http://localhost:3000"
      }
    }
  },
  plugins: [vue()]
})
