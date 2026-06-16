<template>
  <div v-if="currentNotice" class="notice-bar">
    <div class="notice-inner">
      <div class="notice-left">
        <el-icon class="notice-icon" :size="18"><Bell /></el-icon>
        <div class="notice-body">
          <span class="notice-title">{{ currentNotice.title }}</span>
          <span class="notice-divider">|</span>
          <span class="notice-text">{{ currentNotice.content }}</span>
        </div>
      </div>
      <div class="notice-right">
        <span v-if="remainingCount > 0" class="notice-count">还有 {{ remainingCount }} 条公告</span>
        <el-button type="primary" size="small" @click="handleConfirm">我知道了</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { getActiveNotices } from '@/api/notice'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const notices = ref([])
const confirmedIds = ref(new Set())
const currentIndex = ref(0)

const unconfirmedNotices = computed(() => {
  return notices.value.filter(n => !confirmedIds.value.has(n.id))
})

const currentNotice = computed(() => {
  const list = unconfirmedNotices.value
  if (list.length === 0) return null
  if (currentIndex.value >= list.length) {
    currentIndex.value = 0
  }
  return list[currentIndex.value]
})

const remainingCount = computed(() => {
  const count = unconfirmedNotices.value.length - 1
  return count > 0 ? count : 0
})

function getStorageKey() {
  return `notice_confirmed_${userStore.userId || 'guest'}`
}

function loadConfirmedIds() {
  try {
    const raw = localStorage.getItem(getStorageKey())
    if (raw) {
      const arr = JSON.parse(raw)
      confirmedIds.value = new Set(arr)
    }
  } catch {
    confirmedIds.value = new Set()
  }
}

function saveConfirmedIds() {
  localStorage.setItem(getStorageKey(), JSON.stringify([...confirmedIds.value]))
}

async function fetchNotices() {
  try {
    const res = await getActiveNotices()
    notices.value = res || []
  } catch {
    notices.value = []
  }
}

function handleConfirm() {
  if (currentNotice.value) {
    confirmedIds.value.add(currentNotice.value.id)
    saveConfirmedIds()
  }
}

watch(() => userStore.userId, () => {
  loadConfirmedIds()
  fetchNotices()
})

onMounted(() => {
  loadConfirmedIds()
  if (userStore.isLoggedIn) {
    fetchNotices()
  }
})
</script>

<style scoped lang="scss">
.notice-bar {
  background: linear-gradient(90deg, #ecf5ff 0%, #f0f9ff 100%);
  border-bottom: 1px solid #c6e2ff;
}

.notice-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  min-height: 46px;
  gap: 16px;
}

.notice-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.notice-icon {
  color: #409eff;
  flex-shrink: 0;
}

.notice-body {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
}

.notice-divider {
  color: #b3d8ff;
  flex-shrink: 0;
}

.notice-text {
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.notice-count {
  font-size: 12px;
  color: #909399;
}
</style>
