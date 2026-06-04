<template>
  <div class="students-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的学员</span>
          <el-button type="warning" @click="$router.push('/coach/student-transfer')">
            <el-icon><Refresh /></el-icon>学员移交
          </el-button>
        </div>
      </template>

      <el-table :data="studentList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="学员姓名" width="100" align="center" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="idCard" label="身份证号" width="180" show-overflow-tooltip />
        <el-table-column prop="licenseType" label="报考车型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.licenseType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.bindTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="warning" size="small" @click="handleTransfer(row)">移交</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && studentList.length === 0" description="暂无学员" style="margin-top: 40px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { getMyStudents } from '@/api/coach'

const router = useRouter()
const studentList = ref([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getMyStudents()
    if (res && res.students) {
      studentList.value = res.students
    } else if (Array.isArray(res)) {
      studentList.value = res
    } else {
      studentList.value = []
    }
  } catch (error) {
    console.error('获取学员列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleTransfer(row) {
  router.push({
    path: '/coach/student-transfer',
    query: { studentId: row.studentId, studentName: row.realName },
  })
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
