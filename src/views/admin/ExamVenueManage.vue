<template>
  <div class="exam-venue-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考场信息管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增考场
          </el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="venueList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="考场名称" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="contactPhone" label="联系电话" width="140" />
        <el-table-column prop="capacity" label="容纳人数" width="100" align="center" />
        <el-table-column prop="facilities" label="设施说明" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="考场名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入考场名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" rows="2" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="容纳人数" prop="capacity">
          <el-input-number v-model="form.capacity" :min="1" :max="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设施说明" prop="facilities">
          <el-input v-model="form.facilities" type="textarea" rows="2" placeholder="请输入设施说明" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getExamVenueList, createExamVenue, updateExamVenue, deleteExamVenue } from '@/api/examVenue'

// 数据列表
const venueList = ref([])
const loading = ref(false)

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

// 表单
const form = reactive({
  id: undefined,
  name: '',
  address: '',
  contactPhone: '',
  capacity: 100,
  facilities: '',
  status: 1,
})

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '请输入考场名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

// 获取考场列表
async function fetchVenueList() {
  loading.value = true
  try {
    const res = await getExamVenueList()
    venueList.value = res || []
  } catch (error) {
    console.error('获取考场列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增
function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增考场'
  resetForm()
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑考场'
  Object.assign(form, row)
  dialogVisible.value = true
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除考场 "${row.name}" 吗？`, '提示', { type: 'warning' })
    await deleteExamVenue(row.id)
    ElMessage.success('删除成功')
    fetchVenueList()
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
      await updateExamVenue(form.id, updateData)
      ElMessage.success('修改成功')
    } else {
      await createExamVenue(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchVenueList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  form.id = undefined
  form.name = ''
  form.address = ''
  form.contactPhone = ''
  form.capacity = 100
  form.facilities = ''
  form.status = 1
}

onMounted(() => {
  fetchVenueList()
})
</script>

<style scoped lang="scss">
.exam-venue-manage {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
