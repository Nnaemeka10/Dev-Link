import { axiosInstance } from '@lib/axios';


export interface SearchParams {
    query: string;
    filters?: string[];
    page?: number;
}

export interface SearchResult {
    id: string;
    title: string;
    description: string;
    url: string;
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
    page: number;
}

export const SearchApi = async (params: SearchParams): Promise<SearchResponse> => {
    const res = await axiosInstance.get('/api/searchJobs', {
        params: {
            q: params.query,
            filters: params.filters?.join(','),
            page: params.page || 1,
        }
    });
    return res.data;
};

// Mock version for now
export const searchAPIMock = async (params: SearchParams): Promise<SearchResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    results: [
      {
        id: '1',
        title: `Result for "${params.query}"`,
        description: 'Mock search result description',
        url: '/result/1'
      },
      {
        id: '2',
        title: `Another result for "${params.query}"`,
        description: 'Another mock description',
        url: '/result/2'
      }
    ],
    total: 2,
    page: 1
  };
};