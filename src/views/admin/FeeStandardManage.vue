<template>
  <div class="fee-standard-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用标准管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增费用标准
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="车型">
          <el-select v-model="searchForm.licenseType" placeholder="全部车型" clearable style="width: 120px" @change="handleSearch">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
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
      <el-table :data="feeList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="licenseType" label="车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.licenseType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.subject">科目{{ row.subject }}</span>
            <el-tag v-else type="success">全包套餐</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
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

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :total="total" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]" @size-change="handleSearch" @current-change="fetchFeeList" />
      </div>

      <el-empty v-if="!loading && feeList.length === 0" description="暂无记录" style="margin-top: 40px" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="车型" prop="licenseType">
          <el-select v-model="form.licenseType" placeholder="请选择车型" style="width: 100%">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-select v-model="form.subject" placeholder="请选择科目（空表示全包套餐）" clearable style="width: 100%">
            <el-option label="科目一" :value="1" />
            <el-option label="科目二" :value="2" />
            <el-option label="科目三" :value="3" />
            <el-option label="科目四" :value="4" />
          </el-select>
          <div class="form-tip">不选择表示全包套餐</div>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入费用说明" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import { getFeeStandardList, createFeeStandard, updateFeeStandard, deleteFeeStandard } from '@/api/feeStandard'

// 搜索表单
const searchForm = reactive({
  licenseType: '',
})

import { LICENSE_TYPES } from '@/config/license'

// 数据列表
const feeList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })

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
  amount: 0,
  description: '',
})

// 表单校验规则
const formRules = {
  licenseType: [{ required: true, message: '请选择车型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  description: [{ required: true, message: '请输入说明', trigger: 'blur' }],
}

// 获取费用标准列表
async function fetchFeeList() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    if (searchForm.licenseType) params.licenseType = searchForm.licenseType
    const res = await getFeeStandardList(params)
    feeList.value = Array.isArray(res) ? res : res.records || []
    total.value = res.total || feeList.value.length
  } catch (error) {
    console.error('获取费用标准列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchFeeList()
}

// 重置
function handleReset() {
  searchForm.licenseType = ''
  pagination.page = 1
  fetchFeeList()
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增费用标准'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑费用标准'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除该费用标准吗？`, '提示', { type: 'warning' })
    await deleteFeeStandard(row.id)
    ElMessage.success('删除成功')
    fetchFeeList()
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
      const { id, ...updateData } = form
      await updateFeeStandard(form.id, updateData)
      ElMessage.success('修改成功')
    } else {
      await createFeeStandard(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchFeeList()
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
  form.amount = 0
  form.description = ''
}

onMounted(() => {
  fetchFeeList()
})
</script>

<style scoped lang="scss">
.fee-standard-manage {
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

  .amount {
    color: #f56c6c;
    font-weight: bold;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
