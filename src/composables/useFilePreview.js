import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { downloadFile } from '@/api/file'

const previewVisible = ref(false)
const previewSrc = ref('')
const previewType = ref('')
const previewLoading = ref(false)

export function useFilePreview() {
  async function previewFile(fileId) {
    if (!fileId) return
    previewLoading.value = true
    previewVisible.value = true
    try {
      const res = await downloadFile(fileId, true)
      const blob = new Blob([res])
      const url = URL.createObjectURL(blob)
      previewSrc.value = url
      previewType.value = res.type?.startsWith('image/') ? 'image' : 'pdf'
    } catch {
      ElMessage.error('文件预览失败')
      previewVisible.value = false
    } finally {
      previewLoading.value = false
    }
  }

  function closePreview() {
    previewVisible.value = false
    if (previewSrc.value) {
      URL.revokeObjectURL(previewSrc.value)
    }
    previewSrc.value = ''
    previewType.value = ''
  }

  return { previewVisible, previewSrc, previewType, previewLoading, previewFile, closePreview }
}
