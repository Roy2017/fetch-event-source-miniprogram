export function nextTick(cb) {
  if (canIUseNextTick()) {
    wx.nextTick(cb)
  } else {
    setTimeout(() => {
      cb()
    }, 1000 / 30)
  }
}
export function getRect(context, selector) {
  return new Promise(resolve => {
    wx.createSelectorQuery()
      .in(context)
      .select(selector)
      .boundingClientRect()
      .exec((rect = []) => resolve(rect[0]))
  })
}
function compareVersion(v1, v2) {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)
  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }
  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i], 10)
    const num2 = parseInt(v2[i], 10)
    if (num1 > num2) {
      return 1
    }
    if (num1 < num2) {
      return -1
    }
  }
  return 0
}
let systemInfo
export function getSystemInfoSync() {
  if (systemInfo == null) {
    systemInfo = wx.getSystemInfoSync()
  }
  return systemInfo
}
function gte(version) {
  const system = getSystemInfoSync()
  return compareVersion(system.SDKVersion, version) >= 0
}
export function canIUseModel() {
  return gte('2.9.3')
}
export function canIUseFormFieldButton() {
  return gte('2.10.3')
}
export function canIUseAnimate() {
  return gte('2.9.0')
}
export function canIUseGroupSetData() {
  return gte('2.4.0')
}
export function canIUseNextTick() {
  return wx.canIUse('nextTick')
}
export function canIUseCanvas2d() {
  return gte('2.9.0')
}

export function canIUseCropImage() {
  return gte('2.26.0')
}

export function canIUsePickerRegionLevel() {
  return gte('2.21.1')
}
export function canIUseGetUserProfile() {
  return !!wx.getUserProfile
}

// 检测到更新时，强制小程序更新
export function miniProgramUpdate() {
  console.log('小程序开始更新')
  const updateManager = wx.getUpdateManager()
  updateManager.onCheckForUpdate(function () {
    // 请求完新版本信息的回调
  })
  updateManager.onUpdateReady(function () {
    wx.showModal({
      title: '更新提示',
      content: '新版本已经准备好，单击确定重启应用',
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
          updateManager.applyUpdate()
        }
      }
    })
  })

  updateManager.onUpdateFailed(function () {
    // 新版本下载失败
    wx.showModal({
      title: '提示',
      content: '检查到有新版本，但下载失败，请检查网络设置',
      showCancel: false
    })
  })
}
