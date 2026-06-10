<template>
  <div class="student-progress">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学习进度</span>
          <el-button text type="primary" @click="fetchProgress" :icon="Refresh" :loading="loading">刷新</el-button>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 无数据 -->
        <el-empty v-if="!loading && !progress" description="暂无学习进度" />

        <template v-if="progress">
          <!-- 学员信息 -->
          <el-alert
            v-if="progress.allPassed && progress.certificate"
            :title="`恭喜！已完成全部科目，可结业领证（${progress.certName || progress.certificate}）`"
            type="success"
            show-icon
            :closable="false"
            style="margin-bottom: 20px"
          />

          <el-descriptions :column="3" border style="margin-bottom: 20px">
            <el-descriptions-item label="学员">{{ progress.realName }}</el-descriptions-item>
            <el-descriptions-item label="报名车型">
              <el-tag size="small">{{ progress.licenseType }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="考试模式">
              <el-tag :type="progress.examMode === 2 ? 'warning' : 'primary'" size="small">
                {{ progress.examMode === 2 ? '特种车辆（2科）' : '小汽车（4科）' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <!-- 整体进度条 -->
          <div style="margin-bottom: 24px">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px">
              <span style="font-size: 14px; color: #606266">整体进度</span>
              <span style="font-size: 14px; font-weight: 600">{{ progress.progressPercent }}%</span>
            </div>
            <el-progress :percentage="progress.progressPercent" :color="progress.allPassed ? '#67c23a' : '#409eff'" />
          </div>

          <!-- 科目列表 -->
          <div class="subject-grid">
            <div v-for="sub in progress.subjects" :key="sub.subject" class="subject-card">
              <div class="subject-header">
                <span class="subject-title">{{ sub.description || '科目' + sub.subject }}</span>
                <el-tag :type="getSubjectStatusTag(sub.status)" size="small">
                  {{ getSubjectStatusText(sub.status) }}
                </el-tag>
              </div>

              <div class="subject-body">
                <div class="subject-info">
                  <div class="info-row">
                    <span class="info-label">已学/需学</span>
                    <span class="info-value">{{ sub.trainedHours }}/{{ sub.requiredHours }} 小时</span>
                  </div>
                  <div class="info-row" v-if="sub.score != null">
                    <span class="info-label">成绩</span>
                    <span class="info-value" :style="{ color: sub.score >= 90 ? '#67c23a' : '#f56c6c' }">
                      {{ sub.score }} 分
                    </span>
                  </div>
                  <div class="info-row" v-if="sub.remainingHours > 0">
                    <span class="info-label">剩余学时</span>
                    <span class="info-value">{{ sub.remainingHours }} 小时</span>
                  </div>
                </div>

                <!-- 考试项目 -->
                <div v-if="sub.examItems && sub.examItems.length > 0" class="exam-items">
                  <div class="items-title">考试项目：</div>
                  <div class="items-tags">
                    <el-tag v-for="(item, i) in sub.examItems" :key="i" size="small" type="info" effect="plain" style="margin: 2px 4px 2px 0">
                      {{ item }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getStudentProgress } from '@/api/student'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const progress = ref(null)
const loading = ref(false)

async function fetchProgress() {
  loading.value = true
  try {
    const res = await getStudentProgress(userStore.userId)
    progress.value = res || null
  } catch (error) {
    console.error('获取学习进度失败:', error)
    progress.value = null
  } finally {
    loading.value = false
  }
}

function getSubjectStatusTag(status) {
  const map = { passed: 'success', learning: 'primary', failed: 'danger', pending: 'info' }
  return map[status] || 'info'
}

function getSubjectStatusText(status) {
  const map = { passed: '已通过', learning: '学习中', failed: '未通过', pending: '未开始' }
  return map[status] || '未知'
}

onMounted(fetchProgress)
</script>

<style scoped lang="scss">
.card-header { display: flex; justify-content: space-between; align-items: center; }

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.subject-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.subject-title {
  font-size: 15px;
  font-weight: 600;
}

.subject-body {
  padding: 16px;
}

.subject-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.info-label {
  color: #909399;
}

.info-value {
  font-weight: 600;
}

.exam-items {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.items-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.items-tags {
  display: flex;
  flex-wrap: wrap;
}
</style>
