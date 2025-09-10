import { createSSRApp } from 'vue'
import App from './App.vue'
import store from '@/store'
import './index.scss'
export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.config.errorHandler = (err, vm, info) => {
    console.error('err', err)
    console.error('vm', vm)
    console.error('info', info)
  }
  return {
    app
  }
}
