<template>
  <div class="disability-info">
    <el-card>
      <template #header>
        <span>C5 残疾信息</span>
      </template>

      <!-- 加载中 -->
      <div v-if="loading" v-loading="true" style="height: 100px" />

      <!-- 已提交 → 显示审核结果 -->
      <template v-else-if="submittedInfo">
        <el-alert
          :type="statusAlertType"
          :title="statusAlertTitle"
          :description="statusAlertDesc"
          show-icon
          :closable="false"
          class="status-alert"
        />

        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="残疾类型">
            {{ disabilityTypeMap[submittedInfo.disabilityType] || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="残疾人证号">{{ submittedInfo.certificateNo }}</el-descriptions-item>
          <el-descriptions-item label="证件扫描件">
            <el-button link type="primary" size="small" @click="previewFile(submittedInfo.certificateFileId)">
              查看
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatTime(submittedInfo.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="审核备注" v-if="submittedInfo.auditRemark">
            {{ submittedInfo.auditRemark }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 未提交 → 显示表单 -->
      <template v-else>
        <p style="color: #909399; margin-bottom: 16px">
          报考 C5（残疾人专用小型自动挡）车型需要提交残疾信息及残疾人证扫描件，管理员审核通过后方可继续。
        </p>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
          <el-form-item label="残疾类型" prop="disabilityType">
            <el-select v-model="form.disabilityType" placeholder="请选择残疾类型" style="width: 300px">
              <el-option v-for="(label, val) in disabilityTypeMap" :key="val" :label="label" :value="Number(val)" />
            </el-select>
          </el-form-item>
          <el-form-item label="残疾人证号" prop="certificateNo">
            <el-input v-model="form.certificateNo" placeholder="请输入残疾人证号" style="width: 300px" maxlength="50" />
          </el-form-item>
          <el-form-item label="证件扫描件" prop="certificateFileId" required>
            <div style="display: flex; gap: 8px; align-items: center">
              <el-upload
                action=""
                :show-file-list="false"
                :before-upload="handleUploadCert"
                accept=".jpg,.jpeg,.png,.pdf"
              >
                <el-button type="primary" plain>本地上传</el-button>
              </el-upload>
              <el-button type="primary" plain @click="openMyFilesPicker">从我的文件选择</el-button>
            </div>
            <div v-if="certFileName" style="margin-top: 6px">
              <el-tag type="success" closable @close="clearCertFile">
                {{ certFileName }}
                <el-button link type="primary" size="small" @click.stop="previewFile(form.certificateFileId)" style="margin-left: 2px">
                  预览
                </el-button>
              </el-tag>
            </div>
            <div style="color: #909399; font-size: 12px; margin-top: 4px">支持 JPG/PNG/PDF 格式</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交</el-button>
          </el-form-item>
        </el-form>
      </template>
    </el-card>

    <!-- 我的文件选择器 -->
    <el-dialog v-model="filePickerVisible" title="从我的文件选择" width="650px" destroy-on-close>
      <div v-if="myFiles.length === 0" style="text-align: center; padding: 32px">
        <el-empty description="暂无已上传文件" />
      </div>
      <template v-else>
        <el-table ref="fileTableRef" :data="myFiles" border stripe @selection-change="onFileSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="文件名" min-width="200">
            <template #default="{ row }">{{ row.originalName || row.fileName || '未知' }}</template>
          </el-table-column>
          <el-table-column label="上传时间" width="160">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 10px; text-align: right; color: #909399; font-size: 13px">
          已选 {{ pickedFiles.length }} 个文件
        </div>
      </template>
      <template #footer>
        <el-button @click="filePickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="pickedFiles.length === 0" @click="confirmPickFile">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useFilePreview } from '@/composables/useFilePreview'
import { uploadFile, getMyFiles } from '@/api/file'
import { submitDisabilityInfo, getMyDisabilityInfo } from '@/api/disabilityInfo'

const userStore = useUserStore()

const disabilityTypeMap = {
  1: '右下肢残疾', 2: '双下肢残疾', 3: '右手残疾',
  4: '听力障碍', 5: '左手残疾', 9: '其他',
}

const loading = ref(true)
const submittedInfo = ref(null)
const submitLoading = ref(false)

const formRef = ref()
const form = reactive({ disabilityType: null, certificateNo: '', certificateFileId: null })
const certFileName = ref('')
const rules = {
  disabilityType: [{ required: true, message: '请选择残疾类型', trigger: 'change' }],
  certificateNo: [{ required: true, message: '请输入残疾人证号', trigger: 'blur' }],
}

// 文件选择器
const filePickerVisible = ref(false)
const myFiles = ref([])
const pickedFiles = ref([])
const fileTableRef = ref(null)

const statusAlertType = computed(() => {
  if (!submittedInfo.value) return 'info'
  return { 0: 'warning', 1: 'success', 2: 'danger' }[submittedInfo.value.auditStatus] || 'info'
})
const statusAlertTitle = computed(() => {
  if (!submittedInfo.value) return ''
  return { 0: '审核中', 1: '审核通过', 2: '审核不通过' }[submittedInfo.value.auditStatus] || '未知'
})
const statusAlertDesc = computed(() => {
  if (!submittedInfo.value) return ''
  if (submittedInfo.value.auditStatus === 0) return '您的残疾信息已提交，请等待管理员审核'
  if (submittedInfo.value.auditStatus === 1) return '残疾信息已审核通过，您可以继续后续报名/增驾流程'
  return submittedInfo.value.auditRemark || '审核不通过，请联系管理员'
})

async function fetchMyInfo() {
  loading.value = true
  try {
    const res = await getMyDisabilityInfo()
    submittedInfo.value = res
  } catch {
    submittedInfo.value = null
  } finally {
    loading.value = false
  }
}

// 本地上传证件
async function handleUploadCert(file) {
  try {
    const res = await uploadFile(userStore.userId, file, 'disability_cert', 'disability_info')
    form.certificateFileId = res.id || res.fileId
    certFileName.value = file.name
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
  return false
}

// 从文件选择器
async function openMyFilesPicker() {
  try {
    const res = await getMyFiles()
    myFiles.value = Array.isArray(res) ? res : res.records || []
    pickedFiles.value = []
    if (fileTableRef.value) fileTableRef.value.clearSelection()
    filePickerVisible.value = true
  } catch { /* ignore */ }
}
function onFileSelectionChange(sel) { pickedFiles.value = sel }
function confirmPickFile() {
  const f = pickedFiles.value[0]
  if (f) {
    form.certificateFileId = f.id || f.fileId
    certFileName.value = f.originalName || f.fileName || '文件'
  }
  filePickerVisible.value = false
}
function clearCertFile() {
  form.certificateFileId = null
  certFileName.value = ''
}

function previewFile(fileId) {
  const { previewFile: doPreview } = useFilePreview()
  doPreview(fileId)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.certificateFileId) {
    ElMessage.warning('请上传残疾人证扫描件')
    return
  }
  submitLoading.value = true
  try {
    const res = await submitDisabilityInfo(form.disabilityType, form.certificateNo, form.certificateFileId)
    submittedInfo.value = res
    ElMessage.success('残疾信息已提交，请等待管理员审核')
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

onMounted(fetchMyInfo)
</script>

<style scoped lang="scss">
.disability-info { max-width: 720px; margin: 24px auto; }
.status-alert { margin-bottom: 16px; }
</style>
