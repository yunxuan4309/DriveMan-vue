<template>
  <div class="students-manage">
    <el-card>
      <template #header>
        <span>我的学员</span>
      </template>

      <el-table :data="studentList" v-loading="loading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学员姓名" width="120" />
        <el-table-column label="绑定时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.bindTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status !== 0 ? 'success' : 'warning'">
              {{ row.status !== 0 ? '已绑定' : '已解绑' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && studentList.length === 0" description="暂无学员" style="margin-top: 40px" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCoachAssignments } from '@/api/coach'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const studentList = ref([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getCoachAssignments()
    const all = Array.isArray(res) ? res : []
    // 过滤出当前教练的绑定关系
    studentList.value = all.filter(s => s.coachId === userStore.userId && s.status !== 0)
  } catch (error) {
    console.error('获取学员列表失败:', error)
  } finally {
    loading.value = false
  }
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
