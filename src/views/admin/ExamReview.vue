<template>
  <div class="exam-review">
    <el-card>
      <template #header>
        <span>考试审核</span>
      </template>

      <el-table :data="regList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="100" />
        <el-table-column label="科目" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small">科目{{ row.subject || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="110" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '未通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" size="small" @click="handleAudit(row, true)">通过</el-button>
              <el-button link type="danger" size="small" @click="handleAudit(row, false)">拒绝</el-button>
            </template>
            <span v-else class="text-gray">-</span>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamRegistrationList, auditExamRegistration } from '@/api/exam'

const regList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

async function fetchList() {
  loading.value = true
  try {
    const res = await getExamRegistrationList({
      page: pagination.page,
      size: pagination.size,
    })
    regList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取考试报名列表失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleAudit(row, pass) {
  const action = pass ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(
      `确定要${action}该考试报名吗？`,
      '提示',
      { type: 'warning' }
    )
    await auditExamRegistration(row.id, pass)
    ElMessage.success(`${action}成功`)
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
    }
  }
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.text-gray { color: #909399; }
</style>
