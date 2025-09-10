<template>
  <view class="page">
    <button @click="sendStreamRequest">发送流式请求</button>

  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShareTimeline, onLoad } from '@dcloudio/uni-app'
import { SHARE_TITLE, TOKEN_STORAGE_KEY } from '@/config/constant'
import { EventStreamContentType, fetchEventSource } from '@chenroy/fetch-event-source-miniprogram'
import { fetchEventSource as fetchEventSourceH5 } from '@fortaine/fetch-event-source'
import { onShareAppMessage } from '@dcloudio/uni-app'

onLoad(() => { })

const imgUrl = ``
const tmpFn = () => {
  return {
    title: SHARE_TITLE,
    imageUrl: imgUrl,
    // promise: true,
    path: `/pages/index/index`
  }
}
// @ts-ignore
onShareAppMessage(tmpFn)
onShareTimeline(tmpFn)

const _fetchUrl = 'http://localhost:3001/sse';

// 判断当前运行环境
const isH5 = () => {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

// 判断是否为微信小程序
const isWeixin = () => {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  // #ifndef MP-WEIXIN
  return false
  // #endif
}

const checkOpen = (response: any) => {
  if (isH5() && response.headers.get('content-type')?.startsWith(EventStreamContentType) && response.status === 200) {
    return true
  }
  else if (isWeixin() && response.header['content-type']?.startsWith(EventStreamContentType) && response.statusCode === 200) {
    return true
  }
  return false
}

const sendStreamRequest = () => {
  console.log('发送流式请求')
  const token = uni.getStorageSync(TOKEN_STORAGE_KEY)

  const fetchFunction = isH5() ? fetchEventSourceH5 : fetchEventSource;

  fetchFunction(_fetchUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Authorization': token
    },
    onopen: async (res: any) => {
      if (res.statusCode === 401) {
        console.log('token失效，请重新登录!')
        return
      }
      if (checkOpen(res)) {
        console.log('on start')
      }
      else {
        console.error('open-error', res)
      }
    },
    onmessage(msg: any) {
      console.log('msg', msg)
      try {
        // 处理接收到的流式数据
        const rawData = JSON.parse(msg.data)
        const data = rawData.data
        console.log('onmessage:', data)
      } catch (error) {
        console.log('onmessage:', msg.data)
      }
    },
    onerror: () => {
      console.log('onerror 11')
    },
    onclose: () => {
      console.log('onclose 11')
    },
    openWhenHidden: true,
  })
}


</script>

<style lang="scss">
.page {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: 10vh;
}
</style>
