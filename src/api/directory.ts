import { apiClient } from './client';

export const directoryApi = {
  getMangakas: async (params?: any) => {
    const response = await apiClient.get('/mangakas', { params });
    return response.data;
  },
  getAssistants: async (params?: any) => {
    const response = await apiClient.get('/assistants', { params });
    return response.data;
  },
  getCollaborationInvites: async (params?: any) => {
    const response = await apiClient.get('/collaboration-invites', { params });
    return response.data;
  },
  sendCollaborationInvite: async (data: any) => {
    const response = await apiClient.post('/collaboration-invites', data);
    return response.data;
  },
  acceptInvite: async (id: string) => {
    const response = await apiClient.post(`/collaboration-invites/${id}/accept`);
    return response.data;
  },
  declineInvite: async (id: string) => {
    const response = await apiClient.post(`/collaboration-invites/${id}/decline`);
    return response.data;
  },
  cancelInvite: async (id: string) => {
    const response = await apiClient.post(`/collaboration-invites/${id}/cancel`);
    return response.data;
  }
};
