<template>
  <div class="license-config-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车型科目配置管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增车型配置
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
            <el-option label="N1" value="N1" />
            <el-option label="N2" value="N2" />
            <el-option label="N3" value="N3" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试模式">
          <el-select v-model="searchForm.examMode" placeholder="全部模式" clearable style="width: 120px">
            <el-option label="小汽车" :value="1" />
            <el-option label="特种车辆" :value="2" />
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
      <el-table :data="filteredList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="licenseType" label="车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.licenseType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="80" align="center">
          <template #default="{ row }">
            科目{{ row.subject }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="150" show-overflow-tooltip />
        <el-table-column prop="requiredHours" label="要求学时" width="100" align="center">
          <template #default="{ row }">
            {{ row.requiredHours }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="examItems" label="考试项目" min-width="200" show-overflow-tooltip />
        <el-table-column prop="examMode" label="考试模式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.examMode === 1 ? 'primary' : 'warning'">
              {{ row.examMode === 1 ? '小汽车' : '特种车辆' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="certName" label="获证名称" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.certName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-form-item label="车型" prop="licenseType">
          <el-select v-model="form.licenseType" placeholder="请选择车型" style="width: 100%">
            <el-option label="C1" value="C1" />
            <el-option label="C2" value="C2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
            <el-option label="N1" value="N1" />
            <el-option label="N2" value="N2" />
            <el-option label="N3" value="N3" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-select v-model="form.subject" placeholder="请选择科目" style="width: 100%">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="form.description" placeholder="如：科目二 场地驾驶技能" />
        </el-form-item>
        <el-form-item label="要求学时" prop="requiredHours">
          <el-input-number v-model="form.requiredHours" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="考试项目" prop="examItems">
          <el-input v-model="form.examItems" type="textarea" rows="2" placeholder="多个项目用逗号分隔，如：倒车入库,侧方停车" />
        </el-form-item>
        <el-form-item label="考试模式" prop="examMode">
          <el-radio-group v-model="form.examMode">
            <el-radio :label="1">小汽车（科一~科四）</el-radio>
            <el-radio :label="2">特种车辆（理论+实操）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="获证名称" prop="certName" v-if="form.examMode === 2">
          <el-input v-model="form.certName" placeholder="如：叉车操作证（仅特种车辆填写）" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import { getLicenseConfigList, createLicenseConfig, updateLicenseConfig, deleteLicenseConfig } from '@/api/licenseConfig'

// 搜索表单
const searchForm = reactive({
  licenseType: '',
  examMode: undefined,
})

// 数据列表
const configList = ref([])
const loading = ref(false)

// 过滤后的列表
const filteredList = computed(() => {
  return configList.value.filter(item => {
    if (searchForm.licenseType && item.licenseType !== searchForm.licenseType) return false
    if (searchForm.examMode !== undefined && item.examMode !== searchForm.examMode) return false
    return true
  })
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

// 表单
const form = reactive({
  id: undefined,
  licenseType: '',
  subject: undefined,
  description: '',
  requiredHours: 0,
  examItems: '',
  examMode: 1,
  certName: '',
  sortOrder: 1,
})

// 表单校验规则
const formRules = {
  licenseType: [{ required: true, message: '请选择车型', trigger: 'change' }],
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  description: [{ required: true, message: '请输入说明', trigger: 'blur' }],
  requiredHours: [{ required: true, message: '请输入要求学时', trigger: 'blur' }],
  examMode: [{ required: true, message: '请选择考试模式', trigger: 'change' }],
}

// 获取车型配置列表
async function fetchConfigList() {
  loading.value = true
  try {
    const res = await getLicenseConfigList()
    configList.value = res || []
  } catch (error) {
    console.error('获取车型配置列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  // 前端筛选
}

// 重置
function handleReset() {
  searchForm.licenseType = ''
  searchForm.examMode = undefined
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增车型配置'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑车型配置'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除该车型配置吗？`, '提示', { type: 'warning' })
    await deleteLicenseConfig(row.id)
    ElMessage.success('删除成功')
    fetchConfigList()
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
    const submitData = { ...form }
    if (submitData.examMode === 1) {
      submitData.certName = null
    }

    if (isEdit.value) {
      const { id, ...updateData } = submitData
      await updateLicenseConfig(form.id, updateData)
      ElMessage.success('修改成功')
    } else {
      await createLicenseConfig(submitData)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchConfigList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  form.id = undefined
  form.licenseType = ''
  form.subject = undefined
  form.description = ''
  form.requiredHours = 0
  form.examItems = ''
  form.examMode = 1
  form.certName = ''
  form.sortOrder = 1
}

onMounted(() => {
  fetchConfigList()
})
</script>

<style scoped lang="scss">
.license-config-manage {
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
}
</style>
