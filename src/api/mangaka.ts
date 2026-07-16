import { apiClient } from './client';

export const mangakaApi = {
  // Trang chủ
  getOverview: async () => {
    const res = await apiClient.get('/studio/overview');
    return res.data?.data;
  },
  // Lấy danh sách series của mình
  getMySeries: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const res = await apiClient.get('/series', { params });
    return res.data?.data;
  },
  // Lấy chi tiết series
  getSeriesDetail: async (id: string) => {
    const res = await apiClient.get(`/series/${id}`);
    return res.data?.data;
  },
  // Các chapters
  getChapters: async (seriesId: string) => {
    const res = await apiClient.get(`/chapters`, { params: { seriesId } });
    return res.data?.data;
  },
  // Chi tiết chapter
  getChapterDetail: async (chapterId: string) => {
    const res = await apiClient.get(`/chapters/${chapterId}`);
    return res.data?.data;
  },
  // Tạo Proposal
  createProposal: async (payload: any) => {
    const res = await apiClient.post('/series/proposals', payload);
    return res.data?.data;
  },
  // Nộp Proposal
  submitProposal: async (seriesId: string) => {
    const res = await apiClient.post(`/series/${seriesId}/submit`);
    return res.data;
  },
  // Notifications
  getNotifications: async (params?: { limit?: number }) => {
    const res = await apiClient.get('/notifications', { params });
    return res.data?.data;
  },
  readNotification: async (id: string) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },
  readAllNotifications: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },
  deleteNotification: async (id: string) => {
    // Temporary endpoint, might return 404 if not implemented by backend
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },
  // Contracts
  getContract: async (id: string) => {
    const res = await apiClient.get(`/contracts/${id}`);
    return res.data?.data;
  },
  signContract: async (id: string, otp: string) => {
    const res = await apiClient.post(`/contracts/${id}/sign`, { otp });
    return res.data;
  },
  // Review Tasks
  getReviewTask: async (taskId: string) => {
    const res = await apiClient.get(`/tasks/${taskId}/review`);
    return res.data?.data;
  },
  approveTask: async (taskId: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/approve`);
    return res.data;
  },
  rejectTask: async (taskId: string, reason: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/reject`, { reason });
    return res.data;
  }
};
