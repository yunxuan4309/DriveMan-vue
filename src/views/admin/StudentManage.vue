<template>
  <div class="student-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学员管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增学员
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
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="searchForm.idCard" placeholder="请输入身份证号" clearable />
        </el-form-item>
        <el-form-item label="驾照类型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="结业状态">
          <el-select v-model="searchForm.allPassed" placeholder="全部" clearable style="width: 120px">
            <el-option label="已结业" :value="true" />
            <el-option label="在学中" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="报名状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待审核" :value="0" />
            <el-option label="已报名" :value="1" />
            <el-option label="未通过" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="searchForm.address" placeholder="请输入地址" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="studentList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="idCard" label="身份证号" width="180" show-overflow-tooltip />
        <el-table-column prop="licenseType" label="驾照类型" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.licenseType">{{ row.licenseType }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="结业状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.allPassed" type="success" size="small">已结业</el-tag>
            <el-tag v-else type="info" size="small">在学中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领证日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDateOnly(row.licenseObtainedDate) }}
          </template>
        </el-table-column>
        <el-table-column label="已有驾照" width="140" align="center">
          <template #default="{ row }">
            <template v-if="row.existingLicense">
              {{ row.existingLicense }}
              <span v-if="row.existingLicenseYears">({{ row.existingLicenseYears }}年)</span>
            </template>
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
        class="student-form"
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
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" rows="2" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="驾照类型" prop="licenseType">
          <el-select v-model="form.licenseType" placeholder="请选择驾照类型" style="width: 100%">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">外校学员已有驾照信息（选填）</el-divider>
        <el-form-item label="已有驾照">
          <el-select v-model="form.existingLicense" placeholder="已有驾照类型" clearable style="width: 100%">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="驾龄(年)">
          <el-input-number v-model="form.existingLicenseYears" :min="0" :max="50" :step="0.5" style="width: 100%" />
        </el-form-item>
        <el-form-item label="证明文件">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
            <el-upload
              action=""
              :show-file-list="false"
              :before-upload="handleExistingLicenseUpload"
            >
              <el-button size="small" type="primary">本地上传</el-button>
            </el-upload>
            <el-button size="small" @click="openFilePicker" :disabled="!form.userId">从学员文件选择</el-button>
            <span v-if="form.existingLicenseFileId">
              <el-tag type="success" closable @close="form.existingLicenseFileId = undefined">
                已选文件 #{{ form.existingLicenseFileId }}
              </el-tag>
              <el-button link type="primary" size="small" @click="previewFile(form.existingLicenseFileId)">
                预览
              </el-button>
            </span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 学员文件选择对话框 -->
    <el-dialog v-model="filePickerVisible" title="选择学员已有证明文件" width="600px" destroy-on-close>
      <div v-if="studentFiles.length === 0" style="text-align: center; padding: 32px">
        <el-empty description="该学员暂无已上传的证明文件，请使用本地上传" />
      </div>
      <el-table v-else :data="studentFiles" border stripe @row-click="selectStudentFile" style="cursor: pointer">
        <el-table-column label="文件名" min-width="200">
          <template #default="{ row }">
            {{ row.originalName || row.fileName || '未知文件' }}
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="previewFile(row.id)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="filePickerVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="学员详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="学员ID">{{ currentStudent.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentStudent.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentStudent.realName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentStudent.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentStudent.idCard }}</el-descriptions-item>
        <el-descriptions-item label="驾照类型">{{ currentStudent.licenseType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentStudent.status)">{{ getStatusLabel(currentStudent.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag type="success">学员</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="领证日期">
          {{ formatDateOnly(currentStudent.licenseObtainedDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="已有驾照">
          <template v-if="currentStudent.existingLicense">
            {{ currentStudent.existingLicense }}
            <span v-if="currentStudent.existingLicenseYears">({{ currentStudent.existingLicenseYears }}年)</span>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="驾照证明" v-if="currentStudent.existingLicenseFileId">
          <el-button link type="primary" size="small" @click="previewFile(currentStudent.existingLicenseFileId)">
            查看文件
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentStudent.address }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentStudent.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(currentStudent.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="审核原因" :span="2" v-if="currentStudent.auditReason">
          <span class="text-danger">{{ currentStudent.auditReason }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialogVisible" title="审核学员报名" width="500px">
      <div class="audit-info">
        <p><strong>学员：</strong>{{ currentStudent.realName }} ({{ currentStudent.username }})</p>
        <p><strong>身份证号：</strong>{{ currentStudent.idCard }}</p>
        <p><strong>手机号：</strong>{{ currentStudent.phone }}</p>
        <p><strong>驾照类型：</strong>{{ currentStudent.licenseType }}</p>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, View, Edit, Delete, Check } from '@element-plus/icons-vue'
import { getStudentList, createStudent, updateStudent, deleteStudent, auditRegistration } from '@/api/student'
import { uploadFile, getUserFiles } from '@/api/file'

// 搜索表单
const searchForm = reactive({
  username: '',
  realName: '',
  phone: '',
  idCard: '',
  licenseType: undefined,
  allPassed: undefined,
  status: undefined,
  address: '',
})

import { LICENSE_TYPES } from '@/config/license'

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
})

// 数据列表
const studentList = ref([])
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
  idCard: '',
  phone: '',
  address: '',
  licenseType: '',
  existingLicense: '',
  existingLicenseYears: null,
  existingLicenseFileId: undefined,
})

// 表单校验规则
const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

// 查看详情
const viewDialogVisible = ref(false)
const currentStudent = ref({})

// 文件选择
const filePickerVisible = ref(false)
const studentFiles = ref([])

// 审核
const auditDialogVisible = ref(false)
const auditForm = reactive({
  userId: undefined,
  pass: true,
  reason: '',
})
const auditLoading = ref(false)

// 获取学员列表
async function fetchStudentList() {
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

    const res = await getStudentList(params)
    studentList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取学员列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchStudentList()
}

// 重置
function handleReset() {
  searchForm.username = ''
  searchForm.realName = ''
  searchForm.phone = ''
  searchForm.idCard = ''
  searchForm.licenseType = undefined
  searchForm.allPassed = undefined
  searchForm.status = undefined
  searchForm.address = ''
  pagination.page = 1
  fetchStudentList()
}

// 分页
function handleSizeChange(size) {
  pagination.size = size
  pagination.page = 1
  fetchStudentList()
}

function handlePageChange(page) {
  pagination.page = page
  fetchStudentList()
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增学员'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑学员'
  Object.assign(form, row)
  form.password = '' // 编辑时密码为空
  dialogVisible.value = true
}

// 查看
function handleView(row) {
  currentStudent.value = row
  viewDialogVisible.value = true
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除学员 "${row.realName || row.username}" 吗？此操作不会真正删除数据，只是标记为已删除。`,
      '提示',
      { type: 'warning' }
    )
    await deleteStudent(row.userId)
    ElMessage.success('删除成功')
    fetchStudentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 审核
function handleAudit(row) {
  currentStudent.value = row
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
    fetchStudentList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

// 上传已有驾照证明文件
async function handleExistingLicenseUpload(file) {
  try {
    const res = await uploadFile(form.userId, file, 'existing_license', 'existing_license')
    form.existingLicenseFileId = res.id
    ElMessage.success('证明文件上传成功')
  } catch (e) {
    console.error('上传失败:', e)
  }
  return false // 阻止 el-upload 默认上传
}

// 预览证明文件
function previewFile(fileId) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9500'
  window.open(baseUrl + '/files/' + fileId + '/download?preview=true', '_blank')
}

// 打开学员文件选择器
async function openFilePicker() {
  try {
    const files = await getUserFiles(form.userId)
    studentFiles.value = files
    filePickerVisible.value = true
  } catch (e) {
    console.error('获取学员文件失败:', e)
  }
}

// 选择学员文件
function selectStudentFile(row) {
  form.existingLicenseFileId = row.id
  filePickerVisible.value = false
  ElMessage.success('已选择文件')
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
      await updateStudent(form.userId, updateData)
      ElMessage.success('修改成功')
    } else {
      await createStudent(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchStudentList()
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
  form.idCard = ''
  form.phone = ''
  form.address = ''
  form.licenseType = ''
  form.existingLicense = ''
  form.existingLicenseYears = null
  form.existingLicenseFileId = undefined
}

// 工具函数
function getStatusLabel(status) {
  const map = { 0: '待审核', 1: '已报名', 2: '未通过' }
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

function formatDateOnly(dateTime) {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

onMounted(() => {
  fetchStudentList()
})
</script>

<style scoped lang="scss">
.student-manage {
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

  .student-form {
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
