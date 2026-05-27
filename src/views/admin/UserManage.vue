<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理（学员管理）</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="searchForm.realName" placeholder="请输入真实姓名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部角色" clearable style="width: 120px">
            <el-option label="学员" :value="1" />
            <el-option label="教练" :value="2" />
            <el-option label="管理员" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="未通过" :value="2" />
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
      <el-table :data="userList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="idCard" label="身份证号" width="180" show-overflow-tooltip />
        <el-table-column prop="licenseType" label="驾照类型" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.licenseType">{{ row.licenseType }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button v-if="row.status === 0" link type="success" size="small" @click="handleAudit(row)">
              <el-icon><Check /></el-icon>审核
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
        label-width="100px"
        class="user-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio :label="1">学员</el-radio>
            <el-radio :label="2">教练</el-radio>
            <el-radio :label="3">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" rows="2" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="驾照类型" prop="licenseType" v-if="form.role === 1">
          <el-select v-model="form.licenseType" placeholder="请选择驾照类型" style="width: 100%">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ currentUser.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.realName }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="getRoleType(currentUser.role)">{{ getRoleLabel(currentUser.role) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentUser.idCard }}</el-descriptions-item>
        <el-descriptions-item label="驾照类型">{{ currentUser.licenseType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentUser.status)">{{ getStatusLabel(currentUser.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentUser.address }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentUser.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(currentUser.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="审核原因" :span="2" v-if="currentUser.auditReason">
          <span class="text-danger">{{ currentUser.auditReason }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核学员报名" width="500px">
      <div class="audit-info">
        <p><strong>学员：</strong>{{ currentUser.realName }} ({{ currentUser.username }})</p>
        <p><strong>身份证号：</strong>{{ currentUser.idCard }}</p>
        <p><strong>手机号：</strong>{{ currentUser.phone }}</p>
        <p><strong>驾照类型：</strong>{{ currentUser.licenseType }}</p>
      </div>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果" prop="pass">
          <el-radio-group v-model="auditForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="原因" prop="reason" v-if="auditForm.pass === false">
          <el-input v-model="auditForm.reason" type="textarea" rows="3" placeholder="请输入不通过原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit" :loading="auditLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, View, Edit, Delete, Check } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, deleteUser, auditRegistration } from '@/api/user'

// 搜索表单
const searchForm = reactive({
  username: '',
  realName: '',
  role: undefined,
  status: undefined,
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
})

// 数据列表
const userList = ref([])
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

// 表单
const form = reactive({
  userId: undefined,
  username: '',
  password: '',
  realName: '',
  role: 1,
  idCard: '',
  phone: '',
  address: '',
  licenseType: '',
})

// 表单校验规则
const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

// 查看详情
const viewDialogVisible = ref(false)
const currentUser = ref({})

// 审核
const auditDialogVisible = ref(false)
const auditForm = reactive({
  userId: undefined,
  pass: true,
  reason: '',
})
const auditLoading = ref(false)

// 获取用户列表
async function fetchUserList() {
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

    const res = await getUserList(params)
    userList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchUserList()
}

// 重置
function handleReset() {
  searchForm.username = ''
  searchForm.realName = ''
  searchForm.role = undefined
  searchForm.status = undefined
  pagination.page = 1
  fetchUserList()
}

// 分页
function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchUserList()
}

function handlePageChange(page) {
  pagination.page = page
  fetchUserList()
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  Object.assign(form, row)
  form.password = '' // 编辑时密码为空
  dialogVisible.value = true
}

// 查看
function handleView(row) {
  currentUser.value = row
  viewDialogVisible.value = true
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.realName || row.username}" 吗？此操作不会真正删除数据，只是标记为已删除。`,
      '提示',
      { type: 'warning' }
    )
    await deleteUser(row.userId)
    ElMessage.success('删除成功')
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 审核
function handleAudit(row) {
  currentUser.value = row
  auditForm.userId = row.userId
  auditForm.pass = true
  auditForm.reason = ''
  auditDialogVisible.value = true
}

// 提交审核
async function handleAuditSubmit() {
  if (auditForm.pass === false && !auditForm.reason) {
    ElMessage.warning('请输入不通过原因')
    return
  }
  auditLoading.value = true
  try {
    await auditRegistration(auditForm.userId, auditForm.pass, auditForm.reason)
    ElMessage.success(auditForm.pass ? '审核通过' : '已拒绝')
    auditDialogVisible.value = false
    fetchUserList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      // 编辑时过滤掉不需要的字段
      const { userId, password, ...updateData } = form
      await updateUser(form.userId, updateData)
      ElMessage.success('修改成功')
    } else {
      await createUser(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchUserList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  form.userId = undefined
  form.username = ''
  form.password = ''
  form.realName = ''
  form.role = 1
  form.idCard = ''
  form.phone = ''
  form.address = ''
  form.licenseType = ''
}

// 工具函数
function getRoleLabel(role) {
  const map = { 1: '学员', 2: '教练', 3: '管理员' }
  return map[role] || '未知'
}

function getRoleType(role) {
  const map = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[role] || 'info'
}

function getStatusLabel(status) {
  const map = { 0: '待审核', 1: '已通过', 2: '未通过' }
  return map[status] || '未知'
}

function getStatusType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

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
  fetchUserList()
})
</script>

<style scoped lang="scss">
.user-manage {
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

  .text-gray {
    color: #909399;
  }

  .text-danger {
    color: #f56c6c;
  }

  .user-form {
    padding: 20px;
  }

  .audit-info {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;

    p {
      margin: 8px 0;
    }
  }
}
</style>
