<template>
  <div class="venue-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>场地管理</span>
            <el-tag type="info" size="small" style="margin-left: 10px">{{ venueTypeLabel }}</el-tag>
          </div>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增{{ venueTypeLabel }}
          </el-button>
        </div>
      </template>

      <!-- 场地类型切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="venue-tabs">
        <el-tab-pane label="考场" name="1" />
        <el-tab-pane label="训练场地" name="2" />
        <el-tab-pane label="体检地点" name="3" />
      </el-tabs>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="名称/地址搜索" clearable style="width: 200px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="venueList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="capacity" label="容纳人数" width="90" align="center">
          <template #default="{ row }">
            {{ row.capacity ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="facilities" label="设施说明" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.facilities || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
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
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSearch"
          @current-change="fetchVenueList"
        />
      </div>

      <el-empty v-if="!loading && venueList.length === 0" :description="`暂无${venueTypeLabel}`" style="margin-top: 40px" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="场地名称" prop="name">
          <el-input v-model="form.name" :placeholder="`请输入${venueTypeLabel}名称`" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" rows="2" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="容纳人数" prop="capacity">
          <el-input-number v-model="form.capacity" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设施说明" prop="facilities">
          <el-input v-model="form.facilities" type="textarea" rows="2" placeholder="如：配备空调、候考室" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { getVenueList, createVenue, updateVenue, deleteVenue } from '@/api/venue'

const activeTab = ref('1')
const venueList = ref([])
const loading = ref(false)
const total = ref(0)
const pagination = reactive({ page: 1, size: 10 })

const venueTypeLabel = computed(() => {
  const map = { 1: '考场', 2: '训练场地', 3: '体检地点' }
  return map[activeTab.value] || '场地'
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)

const form = reactive({
  id: undefined,
  name: '',
  address: '',
  contactPhone: '',
  capacity: 50,
  facilities: '',
  status: 1,
})

const formRules = {
  name: [{ required: true, message: '请输入场地名称', trigger: 'blur' }],
}

async function fetchVenueList() {
  loading.value = true
  try {
    const params = {
      venueType: Number(activeTab.value),
      keyword: searchForm.keyword || undefined,
      page: pagination.page,
      pageSize: pagination.size,
    }
    const res = await getVenueList(params)
    venueList.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取场地列表失败:', error)
    venueList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchVenueList()
}

function handleReset() {
  searchForm.keyword = ''
  handleSearch()
}

function handleTabChange() {
  handleSearch()
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = `新增${venueTypeLabel.value}`
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = `编辑${venueTypeLabel.value}`
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除"${row.name}"吗？`, '提示', { type: 'warning' })
    await deleteVenue(row.id)
    ElMessage.success('删除成功')
    fetchVenueList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      const { id, ...updateData } = form
      await updateVenue(form.id, updateData)
      ElMessage.success('修改成功')
    } else {
      await createVenue({ ...form, venueType: Number(activeTab.value) })
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

function resetForm() {
  form.id = undefined
  form.name = ''
  form.address = ''
  form.contactPhone = ''
  form.capacity = 50
  form.facilities = ''
  form.status = 1
}

onMounted(fetchVenueList)
</script>

<style scoped lang="scss">
.venue-manage {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
    }
  }

  .venue-tabs {
    margin-bottom: 10px;
  }

  .search-form {
    margin-bottom: 16px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
