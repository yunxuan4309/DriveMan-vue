<template>
  <div class="special-record-page">
    <!-- 禁驾期状态 -->
    <el-card style="margin-bottom: 20px">
      <template #header><span>禁驾期状态</span></template>
      <el-alert
        v-if="banStatusFetched"
        :type="banStatus.inBanPeriod ? 'danger' : 'success'"
        :title="banStatus.inBanPeriod ? '您处于禁驾期' : '当前无禁驾限制'"
        show-icon
        :closable="false"
      >
        <template v-if="banStatus.inBanPeriod">
          <p style="margin: 4px 0">
            禁驾类型：{{ banStatus.banType }}
            <template v-if="banStatus.banEndDate && banStatus.banEndDate !== '终生'">
              ，截止日期：{{ banStatus.banEndDate }}
            </template>
          </p>
          <p style="margin: 4px 0; color: #909399; font-size: 13px">
            禁驾期内无法报名驾照考试或增驾
          </p>
        </template>
      </el-alert>
      <div v-else v-loading="true" style="height: 50px" />
    </el-card>

    <!-- 新增记录 -->
    <el-card style="margin-bottom: 20px">
      <template #header><span>申报特殊记录</span></template>
      <p style="color: #909399; margin-bottom: 16px; font-size: 13px">
        如果您存在犯罪、酒驾、毒驾等记录，请如实申报以便系统自动计算禁驾期。提交后需管理员审核。
      </p>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-form-item label="记录类型" prop="recordType">
          <el-select v-model="form.recordType" placeholder="请选择" style="width: 300px">
            <el-option v-for="(label, val) in recordTypeMap" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item label="违法/犯罪日期" prop="recordDate">
          <el-date-picker v-model="form.recordDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 300px" />
        </el-form-item>
        <el-form-item label="禁驾年限">
          <el-input-number v-model="form.banYears" :min="0" :max="99" :step="1" placeholder="不填=终生禁驾" style="width: 200px" />
          <span style="color: #909399; font-size: 12px; margin-left: 8px">年（留空表示终生禁驾）</span>
        </el-form-item>
        <el-form-item label="法律文书编号" prop="courtDocNo">
          <el-input v-model="form.courtDocNo" placeholder="如判决书编号" style="width: 300px" maxlength="100" />
        </el-form-item>
        <el-form-item label="文书扫描件" prop="courtDocFileId" required>
          <div style="display: flex; gap: 8px; align-items: center">
            <el-upload action="" :show-file-list="false" :before-upload="handleUploadDoc" accept=".jpg,.jpeg,.png,.pdf">
              <el-button type="primary" plain>本地上传</el-button>
            </el-upload>
          </div>
          <div v-if="docFileName" style="margin-top: 6px">
            <el-tag type="success" closable @close="clearDocFile">
              {{ docFileName }}
              <el-button link type="primary" size="small" @click.stop="previewFile(form.courtDocFileId)" style="margin-left: 2px">预览</el-button>
            </el-tag>
          </div>
          <div style="color: #909399; font-size: 12px; margin-top: 4px">支持 JPG/PNG/PDF 格式</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交申报</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的记录 -->
    <el-card>
      <template #header><span>我的申报记录</span></template>

      <el-table :data="records" v-loading="recordsLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="记录类型" width="140" align="center">
          <template #default="{ row }">{{ recordTypeMap[row.recordType] || '未知' }}</template>
        </el-table-column>
        <el-table-column label="违法日期" width="110" align="center">
          <template #default="{ row }">{{ row.recordDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="禁驾年限" width="100" align="center">
          <template #default="{ row }">{{ row.banYears != null ? row.banYears + '年' : '终生' }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="{ 0: 'warning', 1: 'success', 2: 'danger' }[row.auditStatus] || 'info'" size="small">
              {{ { 0: '待审核', 1: '通过', 2: '不通过' }[row.auditStatus] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.auditRemark || '-' }}</template>
        </el-table-column>
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!recordsLoading && records.length === 0" description="暂无申报记录" style="margin-top: 20px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { uploadFile } from '@/api/file'
import { submitSpecialRecord, getMySpecialRecords, getMyBanStatus } from '@/api/specialPersonRecord'

const userStore = useUserStore()

const recordTypeMap = {
  1: '犯罪记录', 2: '饮酒驾驶', 3: '醉酒驾驶',
  4: '吸毒/毒驾', 5: '交通肇事逃逸', 6: '超速/超员构成犯罪',
}

// 禁驾状态
const banStatus = ref({})
const banStatusFetched = ref(false)

// 表单
const formRef = ref()
const form = reactive({ recordType: null, recordDate: '', banYears: null, courtDocNo: '', courtDocFileId: null })
const docFileName = ref('')
const submitLoading = ref(false)
const rules = {
  recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
  recordDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  courtDocNo: [{ required: true, message: '请输入法律文书编号', trigger: 'blur' }],
}

// 记录列表
const records = ref([])
const recordsLoading = ref(false)

async function fetchBanStatus() {
  try {
    banStatus.value = await getMyBanStatus()
  } catch {
    banStatus.value = { inBanPeriod: false }
  } finally {
    banStatusFetched.value = true
  }
}

async function fetchRecords() {
  recordsLoading.value = true
  try {
    const res = await getMySpecialRecords()
    records.value = Array.isArray(res) ? res : []
  } catch {
    records.value = []
  } finally {
    recordsLoading.value = false
  }
}

async function handleUploadDoc(file) {
  try {
    const res = await uploadFile(userStore.userId, file, 'court_doc', 'special_person_record')
    form.courtDocFileId = res.id || res.fileId
    docFileName.value = file.name
    ElMessage.success('上传成功')
  } catch { ElMessage.error('上传失败') }
  return false
}

function clearDocFile() {
  form.courtDocFileId = null
  docFileName.value = ''
}

function previewFile(fileId) {
  if (!fileId) return
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9500'
  window.open(baseUrl + '/files/' + fileId + '/download?preview=true', '_blank')
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.courtDocFileId) {
    ElMessage.warning('请上传法律文书扫描件')
    return
  }
  submitLoading.value = true
  try {
    await submitSpecialRecord(form.recordType, form.recordDate, form.banYears, form.courtDocNo, form.courtDocFileId)
    ElMessage.success('申报已提交，等待管理员审核')
    form.recordType = null; form.recordDate = ''; form.banYears = null; form.courtDocNo = ''
    form.courtDocFileId = null; docFileName.value = ''
    fetchRecords()
    fetchBanStatus()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchBanStatus()
  fetchRecords()
})
</script>

<style scoped lang="scss">
.special-record-page { max-width: 920px; margin: 24px auto; }
</style>
