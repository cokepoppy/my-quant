<template>
  <div class="error-container">
    <div class="error-box">
      <div class="error-icon">
        <el-icon size="80"><warning /></el-icon>
      </div>
      <h1>403</h1>
      <h2>权限不足</h2>
      <p>抱歉，您没有权限访问此页面</p>
      <div class="error-actions">
        <el-button type="primary" @click="goBack">
          <el-icon><arrow-left /></el-icon>
          返回上页
        </el-button>
        <el-button @click="goHome">
          <el-icon><home-filled /></el-icon>
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Warning, ArrowLeft, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.error-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-box h1 {
  font-size: 72px;
  color: #f56c6c;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.error-box h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.error-box p {
  color: #666;
  font-size: 16px;
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.error-actions .el-button {
  padding: 12px 24px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .error-container {
    padding: 10px;
  }
  
  .error-box {
    padding: 30px 20px;
  }
  
  .error-box h1 {
    font-size: 60px;
  }
  
  .error-box h2 {
    font-size: 20px;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-actions .el-button {
    width: 100%;
  }
}
</style>