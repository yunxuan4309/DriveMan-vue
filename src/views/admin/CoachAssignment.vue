<template>
  <div class="coach-assignment">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">教练分配</h2>
        <span class="page-desc">管理学员与教练的绑定关系</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAssign">手动分配</el-button>
    </div>

    <!-- 标签页切换 -->
    <el-card shadow="never" class="main-card">
      <el-tabs v-model="activeTab" class="page-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all">
          <template #label>
            <span class="tab-label"><el-icon :size="14"><List /></el-icon> 全部</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已绑定" name="bound">
          <template #label>
            <span class="tab-label"><el-icon :size="14"><Link /></el-icon> 已绑定</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已解绑" name="unbound">
          <template #label>
            <span class="tab-label"><el-icon :size="14"><Minus /></el-icon> 已解绑</span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.studentName"
          placeholder="学员姓名"
          clearable
          :prefix-icon="Search"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.coachName"
          placeholder="教练姓名"
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
        <span class="stat-item">
          共 <strong>{{ total }}</strong> 条记录
        </span>
        <span class="stat-item">
          已绑定 <strong>{{ boundCount }}</strong>
        </span>
        <span class="stat-item">
          已解绑 <strong>{{ unboundCount }}</strong>
        </span>
      </div>

      <!-- 表格 -->
      <el-table :data="assignmentList" v-loading="loading" border stripe size="small">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="140" />
        <el-table-column prop="coachName" label="教练姓名" width="140" />
        <el-table-column label="绑定时间" width="180">
          <template #default="{ row }">
            <span class="cell-text">{{ formatDateTime(row.bindTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status !== 0" type="success" size="small" effect="plain">
              <el-icon style="vertical-align: -2px; margin-right: 2px"><Link /></el-icon> 已绑定
            </el-tag>
            <el-tag v-else type="info" size="small" effect="plain">
              <el-icon style="vertical-align: -2px; margin-right: 2px"><Minus /></el-icon> 已解绑
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 0"
              text type="danger" size="small"
              @click="handleUnbind(row)"
            >
              解绑
            </el-button>
            <span v-else class="no-action">-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredList.length === 0" :description="emptyText" style="padding: 40px 0" />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          small
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 分配对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配教练" width="450px" destroy-on-close>
      <el-form :model="assignForm" ref="assignFormRef" :rules="assignRules" label-width="80px">
        <el-form-item label="学员" prop="studentId">
          <el-select v-model="assignForm.studentId" placeholder="请选择学员" filterable style="width: 100%">
            <el-option
              v-for="s in studentList"
              :key="s.studentId || s.userId"
              :label="(s.realName || s.username) + ' (ID:' + (s.studentId || s.userId) + ')'"
              :value="s.studentId || s.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教练" prop="coachId">
          <el-select v-model="assignForm.coachId" placeholder="请选择教练" filterable style="width: 100%">
            <el-option
              v-for="c in coachList"
              :key="c.coachId"
              :label="(c.realName || '教练') + ' (' + c.vehicleType + ')'"
              :value="c.coachId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit" :loading="assignLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, List, Link, Minus, Search } from '@element-plus/icons-vue'
import { getCoachAssignments, assignCoach, unbindCoach, getCoachList } from '@/api/coach'
import { getStudentList } from '@/api/student'

const activeTab = ref('all')

const loading = ref(false)
const rawList = ref([])
const pagination = reactive({ page: 1, size: 10 })

// 当前标签页下的总条数（前端分页用）
const total = computed(() => filteredList.value.length)

const searchForm = reactive({
  studentName: '',
  coachName: '',
})

// 按标签过滤后的数据
const filteredList = computed(() => {
  let list = rawList.value
  if (activeTab.value === 'bound') {
    list = list.filter(item => item.status !== 0)
  } else if (activeTab.value === 'unbound') {
    list = list.filter(item => item.status === 0)
  }
  return list
})

// 分页展示的数据（前端分页）
const assignmentList = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredList.value.slice(start, end)
})

// 统计数据
const boundCount = computed(() => rawList.value.filter(item => item.status !== 0).length)
const unboundCount = computed(() => rawList.value.filter(item => item.status === 0).length)

const emptyText = computed(() => {
  const map = { all: '暂无绑定记录', bound: '暂无已绑定的记录', unbound: '暂无已解绑的记录' }
  return map[activeTab.value]
})

// 分配对话框
const assignDialogVisible = ref(false)
const assignFormRef = ref(null)
const assignLoading = ref(false)
const assignForm = ref({ studentId: undefined, coachId: undefined })
const assignRules = {
  studentId: [{ required: true, message: '请选择学员', trigger: 'change' }],
  coachId: [{ required: true, message: '请选择教练', trigger: 'change' }],
}
const studentList = ref([])
const coachList = ref([])

async function fetchAssignments() {
  loading.value = true
  try {
    const params = { page: 1, size: 9999 }
    if (searchForm.studentName) params.studentName = searchForm.studentName
    if (searchForm.coachName) params.coachName = searchForm.coachName
    const res = await getCoachAssignments(params)
    rawList.value = Array.isArray(res) ? res : res.records || []
    pagination.page = 1
  } catch (error) {
    console.error('获取绑定关系失败:', error)
    rawList.value = []
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  const maxPage = Math.ceil(filteredList.value.length / pagination.size)
  if (pagination.page > maxPage) {
    pagination.page = maxPage || 1
  }
}

function handleSearch() {
  fetchAssignments()
}

function handleReset() {
  searchForm.studentName = ''
  searchForm.coachName = ''
  fetchAssignments()
}

function handlePageChange() {
  // computed 自动响应分页参数
}

async function fetchStudents() {
  try {
    const res = await getStudentList()
    studentList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取学员列表失败:', error)
  }
}

async function fetchCoaches() {
  try {
    const res = await getCoachList()
    coachList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取教练列表失败:', error)
  }
}

function handleAssign() {
  assignForm.value = { studentId: undefined, coachId: undefined }
  fetchStudents()
  fetchCoaches()
  assignDialogVisible.value = true
}

async function handleAssignSubmit() {
  const valid = await assignFormRef.value?.validate().catch(() => false)
  if (!valid) return
  assignLoading.value = true
  try {
    await assignCoach(assignForm.value.studentId, assignForm.value.coachId)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    fetchAssignments()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    assignLoading.value = false
  }
}

async function handleUnbind(row) {
  try {
    await ElMessageBox.confirm(
      `确定要解绑 "${row.studentName}" 与 "${row.coachName}" 的绑定关系吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '确认解绑', cancelButtonText: '取消' }
    )
    await unbindCoach(row.id)
    ElMessage.success('解绑成功')
    fetchAssignments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解绑失败:', error)
    }
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchAssignments)
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
    color: #606266;
    transition: color 0.2s;

    &:hover {
      color: #409eff;
    }

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
  width: 160px;

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: box-shadow 0.2s;

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

.cell-text {
  color: #606266;
}

.no-action {
  color: #c0c4cc;
  font-size: 13px;
}

/* ── 分页 ── */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}
</style>
