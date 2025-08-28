import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";

// 路由配置
const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: () => import("@/views/Dashboard.vue"),
    meta: {
      requiresAuth: true,
      title: "量化交易控制台",
    },
  },
  {
    path: "/dashboard",
    redirect: "/",
    meta: {
      requiresAuth: true,
      title: "仪表板",
    },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/Login.vue"),
    meta: {
      requiresAuth: false,
      title: "登录",
    },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/auth/Register.vue"),
    meta: {
      requiresAuth: false,
      title: "注册",
    },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("@/views/auth/ForgotPassword.vue"),
    meta: {
      requiresAuth: false,
      title: "忘记密码",
    },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("@/views/user/Profile.vue"),
    meta: {
      requiresAuth: true,
      title: "个人资料",
    },
  },
  {
    path: "/users",
    name: "Users",
    component: () => import("@/views/user/Users.vue"),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: "用户管理",
    },
  },
  {
    path: "/strategies",
    name: "Strategies",
    component: () => import("@/views/strategy/StrategyManagement.vue"),
    meta: {
      requiresAuth: true,
      title: "策略管理",
    },
    children: [
      {
        path: "",
        name: "StrategyList",
        component: () => import("@/views/strategy/StrategyList.vue"),
        meta: {
          requiresAuth: true,
          title: "策略列表",
        },
      },
      {
        path: "create",
        name: "CreateStrategy",
        component: () => import("@/views/strategy/CreateStrategy.vue"),
        meta: {
          requiresAuth: true,
          title: "创建策略",
        },
      },
      {
        path: ":id",
        name: "StrategyDetail",
        component: () => import("@/views/strategy/StrategyDetail.vue"),
        meta: {
          requiresAuth: true,
          title: "策略详情",
        },
      },
      {
        path: ":id/edit",
        name: "EditStrategy",
        component: () => import("@/views/strategy/EditStrategy.vue"),
        meta: {
          requiresAuth: true,
          title: "编辑策略",
        },
      },
    ],
  },
  {
    path: "/strategies/:id/performance",
    name: "StrategyPerformance",
    component: () => import("@/views/strategy/StrategyPerformance.vue"),
    meta: {
      requiresAuth: true,
      title: "策略性能",
    },
  },
  {
    path: "/strategies/:id/logs",
    name: "StrategyLogs",
    component: () => import("@/views/strategy/StrategyLogs.vue"),
    meta: {
      requiresAuth: true,
      title: "策略日志",
    },
  },
  {
    path: "/backtest",
    name: "Backtest",
    component: () => import("@/views/backtest/Backtest.vue"),
    meta: {
      requiresAuth: true,
      title: "回测分析",
    },
  },
  {
    path: "/backtest/new",
    name: "NewBacktestTest",
    component: () => import("@/views/backtest/NewBacktestTest.vue"),
    meta: {
      requiresAuth: true,
      title: "新回测测试",
    },
  },
  {
    path: "/backtest/:id",
    name: "BacktestResult",
    component: () => import("@/views/backtest/BacktestResult.vue"),
    meta: {
      requiresAuth: true,
      title: "回测结果",
    },
  },
  {
    path: "/trading",
    name: "Trading",
    component: () => import("@/views/trading/Trading.vue"),
    meta: {
      requiresAuth: true,
      title: "交易管理",
    },
  },
  {
    path: "/accounts",
    name: "Accounts",
    component: () => import("@/views/accounts/Accounts.vue"),
    meta: {
      requiresAuth: true,
      title: "账户管理",
    },
  },
  {
    path: "/market",
    name: "MarketData",
    component: () => import("@/views/market/MarketData.vue"),
    meta: {
      requiresAuth: true,
      title: "市场数据",
    },
    children: [
      {
        path: "",
        name: "MarketDataMain",
        component: () => import("@/views/market/MarketData.vue"),
        meta: {
          requiresAuth: true,
          title: "市场数据",
        },
      },
      {
        path: "data-source-test",
        name: "DataSourceTest",
        component: () => import("@/views/market/DataSourceTest.vue"),
        meta: {
          requiresAuth: true,
          title: "数据源测试",
        },
      },
      {
        path: "data-import",
        name: "DataImport",
        component: () => import("@/views/market/DataImport.vue"),
        meta: {
          requiresAuth: true,
          title: "数据导入",
        },
      },
    ],
  },
  {
    path: "/monitoring",
    name: "Monitoring",
    component: () => import("@/views/monitoring/Monitoring.vue"),
    meta: {
      requiresAuth: true,
      title: "系统监控",
    },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("@/views/settings/Settings.vue"),
    meta: {
      requiresAuth: true,
      title: "系统设置",
    },
  },
  {
    path: "/403",
    name: "Forbidden",
    component: () => import("@/views/error/403.vue"),
    meta: {
      requiresAuth: false,
      title: "权限不足",
    },
  },
  {
    path: "/404",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
    meta: {
      requiresAuth: false,
      title: "页面未找到",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 设置页面标题
  document.title = to.meta.title
    ? `${to.meta.title} - 量化交易系统`
    : "量化交易系统";

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning("请先登录");
      next("/login");
      return;
    }

    // 检查是否需要管理员权限
    if (to.meta.requiresAdmin) {
      if (!authStore.hasRole("admin")) {
        ElMessage.error("权限不足");
        next("/403");
        return;
      }
    }
  }

  // 如果用户已登录，访问登录或注册页面，重定向到首页
  if (
    authStore.isAuthenticated &&
    (to.path === "/login" || to.path === "/register")
  ) {
    next("/");
    return;
  }

  next();
});

// 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
});

// 路由错误处理
router.onError((error) => {
  console.error("Router error:", error);
  ElMessage.error("路由错误，请刷新页面重试");
});

export default router;
