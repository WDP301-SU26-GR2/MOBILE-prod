import { apiClient } from './client';

export const mangakaApi = {
  // Trang chủ (Overview cũ, vẫn dùng cho S-MGK-16)
  getOverview: async () => {
    const res = await apiClient.get('/studio/overview');
    return res.data?.data;
  },
  // Dashboards (Spec 18)
  getMangakaDashboard: async () => {
    const res = await apiClient.get('/dashboard/mangaka');
    return res.data?.data;
  },
  getMangakaEarningsDashboard: async () => {
    const res = await apiClient.get('/dashboard/mangaka/earnings');
    return res.data?.data;
  },
  getPayments: async (params?: any) => {
    const res = await apiClient.get('/payments', { params });
    return res.data?.data;
  },
  getAssistantDashboard: async () => {
    const res = await apiClient.get('/dashboard/assistant');
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
  getChapterProgress: async (chapterId: string) => {
    const res = await apiClient.get(`/chapters/${chapterId}/progress`);
    return res.data?.data;
  },
  getChapterNames: async (chapterId: string) => {
    const res = await apiClient.get(`/chapters/${chapterId}/names`);
    return res.data?.data;
  },
  submitChapter: async (chapterId: string) => {
    const res = await apiClient.post(`/chapters/${chapterId}/submit`);
    return res.data;
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
  // Mở lại Proposal bị huỷ/từ chối
  reopenSeries: async (seriesId: string) => {
    const res = await apiClient.post(`/series/${seriesId}/reopen`);
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
  getContracts: async (params?: any) => {
    const res = await apiClient.get('/contracts', { params });
    return res.data?.data;
  },
  getContract: async (id: string) => {
    const res = await apiClient.get(`/contracts/${id}`);
    return res.data?.data;
  },
  signContract: async (id: string, otp: string) => {
    const res = await apiClient.post(`/contracts/${id}/signatures/mangaka`, { otp });
    return res.data;
  },
  requestContractChanges: async (id: string, reason: string) => {
    const res = await apiClient.post(`/contracts/${id}/request-changes`, { reason });
    return res.data;
  },
  approveContract: async (id: string) => {
    const res = await apiClient.patch(`/contracts/${id}/status`, { status: 'MANGAKA_SIGNED' }); // Flow details depends on implementation
    return res.data;
  },
  getContractVersions: async (id: string) => {
    const res = await apiClient.get(`/contracts/${id}/versions`);
    return res.data?.data;
  },

  // Tasks - full workflow
  getTasks: async (params?: any) => {
    const res = await apiClient.get('/tasks', { params });
    return res.data?.data;
  },
  getTask: async (taskId: string) => {
    const res = await apiClient.get(`/tasks/${taskId}`);
    return res.data?.data;
  },
  getReviewTask: async (taskId: string) => {
    const res = await apiClient.get(`/tasks/${taskId}`);
    return res.data?.data;
  },
  startTask: async (taskId: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/start`);
    return res.data;
  },
  submitTask: async (taskId: string, resultKey: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/submit`, { resultFile: resultKey });
    return res.data;
  },
  approveTask: async (taskId: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/approve`);
    return res.data;
  },
  requestTaskRevision: async (taskId: string, reason: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/request-revision`, { reason });
    return res.data;
  },
  rejectTask: async (taskId: string, reason: string) => {
    const res = await apiClient.post(`/tasks/${taskId}/reject`, { reason });
    return res.data;
  },
  // Chapter Pages
  getChapterPages: async (chapterId: string) => {
    const res = await apiClient.get(`/chapters/${chapterId}/pages`);
    return res.data?.data;
  },
  createPage: async (chapterId: string, payload: { pageNumber: number; originalFile: string }) => {
    const res = await apiClient.post(`/chapters/${chapterId}/pages`, payload);
    return res.data?.data;
  },
  updatePage: async (pageId: string, payload: { compositeFile?: string }) => {
    const res = await apiClient.patch(`/pages/${pageId}`, payload);
    return res.data?.data;
  },
  // Manuscript submit
  submitManuscript: async (chapterId: string) => {
    const res = await apiClient.post(`/chapters/${chapterId}/manuscript/submit`);
    return res.data;
  },
  resubmitManuscript: async (chapterId: string) => {
    const res = await apiClient.post(`/chapters/${chapterId}/manuscript/resubmit`);
    return res.data;
  },
  // Assistant directory
  getAssistants: async (params?: any) => {
    const res = await apiClient.get('/assistants', { params });
    return res.data?.data;
  },
  getAssistantProfile: async (userId: string) => {
    const res = await apiClient.get(`/assistants/${userId}`);
    return res.data?.data;
  },
  getAssistantReviews: async (assistantId: string) => {
    const res = await apiClient.get('/assistant-reviews', { params: { assistantId } });
    return res.data?.data;
  },
  // Collaboration Invites
  getCollaborationInvites: async (params?: any) => {
    const res = await apiClient.get('/collaboration-invites', { params });
    return res.data?.data;
  },
  createCollaborationInvite: async (payload: any) => {
    const res = await apiClient.post('/collaboration-invites', payload);
    return res.data?.data;
  },
  acceptInvite: async (id: string) => {
    const res = await apiClient.post(`/collaboration-invites/${id}/accept`);
    return res.data;
  },
  declineInvite: async (id: string) => {
    const res = await apiClient.post(`/collaboration-invites/${id}/decline`);
    return res.data;
  },
  cancelInvite: async (id: string) => {
    const res = await apiClient.post(`/collaboration-invites/${id}/cancel`);
    return res.data;
  },
  // Studio Assignments
  getStudioAssignments: async (params?: any) => {
    const res = await apiClient.get('/studio-assignments', { params });
    return res.data?.data;
  },
  terminateAssignment: async (id: string, reason: string) => {
    const res = await apiClient.post(`/studio-assignments/${id}/terminate`, { reason });
    return res.data;
  },
  reviewAssistant: async (payload: { studioAssignmentId: string; rating: number; comment?: string }) => {
    const res = await apiClient.post('/assistant-reviews', payload);
    return res.data;
  },
  // Upload sign
  signUpload: async (payload: { fileName: string; contentType: string; contentLength: number; assetType?: string }) => {
    const res = await apiClient.post('/uploads/sign', payload);
    return res.data?.data;
  },
  // Deadline requests
  getDeadlineRequests: async (params?: any) => {
    const res = await apiClient.get('/deadline-requests', { params });
    return res.data?.data;
  },
  createDeadlineRequest: async (payload: { chapterId: string; requestedDeadline: string; reason: string }) => {
    const res = await apiClient.post('/deadline-requests', payload);
    return res.data?.data;
  },
  counterDeadlineRequest: async (id: string, payload: any) => {
    const res = await apiClient.post(`/deadline-requests/${id}/counter`, payload);
    return res.data;
  },
  agreeDeadlineRequest: async (id: string) => {
    const res = await apiClient.post(`/deadline-requests/${id}/agree`);
    return res.data;
  },
  withdrawDeadlineRequest: async (id: string) => {
    const res = await apiClient.post(`/deadline-requests/${id}/withdraw`);
    return res.data;
  },
  // Revisions
  getRevisionRequests: async (params?: any) => {
    const res = await apiClient.get('/revision-requests', { params });
    return res.data?.data;
  },
  // Rankings
  getRankings: async (params?: any) => {
    const res = await apiClient.get('/rankings', { params });
    return res.data?.data;
  },
  // Franchise Consent
  franchiseConsent: async (seriesId: string, approve: boolean) => {
    const res = await apiClient.post(`/series/${seriesId}/franchise-consent`, { approve });
    return res.data;
  },
  // Uploads
  getSignedUrl: async (key: string) => {
    try {
      const res = await apiClient.post('/uploads/sign-download', { key });
      return res.data?.data?.downloadUrl || res.data?.downloadUrl;
    } catch (e) {
      console.log('Error getting signed url', e);
      return null;
    }
  }
};
