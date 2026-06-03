<template>
  <div class="coach-exam-sessions">
    <el-card>
      <template #header>
        <span>考试场次</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="科目">
          <el-select v-model="searchForm.subject" placeholder="全部科目" clearable style="width: 120px">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="sessionList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="subject" label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="licenseType" label="适用车型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examDate" label="考试日期" width="120" align="center" />
        <el-table-column prop="startTime" label="开始时间" width="100" align="center" />
        <el-table-column prop="location" label="考试地点" min-width="160" show-overflow-tooltip />
        <el-table-column prop="totalQuota" label="总名额" width="80" align="center" />
        <el-table-column prop="remainingQuota" label="剩余名额" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.remainingQuota > 0 ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
              {{ row.remainingQuota }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getExamSessionList } from '@/api/exam'

const sessionList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

// 搜索表单
const searchForm = reactive({
  subject: undefined,
  licenseType: '',
})

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
    }
    if (searchForm.subject) params.subject = searchForm.subject
    if (searchForm.licenseType) params.licenseType = searchForm.licenseType

    const res = await getExamSessionList(params)
    sessionList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取考试场次失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.subject = undefined
  searchForm.licenseType = ''
  pagination.page = 1
  fetchList()
}

function getStatusTagType(status) {
  const map = { 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 1: '报名中', 2: '已满', 3: '已结束' }
  return map[status] || '未知'
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
