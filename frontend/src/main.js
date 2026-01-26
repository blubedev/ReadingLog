import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// エラーハンドリング
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
}

app.mount('#app')
