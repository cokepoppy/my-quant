// 用户管理相关类型
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  roleDistribution: Array<{
    role: string;
    count: number;
  }>;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  preferences?: UserPreferences;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  role?: "user" | "admin";
  isActive?: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    strategy: boolean;
    trading: boolean;
    system: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

// 重新导出认证类型
export type { User, LoginData, RegisterData } from "./auth";
