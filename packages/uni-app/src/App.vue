<script setup lang="ts">
import { onLaunch, onHide, onShow, onError } from '@dcloudio/uni-app'

let isLogin = false

onLaunch(async () => {
  console.log("App Launch");
  isLogin = true
});
onShow((options) => {
  console.log("App Show", JSON.stringify(options));

});
onHide(() => {
  console.log("App Hide");
});
onError((error: any) => {
  console.log("App Error", error);
  uni.reportEvent("js_error_event", {
    "error_message": JSON.stringify(error)
  })
});
</script>
<style lang="scss">
view {
  box-sizing: border-box;
}
</style>
