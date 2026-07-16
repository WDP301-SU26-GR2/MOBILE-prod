import { apiClient } from './client';

export interface SeriesPublic {
  id: string;
  title: string;
  coverImage?: string;
  coverImageUrl?: string;
  synopsis?: string;
  mangakaName: string;
  genres: string[];
  publicationType?: string;
  latestChapterNumber?: number;
}

export const publicApi = {
  getLatestRanking: async () => {
    const res = await apiClient.get('/public/ranking/latest');
    return res.data?.data || [];
  },
  getCatalog: async (params?: { page?: number; limit?: number; publicationType?: string; genre?: string }) => {
    const res = await apiClient.get('/series', { params });
    return res.data?.data;
  },
  getSeriesDetail: async (id: string) => {
    const res = await apiClient.get(`/series/${id}`);
    return res.data?.data;
  },
  getChapterContent: async (chapterId: string) => {
    const res = await apiClient.get(`/public/chapters/${chapterId}`);
    return res.data?.data;
  },
  submitVote: async (chapterId: string, otp: string) => {
    const res = await apiClient.post(`/public/vote`, { chapterId, otp });
    return res.data;
  }
};
