<template>
  <div class="coach-assignment">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">教练分配</h2>
        <span class="page-desc">查看学员教练分配情况，可直接分配或更换教练</span>
      </div>
    </div>

    <!-- 主卡片 -->
    <el-card shadow="never" class="main-card">
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" class="page-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all">
          <template #label><span class="tab-label">全部</span></template>
        </el-tab-pane>
        <el-tab-pane label="未分配" name="unbound">
          <template #label><span class="tab-label">未分配</span></template>
        </el-tab-pane>
        <el-tab-pane label="已分配" name="bound">
          <template #label><span class="tab-label">已分配</span></template>
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.realName"
          placeholder="学员姓名"
          clearable
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 统计行 -->
      <div class="stats-row">
        <span class="stat-item">共 <strong>{{ total }}</strong> 名学员</span>
        <span class="stat-item">已分配 <strong>{{ boundTotal }}</strong></span>
        <span class="stat-item">未分配 <strong>{{ unboundTotal }}</strong></span>
      </div>

      <!-- 表格 -->
      <el-table :data="studentList" v-loading="loading" border stripe size="small">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="学员姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="licenseType" label="驾照类型" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.licenseType">{{ row.licenseType }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="当前教练" width="140" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.coachName" type="success" size="small" effect="plain">
              {{ row.coachName }}
            </el-tag>
            <el-tag v-else type="info" size="small" effect="plain">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.coachId">
              <el-button text type="primary" size="small" @click="handleChangeCoach(row)">更换</el-button>
              <el-button text type="danger" size="small" @click="handleUnbind(row)">解绑</el-button>
            </template>
            <el-button v-else text type="primary" size="small" @click="handleAssign(row)">分配</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && studentList.length === 0" description="暂无匹配的学员" style="padding: 40px 0" />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          small
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 分配/更换教练对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px" destroy-on-close>
      <el-form :model="assignForm" ref="assignFormRef" :rules="assignRules" label-width="100px">
        <el-form-item label="学员">
          <el-tag type="primary">{{ currentStudent.realName }}</el-tag>
          <span style="margin-left: 8px; color: #909399; font-size: 13px">
            ({{ currentStudent.licenseType || '未选车型' }})
          </span>
        </el-form-item>
        <el-form-item v-if="currentStudent.coachName" label="当前教练">
          <el-tag>{{ currentStudent.coachName }}</el-tag>
        </el-form-item>
        <el-form-item label="目标教练" prop="coachId">
          <el-select v-model="assignForm.coachId" placeholder="请选择教练" filterable style="width: 100%">
            <el-option
              v-for="c in eligibleCoaches"
              :key="c.coachId"
              :label="(c.realName || '教练') + ' (' + c.vehicleType + ')'"
              :value="c.coachId"
            />
          </el-select>
          <div v-if="eligibleCoaches.length === 0 && currentStudent.licenseType" class="form-tip-warning">
            暂无准教车型包含 "{{ currentStudent.licenseType }}" 的教练
          </div>
          <div v-if="!currentStudent.licenseType" class="form-tip-warning">
            该学员未选择报考车型，无法分配教练
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit" :loading="assignLoading" :disabled="eligibleCoaches.length === 0">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getCoachList, assignCoach, unbindCoach } from '@/api/coach'
import { getStudentList } from '@/api/student'

const activeTab = ref('all')
const loading = ref(false)
const rawList = ref([]) // 全量学员数据（前端过滤+分页）
const coachList = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
})

const searchForm = reactive({
  realName: '',
})

// 按标签过滤
const filteredList = computed(() => {
  let list = rawList.value
  if (searchForm.realName) {
    const kw = searchForm.realName.toLowerCase()
    list = list.filter(s => (s.realName || '').toLowerCase().includes(kw))
  }
  if (activeTab.value === 'bound') {
    list = list.filter(s => s.coachId)
  } else if (activeTab.value === 'unbound') {
    list = list.filter(s => !s.coachId)
  }
  return list
})

// 分页展示的数据（前端分页）
const studentList = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredList.value.slice(start, end)
})

const total = computed(() => filteredList.value.length)
const boundTotal = computed(() => rawList.value.filter(s => s.coachId).length)
const unboundTotal = computed(() => rawList.value.filter(s => !s.coachId).length)

// 分配对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const assignFormRef = ref(null)
const assignLoading = ref(false)
const isChange = ref(false) // true=更换, false=分配
const assignForm = reactive({ coachId: undefined })
const currentStudent = ref({})
const assignRules = {
  coachId: [{ required: true, message: '请选择教练', trigger: 'change' }],
}

// 按学员车型过滤可分配的教练
const eligibleCoaches = computed(() => {
  const licenseType = currentStudent.value.licenseType
  if (!licenseType) return []
  return coachList.value.filter(c => {
    const types = (c.vehicleType || '').split(',').map(t => t.trim())
    return types.includes(licenseType)
  })
})

async function fetchStudentList() {
  loading.value = true
  try {
    // 拉取全量学员（管理员场景，学员数通常不大）
    const params = { page: 1, size: 9999 }
    if (searchForm.realName) params.realName = searchForm.realName
    const res = await getStudentList(params)
    rawList.value = res.records || []
    pagination.page = 1
  } catch (error) {
    console.error('获取学员列表失败:', error)
    rawList.value = []
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
}

function handleSearch() {
  pagination.page = 1
  fetchStudentList()
}

function handleReset() {
  searchForm.realName = ''
  pagination.page = 1
  fetchStudentList()
}

function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
}

function handleCurrentChange(page) {
  pagination.page = page
}

async function fetchCoaches() {
  try {
    const res = await getCoachList({ page: 1, size: 9999 })
    coachList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取教练列表失败:', error)
  }
}

function handleAssign(row) {
  isChange.value = false
  dialogTitle.value = '分配教练'
  currentStudent.value = row
  assignForm.coachId = undefined
  fetchCoaches()
  dialogVisible.value = true
}

function handleChangeCoach(row) {
  isChange.value = true
  dialogTitle.value = '更换教练'
  currentStudent.value = row
  assignForm.coachId = undefined
  fetchCoaches()
  dialogVisible.value = true
}

async function handleAssignSubmit() {
  const valid = await assignFormRef.value?.validate().catch(() => false)
  if (!valid) return

  assignLoading.value = true
  const studentId = currentStudent.value.userId || currentStudent.value.studentId
  const coachId = assignForm.coachId

  try {
    if (isChange.value && currentStudent.value.bindId) {
      // 更换：先解绑再分配
      await unbindCoach(currentStudent.value.bindId)
    }
    await assignCoach(studentId, coachId)
    ElMessage.success(isChange.value ? '更换成功' : '分配成功')
    dialogVisible.value = false
    fetchStudentList()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    assignLoading.value = false
  }
}

async function handleUnbind(row) {
  try {
    await ElMessageBox.confirm(
      `确定要解绑 "${row.realName}" 与教练 "${row.coachName}" 的绑定关系吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '确认解绑', cancelButtonText: '取消' }
    )
    await unbindCoach(row.bindId)
    ElMessage.success('解绑成功')
    fetchStudentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解绑失败:', error)
    }
  }
}

onMounted(() => {
  fetchStudentList()
})
</script>

<style scoped lang="scss">
.coach-assignment {
  max-width: 1100px;
  padding: 16px 24px;
}

/* ── 页头 ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.3;
}

.page-desc {
  font-size: 13px;
  color: #909399;
}

/* ── 主卡片 ── */
.main-card {
  border-radius: 8px;
  padding-bottom: 4px;

  :deep(.el-card__body) {
    padding: 0;
  }
}

/* ── 标签页 ── */
.page-tabs {
  padding: 0 20px;

  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 44px;
    padding: 0 16px;
    font-size: 13px;

    &.is-active {
      color: #409eff;
      font-weight: 500;
    }
  }
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ── 搜索栏 ── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px 0;
}

.search-input {
  width: 180px;

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;

    &:hover {
      box-shadow: 0 0 0 1px #409eff inset;
    }
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }
}

/* ── 统计行 ── */
.stats-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px 0;
  font-size: 13px;
  color: #909399;
}

.stat-item strong {
  color: #303133;
  font-weight: 600;
}

/* ── 表格 ── */
.el-table {
  margin: 12px 20px 0;
  width: calc(100% - 40px);
  border-radius: 6px;

  :deep(th.el-table__cell) {
    background-color: #f5f7fa;
    color: #606266;
    font-weight: 500;
    font-size: 12px;
  }

  :deep(.cell) {
    font-size: 13px;
  }
}

.text-gray {
  color: #909399;
}

.form-tip-warning {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 4px;
  line-height: 1.4;
}

/* ── 分页 ── */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}
</style>
