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
  // Collaboration workflow actions are intentionally web-only.
};
