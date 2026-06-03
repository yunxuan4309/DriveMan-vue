<template>
  <div class="my-scores">
    <el-card>
      <template #header>
        <span>我的成绩</span>
      </template>

      <el-table :data="scoreList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">科目{{ row.subject || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.score != null" :style="getScoreStyle(row.score)">{{ row.score }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.score != null" :type="row.score >= 90 ? 'success' : 'danger'" size="small">
              {{ row.score >= 90 ? '通过' : '不通过' }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="报名时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[5, 10, 20]"
          @size-change="fetchScores"
          @current-change="fetchScores"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStudentExamRegistrations } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const scoreList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

async function fetchScores() {
  loading.value = true
  try {
    const res = await getStudentExamRegistrations(userStore.userId)
    scoreList.value = Array.isArray(res) ? res.filter(r => r.score != null) : []
    pagination.total = scoreList.value.length
  } catch (error) {
    console.error('获取成绩失败:', error)
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
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.text-gray { color: #909399; }
</style>
