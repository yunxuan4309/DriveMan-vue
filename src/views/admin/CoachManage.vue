<template>
  <div class="coach-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教练管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增教练
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="教练姓名">
          <el-input v-model="searchForm.realName" placeholder="请输入教练姓名" clearable />
        </el-form-item>
        <el-form-item label="准驾车型">
          <el-select v-model="searchForm.vehicleType" placeholder="全部车型" clearable style="width: 120px">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="coachList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="rating" label="评分" width="100" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column prop="coachYears" label="教龄" width="100" align="center">
          <template #default="{ row }">
            {{ row.coachYears }} 年
          </template>
        </el-table-column>
        <el-table-column prop="vehicleType" label="准驾车型" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="type in row.vehicleType?.split(',')" :key="type" size="small" class="vehicle-tag">
              {{ type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        class="coach-form"
      >
        <el-form-item label="关联用户" prop="userId" v-if="!isEdit">
          <el-select-v2
            v-model="form.userId"
            :options="userOptions"
            placeholder="请选择用户（角色为教练）"
            style="width: 100%"
            filterable
            clearable
          />
          <div class="form-tip">需先在用户管理中创建角色为"教练"的用户</div>
        </el-form-item>
        <el-form-item label="评分" prop="rating">
          <el-rate v-model="form.rating" show-score text-color="#ff9900" />
        </el-form-item>
        <el-form-item label="教龄" prop="coachYears">
          <el-input-number v-model="form.coachYears" :min="0" :max="50" />
        </el-form-item>
        <el-form-item label="准驾车型" prop="vehicleType">
          <el-checkbox-group v-model="selectedVehicleTypes">
            <el-checkbox label="C1">C1</el-checkbox>
            <el-checkbox label="C2">C2</el-checkbox>
            <el-checkbox label="B1">B1</el-checkbox>
            <el-checkbox label="B2">B2</el-checkbox>
            <el-checkbox label="A1">A1</el-checkbox>
            <el-checkbox label="A2">A2</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="教练详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="教练ID">{{ currentCoach.coachId }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentCoach.userId }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentCoach.realName }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentCoach.username }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentCoach.phone }}</el-descriptions-item>
        <el-descriptions-item label="评分">
          <el-rate v-model="currentCoach.rating" disabled show-score text-color="#ff9900" />
        </el-descriptions-item>
        <el-descriptions-item label="教龄">{{ currentCoach.coachYears }} 年</el-descriptions-item>
        <el-descriptions-item label="准驾车型">
          <el-tag v-for="type in currentCoach.vehicleType?.split(',')" :key="type" size="small" class="vehicle-tag">
            {{ type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentCoach.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(currentCoach.updateTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, View, Edit, Delete } from '@element-plus/icons-vue'
import { getCoachList, createCoach, updateCoach, deleteCoach } from '@/api/coach'
import { getUserList } from '@/api/user'

// 搜索表单
const searchForm = reactive({
  username: '',
  realName: '',
  vehicleType: '',
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
})

// 数据列表
const coachList = ref([])
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

// 表单
const form = reactive({
  coachId: undefined,
  userId: undefined,
  rating: 5.0,
  coachYears: 0,
  vehicleType: '',
})

// 选中的车型
const selectedVehicleTypes = ref([])

// 监听车型选择变化
watch(selectedVehicleTypes, (val) => {
  form.vehicleType = val.join(',')
})

// 表单校验规则
const formRules = {
  userId: [{ required: true, message: '请选择关联用户', trigger: 'change' }],
  rating: [{ required: true, message: '请设置评分', trigger: 'change' }],
}

// 查看详情
const viewDialogVisible = ref(false)
const currentCoach = ref({})

// 用户选项（用于选择关联用户）
const userOptions = ref([])

// 获取教练列表
async function fetchCoachList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm,
    }
    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })

    const res = await getCoachList(params)
    // 注意：后端返回的教练列表可能需要补充用户信息
    coachList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取教练列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取教练用户列表（用于选择关联）
async function fetchCoachUsers() {
  try {
    const res = await getUserList({ role: 2, size: 1000 })
    const users = res.records || []
    userOptions.value = users.map(user => ({
      value: user.userId,
      label: `${user.realName || user.username} (ID: ${user.userId})`,
    }))
  } catch (error) {
    console.error('获取教练用户列表失败:', error)
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchCoachList()
}

// 重置
function handleReset() {
  searchForm.username = ''
  searchForm.realName = ''
  searchForm.vehicleType = ''
  pagination.page = 1
  fetchCoachList()
}

// 分页
function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchCoachList()
}

function handlePageChange(page) {
  pagination.page = page
  fetchCoachList()
}

// 新增
async function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增教练'
  resetForm()
  await fetchCoachUsers()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑教练'
  Object.assign(form, row)
  selectedVehicleTypes.value = row.vehicleType ? row.vehicleType.split(',') : []
  dialogVisible.value = true
}

// 查看
function handleView(row) {
  currentCoach.value = row
  viewDialogVisible.value = true
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除教练 "${row.realName || row.username}" 吗？此操作不会真正删除数据，只是标记为已删除。`,
      '提示',
      { type: 'warning' }
    )
    await deleteCoach(row.coachId)
    ElMessage.success('删除成功')
    fetchCoachList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      const { coachId, ...updateData } = form
      await updateCoach(form.coachId, updateData)
      ElMessage.success('修改成功')
    } else {
      await createCoach(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchCoachList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  form.coachId = undefined
  form.userId = undefined
  form.rating = 5.0
  form.coachYears = 0
  form.vehicleType = ''
  selectedVehicleTypes.value = []
}

// 工具函数
function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchCoachList()
})
</script>

<style scoped lang="scss">
.coach-manage {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

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

  .vehicle-tag {
    margin-right: 5px;
  }

  .coach-form {
    padding: 20px;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }
}
</style>
