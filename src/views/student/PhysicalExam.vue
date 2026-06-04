<template>
  <div class="physical-exam">
    <!-- 提交体检申请 -->
    <el-card>
      <template #header>
        <span>提交体检申请</span>
      </template>
      <el-form :model="applyForm" :rules="applyRules" ref="applyFormRef" label-width="100px">
        <el-form-item label="体检地点" prop="venueId">
          <el-select v-model="applyForm.venueId" placeholder="请选择体检地点" style="width: 300px">
            <el-option
              v-for="item in venueOptions"
              :key="item.id || item"
              :label="item.name || item"
              :value="item.id || item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期" prop="examDate">
          <el-date-picker
            v-model="applyForm.examDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择体检日期"
            :disabled-date="d => d <= new Date()"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleApply" :loading="applyLoading">提交申请</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的体检申请记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>我的体检申请</span>
          <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="体检地点" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预约日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.examDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="体检结果" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 3">
              <el-tag v-if="row.result === 1" type="success" size="small">合格</el-tag>
              <el-tag v-else type="danger" size="small">不合格</el-tag>
            </template>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无体检申请记录" style="margin-top: 30px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { applyPhysicalExam, getMyPhysicalExams, getPhysicalExamLocations } from '@/api/physicalExam'

const recordList = ref([])
const loading = ref(false)
const venueOptions = ref([])

// 申请表单
const applyFormRef = ref()
const applyForm = reactive({ venueId: null, examDate: '' })
const applyLoading = ref(false)
const applyRules = {
  venueId: [{ required: true, message: '请选择体检地点', trigger: 'change' }],
  examDate: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
}

async function fetchVenues() {
  try {
    const res = await getPhysicalExamLocations()
    // 可能返回字符串数组或对象数组
    venueOptions.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取体检地点列表失败:', error)
    venueOptions.value = []
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getMyPhysicalExams()
    recordList.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('获取体检记录失败:', error)
    recordList.value = []
  } finally {
    loading.value = false
  }
}

async function handleApply() {
  const valid = await applyFormRef.value.validate().catch(() => false)
  if (!valid) return
  applyLoading.value = true
  try {
    await applyPhysicalExam({ venueId: applyForm.venueId, examDate: applyForm.examDate })
    ElMessage.success('体检申请已提交')
    applyForm.venueId = null
    applyForm.examDate = ''
    fetchList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    applyLoading.value = false
  }
}

function getStatusTag(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'danger', 3: 'success' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '审核通过', 2: '审核不通过', 3: '已完成' }
  return map[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(async () => {
  await fetchVenues()
  fetchList()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-gray {
  color: #909399;
}
</style>
