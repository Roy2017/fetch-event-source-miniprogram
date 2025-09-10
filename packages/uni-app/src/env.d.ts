/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
interface ImportMetaEnv {
  /** 接口基础路径 */
  readonly VITE_API_BASE: string
  /** 环境变量 */
  readonly VITE_ENV: string
  /** 环境版本 */
  readonly VITE_ENV_VERSION: 'develop' | 'trial' | 'release'
  /** 小程序appid */
  readonly VITE_WX_APPID: string
}
