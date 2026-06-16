<template>
  <div class="my-scores">
    <el-card>
      <template #header>
        <span>我的成绩</span>
      </template>

      <el-table :data="scoreList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="科目" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.subjectName ? row.subjectName : getSubjectLabel(row.subject, row.licenseType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.score != null" :style="getScoreStyle(row.score)">{{ row.score }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.passResult === '合格'" type="success" size="small">通过</el-tag>
            <el-tag v-else-if="row.passResult === '不合格'" type="danger" size="small">不通过</el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small" effect="plain">
              {{ row.statusDesc || getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="证书编号" width="150" show-overflow-tooltip v-if="showCertNo">
          <template #default="{ row }">
            {{ row.certNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.applyTime) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && scoreList.length === 0" description="暂无考试成绩记录" style="padding: 40px 0" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMyScores } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const scoreList = ref([])
const loading = ref(false)
const showCertNo = computed(() => userStore.isSpecial)

const SPECIAL_TYPES = ['N1', 'N2', 'N3', 'M']
function getSubjectLabel(subject, licenseType) {
  if (SPECIAL_TYPES.includes(licenseType)) {
    return subject === 1 ? '理论' : '实操'
  }
  return '科目' + subject
}

async function fetchScores() {
  loading.value = true
  try {
    const res = await getMyScores(userStore.userId)
    const list = Array.isArray(res) ? res : res.records || []
    scoreList.value = list.filter(r => r.score != null)
  } catch (error) {
    console.error('获取成绩失败:', error)
    scoreList.value = []
  } finally {
    loading.value = false
  }
}

function getScoreStyle(score) {
  return {
    color: score >= 90 ? '#67c23a' : '#f56c6c',
    fontWeight: 600,
    fontSize: '16px',
  }
}

function getStatusTag(status) {
  return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }[status] || 'info'
}

function getStatusText(status) {
  return { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已考试' }[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchScores)
</script>

<style scoped lang="scss">
.text-gray { color: #909399; }
</style>
