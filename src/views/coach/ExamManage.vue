<template>
  <div class="exam-manage">
    <el-card>
      <template #header>
        <span>学员考试状态</span>
      </template>

      <el-table :data="regList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="100" />
        <el-table-column prop="licenseType" label="车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="110" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="100" align="center">
          <template #default="{ row }">
            {{ row.startTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="报名状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.statusDesc || getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.score != null" :style="{ color: row.score >= 90 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
              {{ row.score }}
            </span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="补考次数" width="90" align="center">
          <template #default="{ row }">
            {{ row.retakeCount || 0 }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="regList.length === 0 && !loading" class="empty-tip">
        暂无学员考试报名记录
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCoachExamRegistrations } from '@/api/exam'

const regList = ref([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getCoachExamRegistrations()
    regList.value = res || []
  } catch (error) {
    console.error('获取学员考试报名列表失败:', error)
  } finally {
    loading.value = false
  }
}

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已考试' }
  return map[status] || '未知'
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}
.text-gray {
  color: #909399;
}
</style>
