<template>
  <div class="familiarization-manage">
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>合场记录管理</span>
        <el-button text type="primary" @click="fetchList" :icon="Refresh">刷新</el-button>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="学员姓名/考试地点" clearable style="width: 160px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="searchForm.subject" placeholder="全部" clearable style="width: 90px" @change="handleSearch">
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="用车类型">
          <el-select v-model="searchForm.carType" placeholder="全部" clearable style="width: 110px" @change="handleSearch">
            <el-option label="教练车" :value="1" />
            <el-option label="考试车" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px" @change="handleSearch">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试日期">
          <el-date-picker
            v-model="examDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 230px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="教练">
          <el-input v-model="searchForm.coachName" placeholder="教练姓名" clearable style="width: 130px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="学员姓名" width="100" align="center">
          <template #default="{ row }">
            {{ row.student_name || row.student_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="科目" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary">科目{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用车类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.car_type === 1 ? '' : 'warning'">
              {{ row.car_type === 1 ? '教练车' : '考试车' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="考试日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.exam_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="考试地点" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.venue_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="教练" width="100" align="center">
          <template #default="{ row }">
            {{ row.coach_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="安排时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.scheduled_time ? formatDateTime(row.scheduled_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="90" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              type="primary"
              size="small"
              @click="handleSchedule(row)"
            >
              安排时间
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              @click="handleComplete(row)"
            >
              完成
            </el-button>
            <el-button
              v-if="row.status !== 3 && row.status !== 2"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :total="total" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]" @size-change="handleSearch" @current-change="fetchList" />
      </div>

      <el-empty v-if="!loading && recordList.length === 0" description="暂无记录" style="margin-top: 40px" />
    </el-card>

    <!-- 安排时间对话框 -->
    <el-dialog v-model="scheduleDialogVisible" title="安排合场时间" width="400px" destroy-on-close>
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="合场时间">
          <el-date-picker
            v-model="scheduleForm.scheduledTime"
            type="datetime"
            placeholder="选择日期和时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSchedule" :loading="actionLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getFamiliarizations, scheduleFamiliarization, completeFamiliarization, cancelFamiliarization } from '@/api/familiarization'

const recordList = ref([])
const loading = ref(false)
const total = ref(0)
const actionLoading = ref(false)
const pagination = reactive({ page: 1, size: 10 })

const searchForm = reactive({
  status: undefined,
  keyword: '',
  subject: undefined,
  carType: undefined,
  coachName: '',
})
const examDateRange = ref([])

const scheduleDialogVisible = ref(false)
const currentRecord = ref(null)
const scheduleForm = reactive({
  scheduledTime: '',
})

function getStatusTagType(status) {
  const map = { 0: 'warning', 1: 'info', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待支付', 1: '已支付', 2: '已完成', 3: '已取消' }
  return map[status] || '未知'
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  searchForm.status = undefined
  searchForm.keyword = ''
  searchForm.subject = undefined
  searchForm.carType = undefined
  searchForm.coachName = ''
  examDateRange.value = []
  handleSearch()
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.status !== undefined && searchForm.status !== null && searchForm.status !== '') {
      params.status = searchForm.status
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.subject !== undefined && searchForm.subject !== null && searchForm.subject !== '') {
      params.subject = searchForm.subject
    }
    if (searchForm.carType !== undefined && searchForm.carType !== null && searchForm.carType !== '') {
      params.carType = searchForm.carType
    }
    if (examDateRange.value && examDateRange.value.length === 2) {
      params.examDateStart = examDateRange.value[0]
      params.examDateEnd = examDateRange.value[1]
    }
    if (searchForm.coachName) params.coachName = searchForm.coachName

    const res = await getFamiliarizations(params)
    let list = Array.isArray(res) ? res : res.records || []
    total.value = res.total || list.length
    recordList.value = list
  } catch (error) {
    console.error('获取合场记录失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleSchedule(row) {
  currentRecord.value = row
  scheduleForm.scheduledTime = ''
  scheduleDialogVisible.value = true
}

async function confirmSchedule() {
  if (!scheduleForm.scheduledTime) {
    ElMessage.warning('请选择合场时间')
    return
  }

  actionLoading.value = true
  try {
    await scheduleFamiliarization(currentRecord.value.id, scheduleForm.scheduledTime)
    ElMessage.success('安排成功')
    scheduleDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('安排失败:', error)
  } finally {
    actionLoading.value = false
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm('确定标记此合场为已完成吗？', '确认完成', { type: 'info' })
    await completeFamiliarization(row.id)
    ElMessage.success('已标记完成')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定取消此合场记录吗？', '确认取消', { type: 'warning' })
    await cancelFamiliarization(row.id)
    ElMessage.success('已取消')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
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
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
