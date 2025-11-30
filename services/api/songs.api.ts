import axios, { AxiosInstance } from 'axios';

export interface SavedSong {
  id: string;
  title: string;
  content: string;
  suno_content: string | null;
  suno_style_prompt: string | null;
  language: string | null;
  theme: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateSongData {
  title: string;
  content: string;
  suno_content?: string;
  suno_style_prompt?: string;
  language?: string;
  theme?: string;
}

export interface UpdateSongData {
  title?: string;
  content?: string;
  suno_content?: string;
  suno_style_prompt?: string;
  language?: string;
  theme?: string;
}

class SongsAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/songs',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllSongs(limit?: number, offset?: number): Promise<{ songs: SavedSong[]; total: number }> {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await this.client.get('/', { params });
    return response.data;
  }

  async getSong(id: string): Promise<SavedSong> {
    const response = await this.client.get<SavedSong>(`/${id}`);
    return response.data;
  }

  async createSong(data: CreateSongData): Promise<SavedSong> {
    const response = await this.client.post<SavedSong>('/', data);
    return response.data;
  }

  async updateSong(id: string, data: UpdateSongData): Promise<SavedSong> {
    const response = await this.client.put<SavedSong>(`/${id}`, data);
    return response.data;
  }

  async deleteSong(id: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/${id}`);
    return response.data;
  }

  async bulkCreateSongs(songs: any[]): Promise<{ message: string; songs: SavedSong[] }> {
    const response = await this.client.post('/bulk', { songs });
    return response.data;
  }
}

export const songsAPI = new SongsAPI();
