import { apiClient } from './client';

export const publicApi = {
  getCatalog: async (params?: { q?: string; genre?: string; demographic?: string; publicationType?: string; limit?: number; offset?: number }) => {
    const res = await apiClient.get('/public/series', { params });
    return res.data?.data;
  },
  getSeriesDetail: async (id: string) => {
    const res = await apiClient.get(`/public/series/${id}`);
    return res.data?.data;
  },
  getChapterPages: async (chapterId: string) => {
    const res = await apiClient.get(`/public/chapters/${chapterId}/pages`);
    return res.data?.data;
  },
  getVoteContext: async () => {
    const res = await apiClient.get('/vote/context');
    return res.data?.data;
  },
  sendVoteOtp: async (identity: string, captchaToken: string) => {
    const res = await apiClient.post('/vote/otp', { identity, captchaToken });
    return res.data;
  },
  submitVote: async (payload: { surveyPeriodId: string; identity: string; otpCode: string; seriesIds: string[]; captchaToken: string }) => {
    const res = await apiClient.post('/vote', payload);
    return res.data;
  },
  getLatestRankingResults: async (params?: { publicationType?: string }) => {
    const res = await apiClient.get('/vote/results/latest', { params });
    return res.data?.data;
  },
  getVotePeriods: async () => {
    const res = await apiClient.get('/vote/periods');
    return res.data?.data;
  },
  getRankingResults: async (surveyPeriodId: string, publicationType?: string) => {
    const res = await apiClient.get('/vote/results', { params: { surveyPeriodId, publicationType } });
    return res.data?.data;
  },
};

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


