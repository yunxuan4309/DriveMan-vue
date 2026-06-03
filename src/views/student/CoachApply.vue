<template>
  <div class="coach-apply">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>教练申请</span>
          <el-button type="warning" @click="fetchCoaches">
            <el-icon><Search /></el-icon>查看可申请教练
          </el-button>
        </div>
      </template>

      <!-- 教练列表 -->
      <div v-loading="coachLoading">
        <el-row :gutter="16" v-if="coachList.length > 0">
          <el-col :xs="24" :sm="12" :md="8" v-for="c in coachList" :key="c.coachId" style="margin-bottom: 16px">
            <el-card shadow="hover" class="coach-card">
              <div class="coach-item">
                <div class="coach-avatar">
                  <el-avatar :size="48" icon="UserFilled" />
                </div>
                <div class="coach-info">
                  <h4>{{ c.realName || '未知' }}</h4>
                  <p>
                    <el-tag size="small">{{ c.vehicleType }}</el-tag>
                    <span class="rating-text">
                      <el-icon style="color: #f7ba2a"><StarFilled /></el-icon>
                      {{ c.rating }}
                    </span>
                  </p>
                  <p class="coach-detail">教龄: {{ c.coachYears }}年</p>
                </div>
                <div class="coach-action">
                  <el-button
                    type="warning"
                    size="small"
                    :loading="applyingId === c.coachId"
                    @click="handleApply(c)"
                  >
                    申请
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-empty v-else description="暂无教练数据" />
      </div>
    </el-card>

    <!-- 我的申请记录 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>我的申请记录</span>
      </template>
      <el-table :data="applicationList" v-loading="appLoading" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="coachName" label="教练姓名" width="120" />
        <el-table-column prop="vehicleType" label="准教车型" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 0 ? '待审核' : row.status === 1 ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="审核原因" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.reason">{{ row.reason }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="appPagination.page"
          v-model:page-size="appPagination.size"
          :total="appPagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[5, 10, 20]"
          @size-change="fetchApplications"
          @current-change="fetchApplications"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, StarFilled, UserFilled } from '@element-plus/icons-vue'
import { getCoachList, applyCoach, getStudentApplications } from '@/api/coach'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const coachList = ref([])
const coachLoading = ref(false)
const applyingId = ref(null)

const applicationList = ref([])
const appLoading = ref(false)
const appPagination = reactive({ page: 1, size: 10, total: 0 })

async function fetchCoaches() {
  coachLoading.value = true
  try {
    const res = await getCoachList()
    coachList.value = Array.isArray(res) ? res : res.records || []
  } catch (error) {
    console.error('获取教练列表失败:', error)
  } finally {
    coachLoading.value = false
  }
}

async function fetchApplications() {
  appLoading.value = true
  try {
    const res = await getStudentApplications(userStore.userId)
    applicationList.value = Array.isArray(res) ? res : []
    appPagination.total = applicationList.value.length
  } catch (error) {
    console.error('获取申请记录失败:', error)
  } finally {
    appLoading.value = false
  }
}

async function handleApply(coach) {
  try {
    await ElMessageBox.confirm(
      `确定要申请 "${coach.realName}" 作为您的教练吗？`,
      '确认申请',
      { type: 'info' }
    )
    applyingId.value = coach.coachId
    await applyCoach(userStore.userId, coach.coachId)
    ElMessage.success('申请已提交，等待管理员审核')
    fetchApplications()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('申请失败:', error)
    }
  } finally {
    applyingId.value = null
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  fetchCoaches()
  fetchApplications()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.coach-card {
  cursor: pointer;
  :deep(.el-card__body) {
    padding: 16px;
  }
}
.coach-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.coach-avatar {
  flex-shrink: 0;
}
.coach-info {
  flex: 1;
  min-width: 0;
  h4 { margin: 0 0 4px; font-size: 15px; }
  p { margin: 2px 0; font-size: 13px; color: #666; }
  .rating-text {
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .coach-detail { color: #999; }
}
.coach-action {
  flex-shrink: 0;
}
.text-gray { color: #909399; }
</style>
