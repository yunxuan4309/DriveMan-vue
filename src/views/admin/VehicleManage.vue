<template>
  <div class="vehicle-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车辆管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增车辆
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.plateNumber" placeholder="车牌号" clearable style="width: 130px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="searchForm.brand" placeholder="品牌" clearable style="width: 120px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.vehicleType" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.model" placeholder="型号" clearable style="width: 120px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="座位数">
          <el-input-number v-model="searchForm.seats" :min="0" :max="50" :step="1" controls-position="right" style="width: 120px" placeholder="不限" @change="fetchList" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px" @change="fetchList">
            <el-option label="空闲" :value="1" />
            <el-option label="使用中" :value="2" />
            <el-option label="维修" :value="3" />
            <el-option label="报废" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="vehicleList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="plateNumber" label="车牌号" width="130" />
        <el-table-column prop="vehicleType" label="车型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.vehicleType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="seats" label="座位" width="60" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remarks || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="form.plateNumber" placeholder="如：渝A·C1001" />
        </el-form-item>
        <el-form-item label="车型" prop="vehicleType">
          <el-select v-model="form.vehicleType" placeholder="请选择" style="width: 100%">
            <el-option v-for="lt in LICENSE_TYPES" :key="lt.value" :label="lt.label" :value="lt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="form.brand" placeholder="如：大众" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="form.model" placeholder="如：桑塔纳" />
        </el-form-item>
        <el-form-item label="座位数">
          <el-input-number v-model="form.seats" :min="1" :max="50" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
            <el-option label="空闲" :value="1" />
            <el-option label="使用中" :value="2" />
            <el-option label="维修" :value="3" />
            <el-option label="报废" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" rows="2" placeholder="可选备注" />
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
import { Plus, Search } from '@element-plus/icons-vue'
import { getVehicleList, createVehicle, updateVehicle, deleteVehicle } from '@/api/vehicle'

const vehicleList = ref([])
const loading = ref(false)
const total = ref(0)

const searchForm = reactive({ page: 1, size: 10, vehicleType: '', status: undefined, plateNumber: '', brand: '', model: '', seats: undefined })
import { LICENSE_TYPES } from '@/config/license'
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

const form = reactive({
  id: undefined, plateNumber: '', vehicleType: '', brand: '', model: '',
  seats: 5, status: 1, remarks: '',
})

const formRules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  vehicleType: [{ required: true, message: '请选择车型', trigger: 'change' }],
}

async function fetchList() {
  loading.value = true
  try {
    const params = { page: searchForm.page, size: searchForm.size }
    if (searchForm.vehicleType) params.vehicleType = searchForm.vehicleType
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.plateNumber) params.plateNumber = searchForm.plateNumber
    if (searchForm.brand) params.brand = searchForm.brand
    if (searchForm.model) params.model = searchForm.model
    if (searchForm.seats) params.seats = searchForm.seats
    const res = await getVehicleList(params)
    vehicleList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取车辆列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.page = 1
  searchForm.vehicleType = ''
  searchForm.status = undefined
  searchForm.plateNumber = ''
  searchForm.brand = ''
  searchForm.model = ''
  searchForm.seats = undefined
  fetchList()
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增车辆'
  Object.assign(form, { id: undefined, plateNumber: '', vehicleType: '', brand: '', model: '', seats: 5, status: 1, remarks: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑车辆'
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除车辆"${row.plateNumber}"？`, '提示', { type: 'warning' })
    await deleteVehicle(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') console.error('删除失败:', error)
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (isEdit.value) {
      const { id, ...data } = form
      await updateVehicle(form.id, data)
      ElMessage.success('修改成功')
    } else {
      await createVehicle(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

function getStatusTag(status) {
  return { 1: 'success', 2: 'primary', 3: 'warning', 4: 'info' }[status] || 'info'
}

function getStatusText(status) {
  return { 1: '空闲', 2: '使用中', 3: '维修', 4: '报废' }[status] || '未知'
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }
.search-form { margin-bottom: 10px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
