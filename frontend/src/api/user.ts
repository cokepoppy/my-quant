import { get, put, del } from "./base";
import { User, UserStats } from "@/types/user";

// 获取用户列表
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const response = await get<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }>("/users", { params });
  return response;
};

// 获取用户详情
export const getUserById = async (id: string) => {
  const response = await get<User>(`/users/${id}`);
  return response;
};

// 更新用户信息
export const updateUser = async (id: string, data: Partial<User>) => {
  const response = await put<User>(`/users/${id}`, data);
  return response;
};

// 删除用户
export const deleteUser = async (id: string) => {
  const response = await del(`/users/${id}`);
  return response;
};

// 获取用户统计
export const getUserStats = async () => {
  const response = await get<UserStats>("/users/stats/overview");
  return response;
};

// 启用/禁用用户
export const toggleUserStatus = async (id: string, isActive: boolean) => {
  const response = await put(`/users/${id}/status`, { isActive });
  return response;
};

// 重置用户密码
export const resetUserPassword = async (id: string, newPassword: string) => {
  const response = await put(`/users/${id}/password`, { newPassword });
  return response;
};

export default {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  toggleUserStatus,
  resetUserPassword,
};
