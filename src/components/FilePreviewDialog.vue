<template>
  <el-dialog
    v-model="previewVisible"
    title="文件预览"
    width="70%"
    top="5vh"
    destroy-on-close
    @closed="handleClose"
    class="file-preview-dialog"
  >
    <div v-loading="previewLoading" class="preview-body">
      <img v-if="previewType === 'image'" :src="previewSrc" class="preview-image" alt="预览" @click.stop />
      <iframe v-else-if="previewType === 'pdf'" :src="previewSrc" class="preview-iframe" />
      <el-empty v-else description="暂不支持预览该文件类型" />
    </div>
  </el-dialog>
</template>

<script setup>
import { useFilePreview } from '@/composables/useFilePreview'

const { previewVisible, previewSrc, previewType, previewLoading, closePreview } = useFilePreview()

function handleClose() {
  closePreview()
}
</script>

<style scoped lang="scss">
.preview-body {
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-iframe {
  width: 100%;
  height: 70vh;
  border: none;
}

:deep(.el-dialog__body) {
  padding: 12px 20px;
}
</style>
