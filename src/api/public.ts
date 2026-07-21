import { apiClient } from './client';

export type PublicationType = 'WEEKLY' | 'MONTHLY' | 'IRREGULAR';

// reCAPTCHA verification is currently disabled by the backend, but both vote
// endpoints still require this field in their request schema.
export const DISABLED_RECAPTCHA_TOKEN = 'captcha-disabled';

export interface VoteContextParams {
  publicationType?: Extract<PublicationType, 'WEEKLY' | 'MONTHLY'>;
}

export interface VotePayload {
  surveyPeriodId: string;
  identity: string;
  otpCode: string;
  seriesIds: string[];
  captchaToken: string;
}

export const publicApi = {
  getCatalog: async (params?: { q?: string; genre?: string; demographic?: string; publicationType?: string; status?: string; limit?: number; offset?: number }) => {
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
  getVoteContext: async (params?: VoteContextParams) => {
    const res = await apiClient.get('/vote/context', { params });
    return res.data?.data;
  },
  sendVoteOtp: async (identity: string, captchaToken = DISABLED_RECAPTCHA_TOKEN) => {
    const res = await apiClient.post('/vote/otp', { identity, captchaToken });
    return res.data;
  },
  submitVote: async (payload: Omit<VotePayload, 'captchaToken'> & { captchaToken?: string }) => {
    const res = await apiClient.post('/vote', { ...payload, captchaToken: payload.captchaToken || DISABLED_RECAPTCHA_TOKEN });
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


