<template>
  <!-- 登录页不使用全局布局 -->
  <router-view v-if="!showLayout" />

  <!-- 主布局 -->
  <el-container class="app-container" v-else>
    <SidebarMenu />
    <el-container class="right-panel">
      <TopHeader />
      <NoticeBar />

      <!-- 文件请求提醒横幅 -->
      <div v-if="showFileRequestBanner" class="file-request-banner">
        <el-alert
          :title="`您有 ${fileRequestPendingCount} 个待处理的文件提交请求，请尽快上传文件`"
          type="warning"
          show-icon
          :closable="false"
          style="border-radius: 0"
        >
          <template #default>
            <el-button type="warning" size="small" text @click="goToFileRequests">
              查看详情
            </el-button>
          </template>
        </el-alert>
      </div>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getPendingFileRequestCount } from '@/api/fileRequest'
import SidebarMenu from '@/components/SidebarMenu.vue'
import TopHeader from '@/components/TopHeader.vue'
import NoticeBar from '@/components/NoticeBar.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  userStore.restoreSession()
  if (userStore.isLoggedIn && (userStore.role === 1 || userStore.role === 2)) {
    fetchFileRequestCount()
  }
})

const showLayout = computed(() => route.name !== 'Login')

// 文件请求提醒
const fileRequestPendingCount = ref(0)
const showFileRequestBanner = computed(() =>
  fileRequestPendingCount.value > 0 &&
  userStore.isLoggedIn &&
  (userStore.role === 1 || userStore.role === 2)
)

async function fetchFileRequestCount() {
  try {
    fileRequestPendingCount.value = await getPendingFileRequestCount() || 0
  } catch {
    fileRequestPendingCount.value = 0
  }
}

watch(() => route.path, () => {
  if (userStore.isLoggedIn && (userStore.role === 1 || userStore.role === 2)) {
    fetchFileRequestCount()
  }
})

function goToFileRequests() {
  if (userStore.role === 1) {
    router.push('/student/file-requests')
  } else if (userStore.role === 2) {
    router.push('/coach/file-requests')
  }
}
</script>

<style lang="scss">
@use '@/styles/global' as *;

html, body, #app {
  height: 100%;
  margin: 0;
}

.app-container {
  height: 100vh;
}

.right-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 0;
}
</style>
