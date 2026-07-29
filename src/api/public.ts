import { apiClient } from './client';

export type PublicationType = 'WEEKLY' | 'MONTHLY' | 'IRREGULAR';

// reCAPTCHA verification is currently disabled by the backend, but both vote
// endpoints still require this field in their request schema.
export const DISABLED_RECAPTCHA_TOKEN = 'captcha-disabled';

export interface VoteContextParams {
  periodId: string;
}

export interface OpenVotePeriodsParams {
  magazine?: string;
  publicationType?: PublicationType;
}

export interface RankingScope {
  magazine: string;
  publicationType: PublicationType;
}

export interface VotePayload {
  surveyPeriodId: string;
  identity: string;
  otpCode: string;
  seriesIds: string[];
  captchaToken: string;
}

type CatalogParams = { q?: string; genre?: string; demographic?: string; publicationType?: string; status?: string; limit?: number; offset?: number };

const getCatalogPage = async (params?: CatalogParams) => {
  const safeParams = { ...params, limit: Math.min(params?.limit ?? 20, 50) };
  const res = await apiClient.get('/public/series', { params: safeParams });
  return res.data?.data;
};

export const publicApi = {
  getCatalog: getCatalogPage,
  getAllCatalog: async (params?: Omit<CatalogParams, 'limit' | 'offset'>) => {
    const first = await getCatalogPage({ ...params, limit: 50, offset: 0 });
    const total = first?.total ?? first?.items?.length ?? 0;
    const remainingOffsets = Array.from({ length: Math.max(0, Math.ceil(total / 50) - 1) }, (_, index) => (index + 1) * 50);
    const rest = await Promise.all(remainingOffsets.map((offset) => getCatalogPage({ ...params, limit: 50, offset })));
    return { ...first, items: [first, ...rest].flatMap((page) => page?.items ?? []) };
  },
  getSeriesDetail: async (id: string): Promise<SeriesPublicDetail> => {
    const res = await apiClient.get(`/public/series/${id}`);
    return res.data?.data;
  },
  getChapterPages: async (chapterId: string) => {
    const res = await apiClient.get(`/public/chapters/${chapterId}/pages`);
    return res.data?.data;
  },
  getOpenVotePeriods: async (params?: OpenVotePeriodsParams) => {
    const res = await apiClient.get('/vote/periods/open', { params });
    return res.data?.data;
  },
  getVoteContext: async (params?: VoteContextParams) => {
    const res = await apiClient.get('/vote/context', { params });
    return res.data?.data;
  },
  getLiveVoteTally: async (periodId: string) => {
    const res = await apiClient.get('/vote/live', { params: { periodId } });
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
  getLatestRankingResults: async (params: RankingScope) => {
    const res = await apiClient.get('/vote/results/latest', { params });
    return res.data?.data;
  },
  getVotePeriods: async (params: RankingScope & { limit?: number }) => {
    const res = await apiClient.get('/vote/periods', {
      params: { ...params, limit: Math.min(params.limit ?? 24, 24) },
    });
    return res.data?.data;
  },
  getRankingResults: async (surveyPeriodId: string) => {
    const res = await apiClient.get('/vote/results', { params: { surveyPeriodId } });
    return res.data?.data;
  },
  getAggregateRanking: async (params: RankingScope & { year: number; level: 'MONTH' | 'YEAR'; month?: number }) => {
    const res = await apiClient.get('/rankings/aggregate', { params });
    return res.data?.data;
  },
};

export interface SeriesPublic {
  id: string;
  title: string;
  coverImageUrl: string | null;
  synopsis: string | null;
  genres: string[];
  demographic: string | null;
  status: string;
  magazine: string | null;
  publicationType: PublicationType | null;
  author: {
    displayName: string | null;
  };
  publishedChapterCount: number;
}

export interface PublicChapter {
  id: string;
  chapterNumber: number;
  title: string | null;
  publishedAt: string;
}

export interface SeriesPublicDetail extends SeriesPublic {
  chapters: PublicChapter[];
}


