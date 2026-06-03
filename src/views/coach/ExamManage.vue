<template>
  <div class="exam-manage">
    <el-card>
      <template #header>
        <span>考试管理</span>
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
        <el-table-column prop="status" label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '未通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.score != null" :style="{ color: row.score >= 90 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
              {{ row.score }}
            </span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1 && row.score == null"
              link type="success" size="small"
              @click="handleScore(row)"
            >
              录入成绩
            </el-button>
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

    <!-- 录入成绩对话框 -->
    <el-dialog v-model="scoreDialogVisible" title="录入成绩" width="400px" destroy-on-close>
      <el-form :model="scoreForm" label-width="100px">
        <el-form-item label="学员">
          <span>{{ scoreForm.studentName }}</span>
        </el-form-item>
        <el-form-item label="考试成绩" prop="score">
          <el-input-number v-model="scoreForm.score" :min="0" :max="100" :step="1" />
          <span style="margin-left: 8px; font-size: 13px; color: #999">≥90 为合格</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleScoreSubmit" :loading="scoreLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getExamRegistrationList, scoreExamRegistration } from '@/api/exam'

const regList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

const scoreDialogVisible = ref(false)
const scoreForm = reactive({ id: undefined, studentName: '', score: 90 })
const scoreLoading = ref(false)

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

function handleScore(row) {
  scoreForm.id = row.id
  scoreForm.studentName = row.studentName || ''
  scoreForm.score = 90
  scoreDialogVisible.value = true
}

async function handleScoreSubmit() {
  scoreLoading.value = true
  try {
    await scoreExamRegistration(scoreForm.id, scoreForm.score)
    ElMessage.success('成绩录入成功')
    scoreDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('录入成绩失败:', error)
  } finally {
    scoreLoading.value = false
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
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
