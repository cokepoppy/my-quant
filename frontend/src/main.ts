import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import router from "@/router";
import App from "@/App.vue";

// 导入自定义样式
import "@/styles/bloomberg-theme.css";
import "@/styles/premium.css";

// 创建应用实例
const app = createApp(App);

// 创建Pinia实例
const pinia = createPinia();

// 注册全局Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用插件
app.use(pinia);
app.use(router);
app.use(ElementPlus, {
  size: "default",
  zIndex: 3000,
});

// 挂载应用
app.mount("#app");

// 全局错误处理
app.config.errorHandler = (error, instance, info) => {
  console.error("Global error:", error);
  console.error("Component instance:", instance);
  console.error("Error info:", info);
};

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
  console.warn("Global warning:", msg);
  console.warn("Component instance:", instance);
  console.warn("Trace:", trace);
};

// 开发环境配置
if (import.meta.env.DEV) {
  app.config.performance = true;
  console.log("🚀 Vue app started in development mode");
  console.log("📍 Router:", router);
  console.log("📍 Pinia:", pinia);
  console.log("📍 Current URL:", window.location.href);
  console.log("📍 Current path:", window.location.pathname);
}

// 生产环境配置
if (import.meta.env.PROD) {
  console.log("🚀 Vue app started in production mode");
}

// 导出应用实例（用于测试）
export default app;
