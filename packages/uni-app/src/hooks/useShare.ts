import { SHARE_TITLE } from '@/config/constant'
import { onShareAppMessage as UniAppOnShareAppMessage } from '@dcloudio/uni-app'
export const useShare = () => {

  const getShareData = () => {
    return {
      title: SHARE_TITLE,
      imageUrl: '',
      path: '/pages/guide/index'
    }
  }

  const onShareAppMessage = () => {
    return UniAppOnShareAppMessage(() => {
      return getShareData()
    })
  }
  return {
    getShareData,
    onShareAppMessage
  }
}
