import { apiClient } from './client';
import { collectAllOffsetPages, collectAllPages } from './pagination';

/**
 * Mobile's Mangaka surface is deliberately read-only. Do not add workflow
 * mutations here: the internal mobile companion supports GET routes only.
 */
export const mangakaApi = {
  getOverview: async () => (await apiClient.get('/studio/overview')).data?.data,
  getMangakaDashboard: async () => (await apiClient.get('/dashboard/mangaka')).data?.data,
  getMangakaEarningsDashboard: async () => (await apiClient.get('/dashboard/mangaka/earnings')).data?.data,
  getMySeries: async (params?: { status?: string; limit?: number; offset?: number }) => (await apiClient.get('/series', { params })).data?.data,
  getAllMySeries: async (params?: { status?: string }) => collectAllPages(async (page) => (await apiClient.get('/series', { params: page })).data?.data, params),
  getSeriesDetail: async (id: string) => (await apiClient.get(`/series/${id}`)).data?.data,
  getChapters: async (seriesId: string) => (await apiClient.get('/chapters', { params: { seriesId } })).data?.data,
  getChapterDetail: async (chapterId: string) => (await apiClient.get(`/chapters/${chapterId}`)).data?.data,
  getChapterProgress: async (chapterId: string) => (await apiClient.get(`/chapters/${chapterId}/progress`)).data?.data,

  getNotifications: async (params?: { limit?: number }) => (await apiClient.get('/notifications', { params })).data?.data,
  getAllNotifications: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/notifications', { params: page })).data?.data, params),
  getContracts: async (params?: any) => (await apiClient.get('/contracts', { params })).data?.data,
  getContract: async (id: string) => (await apiClient.get(`/contracts/${id}`)).data?.data,
  getContractVersions: async (id: string) => (await apiClient.get(`/contracts/${id}/versions`)).data?.data,
  getContractPdf: async (id: string) => (await apiClient.get(`/contracts/${id}/pdf`)).data?.data,
  getTasks: async (params?: any) => (await apiClient.get('/tasks', { params })).data?.data,
  getAllTasks: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/tasks', { params: page })).data?.data, params),
  getTask: async (taskId: string) => (await apiClient.get(`/tasks/${taskId}`)).data?.data,
  getReviewTask: async (taskId: string) => (await apiClient.get(`/tasks/${taskId}`)).data?.data,
  // Guide-approved signed read URL; this POST never mutates domain state.
  getTaskDownloadUrl: async (taskId: string, key: string) => {
    const response = await apiClient.post(`/tasks/${taskId}/download-url`, { key });
    return response.data?.data?.downloadUrl ?? response.data?.downloadUrl ?? null;
  },
  getChapterPages: async (chapterId: string) => (await apiClient.get(`/chapters/${chapterId}/pages`)).data?.data,
  getAssistants: async (params?: any) => (await apiClient.get('/assistants', { params })).data?.data,
  getAllAssistants: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/assistants', { params: page })).data?.data, params),
  getAssistantProfile: async (userId: string) => (await apiClient.get(`/assistants/${userId}`)).data?.data,
  getAssistantReviews: async (assistantId: string) => (await apiClient.get('/assistant-reviews', { params: { assistantId } })).data?.data,
  getAllAssistantReviews: async (assistantId: string) => collectAllOffsetPages(async (page) => (await apiClient.get('/assistant-reviews', { params: { ...page, assistantId } })).data?.data),
  getCollaborationInvites: async (params?: any) => (await apiClient.get('/collaboration-invites', { params })).data?.data,
  getStudioAssignments: async (params?: any) => (await apiClient.get('/studio-assignments', { params })).data?.data,
  getAllCollaborationInvites: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/collaboration-invites', { params: page })).data?.data, params),
  getAllStudioAssignments: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/studio-assignments', { params: page })).data?.data, params),
  getDeadlineRequests: async (params?: any) => (await apiClient.get('/deadline-requests', { params })).data?.data,
  getRevisionRequests: async (params?: any) => (await apiClient.get('/revision-requests', { params })).data?.data,
  getAllRevisionRequests: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/revision-requests', { params: page })).data?.data, params),
  getRankings: async (params?: any) => (await apiClient.get('/rankings', { params })).data?.data,
  getChapterStoryboards: async (chapterId: string) => (await apiClient.get(`/chapters/${chapterId}/storyboards`)).data?.data,
  getChapterStoryboard: async (chapterId: string, storyboardId: string) => (await apiClient.get(`/chapters/${chapterId}/storyboards/${storyboardId}`)).data?.data,
  getProductionStages: async (chapterId: string) => (await apiClient.get(`/chapters/${chapterId}/stages`)).data?.data,
  getStagePages: async (chapterId: string, stageId: string) => (await apiClient.get(`/chapters/${chapterId}/stages/${stageId}/pages`)).data?.data,
  getPageRegions: async (pageId: string) => (await apiClient.get(`/pages/${pageId}/regions`)).data?.data,
  getAiJob: async (jobId: string) => (await apiClient.get(`/ai-jobs/${jobId}`)).data?.data,
  getPageAiJobs: async (pageId: string) => (await apiClient.get(`/pages/${pageId}/ai-jobs`)).data?.data,
  getAnnotations: async (params: { targetType: string; targetId: string; limit?: number; offset?: number }) => (await apiClient.get('/annotations', { params })).data?.data,
  getAllAnnotations: async (params: { targetType: string; targetId: string }) => collectAllPages(async (page) => (await apiClient.get('/annotations', { params: page })).data?.data, params),
  getCollaborationInvite: async (id: string) => (await apiClient.get(`/collaboration-invites/${id}`)).data?.data,
  getStudioAssignment: async (id: string) => (await apiClient.get(`/studio-assignments/${id}`)).data?.data,
  getContractStatus: async (id: string) => (await apiClient.get(`/contracts/${id}/status`)).data?.data,
  getContractVersion: async (contractId: string, versionId: string) => (await apiClient.get(`/contracts/${contractId}/versions/${versionId}`)).data?.data,
  getContractAmendments: async (contractId: string) => (await apiClient.get(`/contracts/${contractId}/amendments`)).data?.data,
  getContractAmendment: async (contractId: string, amendmentId: string) => (await apiClient.get(`/contracts/${contractId}/amendments/${amendmentId}`)).data?.data,
  getPaymentConditions: async (contractId: string) => (await apiClient.get(`/contracts/${contractId}/payment-conditions`)).data?.data,
  getPayment: async (id: string) => (await apiClient.get(`/payments/${id}`)).data?.data,
  getContractPayments: async (contractId: string) => (await apiClient.get(`/payments/contracts/${contractId}/payments`)).data?.data,
  getSeriesPayments: async (seriesId: string) => (await apiClient.get(`/payments/series/${seriesId}/payments`)).data?.data,
  getUserPayments: async (userId: string) => (await apiClient.get(`/payments/users/${userId}/payments`)).data?.data,
  getDeadlineRequest: async (id: string) => (await apiClient.get(`/deadline-requests/${id}`)).data?.data,
  getReprintRequests: async (params?: any) => (await apiClient.get('/reprint-requests', { params })).data?.data,
  getReprintRequest: async (id: string) => (await apiClient.get(`/reprint-requests/${id}`)).data?.data,
  getReprintChapters: async (id: string) => (await apiClient.get(`/reprint-requests/${id}/chapters`)).data?.data,
  getReprintChapter: async (id: string, chapterId: string) => (await apiClient.get(`/reprint-requests/${id}/chapters/${chapterId}`)).data?.data,
  getTransferRequests: async (params?: any) => (await apiClient.get('/transfers/requests/mine', { params })).data?.data,
  getTransferRequest: async (id: string) => (await apiClient.get(`/transfers/requests/${id}`)).data?.data,
  getTransferSignatures: async (contractId: string) => (await apiClient.get(`/transfers/contracts/${contractId}/signatures`)).data?.data,
  getPublicationVersions: async (seriesId: string) => (await apiClient.get(`/series/${seriesId}/publication-versions`)).data?.data,
  getPublicationVersion: async (id: string) => (await apiClient.get(`/publication-versions/${id}`)).data?.data,
  getMangakaProfile: async () => (await apiClient.get('/me/mangaka-profile')).data?.data,
  getMangakas: async (params?: any) => (await apiClient.get('/mangakas', { params })).data?.data,
  getAllMangakas: async (params?: any) => collectAllPages(async (page) => (await apiClient.get('/mangakas', { params: page })).data?.data, params),
  getBoardRankings: async (surveyPeriodId: string) => (await apiClient.get('/rankings/board', { params: { surveyPeriodId } })).data?.data,
  // Spec 30+31: Series Requests
  getSeriesRequests: async (params?: { seriesId?: string; status?: string; requestType?: string; limit?: number; offset?: number }) => (await apiClient.get('/series-requests', { params })).data?.data,
  getAllSeriesRequests: async (params?: { seriesId?: string; status?: string; requestType?: string }) => collectAllPages(async (page) => (await apiClient.get('/series-requests', { params: page })).data?.data, params),
  getSeriesRequest: async (id: string) => (await apiClient.get(`/series-requests/${id}`)).data?.data,
  // Guide-approved signed read URL; this POST never mutates domain state.
  getSignedUrl: async (key: string) => {
    const response = await apiClient.post('/uploads/sign-download', { key });
    return response.data?.data?.downloadUrl ?? response.data?.downloadUrl ?? null;
  },
};
