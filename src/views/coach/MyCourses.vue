<template>
  <div class="my-courses">
    <el-card>
      <template #header>
        <span>我的课程</span>
      </template>

      <!-- 按日期分组展示 -->
      <div v-loading="loading">
        <template v-if="courseList.length > 0">
          <el-timeline>
            <el-timeline-item
              v-for="item in courseList"
              :key="item.id"
              :timestamp="formatDateTime(item.startTime)"
              placement="top"
            >
              <el-card shadow="hover">
                <div class="course-item">
                  <div class="course-info">
                    <p>
                      <strong>{{ item.studentName || '未知学员' }}</strong>
                      <el-tag size="small" :type="item.status === 0 ? 'success' : 'danger'" style="margin-left: 8px">
                        {{ item.status === 0 ? '已预约' : '已取消' }}
                      </el-tag>
                    </p>
                    <p class="time-range">
                      {{ formatTime(item.startTime) }} ~ {{ formatTime(item.endTime) }}
                    </p>
                    <p v-if="item.cancelReason" class="cancel-reason">
                      取消原因：{{ item.cancelReason }}
                    </p>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </template>
        <el-empty v-else description="暂无课程安排" />
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="total, prev, pager, next"
          :page-sizes="[5, 10, 20]"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAppointmentList } from '@/api/appointment'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const courseList = ref([])
const loading = ref(false)
const pagination = reactive({ page: 1, size: 10, total: 0 })

async function fetchList() {
  loading.value = true
  try {
    const res = await getAppointmentList({
      page: pagination.page,
      size: pagination.size,
      coachId: userStore.userId,
    })
    courseList.value = res.records || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取课程列表失败:', error)
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

function formatTime(dateTime) {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN', {
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.course-item {
  .course-info {
    p { margin: 4px 0; }
    .time-range {
      font-size: 14px;
      color: #666;
    }
    .cancel-reason {
      font-size: 13px;
      color: #f56c6c;
    }
  }
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
