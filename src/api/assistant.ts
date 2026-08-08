import { apiClient } from './client';
import { collectAllPages } from './pagination';

/** API surface intentionally limited to Assistant read operations. */
export const assistantReadApi = {
  getDashboard: async () => (await apiClient.get('/dashboard/assistant')).data?.data,
  getTasks: async (params?: any) => (await apiClient.get('/tasks', { params })).data?.data,
  getAllTasks: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/tasks', { params: page })).data?.data, params),
  getTask: async (id: string) => (await apiClient.get(`/tasks/${id}`)).data?.data,
  getTaskDownloadUrl: async (taskId: string, key: string) => {
    const response = await apiClient.post(`/tasks/${taskId}/download-url`, { key });
    return response.data?.data?.downloadUrl ?? response.data?.downloadUrl ?? null;
  },
  getSignedDownloadUrl: async (key: string) => {
    const response = await apiClient.post('/uploads/sign-download', { key });
    return response.data?.data?.downloadUrl ?? response.data?.downloadUrl ?? null;
  },
  getChapterPages: async (chapterId: string) => (await apiClient.get(`/chapters/${chapterId}/pages`)).data?.data,
  getAnnotations: async (params: { targetType: string; targetId: string; limit?: number; offset?: number }) => (await apiClient.get('/annotations', { params })).data?.data,
  getAllAnnotations: async (params: { targetType: string; targetId: string }) => collectAllPages(async (page) => (await apiClient.get('/annotations', { params: page })).data?.data, params),
  getCollaborationInvites: async (params?: any) => (await apiClient.get('/collaboration-invites', { params })).data?.data,
  getAllCollaborationInvites: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/collaboration-invites', { params: page })).data?.data, params),
  getCollaborationInvite: async (id: string) => (await apiClient.get(`/collaboration-invites/${id}`)).data?.data,
  getStudioAssignments: async (params?: any) => (await apiClient.get('/studio-assignments', { params })).data?.data,
  getAllStudioAssignments: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/studio-assignments', { params: page })).data?.data, params),
  getStudioAssignment: async (id: string) => (await apiClient.get(`/studio-assignments/${id}`)).data?.data,
  getProfile: async () => (await apiClient.get('/me/assistant-profile')).data?.data,
  getRevisionRequests: async (params?: any) => (await apiClient.get('/revision-requests', { params })).data?.data,
  getAllRevisionRequests: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/revision-requests', { params: page })).data?.data, params),
  getNotifications: async (params?: any) => (await apiClient.get('/notifications', { params })).data?.data,
  getAllNotifications: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/notifications', { params: page })).data?.data, params),
  markNotificationAsRead: async (id: string) => (await apiClient.patch(`/notifications/${id}/read`)).data,
  markAllNotificationsAsRead: async () => (await apiClient.patch('/notifications/read-all')).data,
};
